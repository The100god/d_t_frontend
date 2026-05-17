import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DrawingCanvas from '../components/DrawingCanvas';
import { Clock, Send, Upload, ChevronLeft, ChevronRight } from 'lucide-react';

const AttemptQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawingBoards, setDrawingBoards] = useState({});
  const [activeBoardIdx, setActiveBoardIdx] = useState({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/quizzes/${id}`);
        setQuiz(res.data);
        setTimeLeft(res.data.timeLimit * 60);
      } catch (err) {
        console.error('Error fetching quiz:', err);
      }
    };
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAnswerChange = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleFileUpload = async (qId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/submissions/upload`, formData);
      handleAnswerChange(qId, res.data.imageUrl);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const submissionData = {
      quizId: id,
      answers: Object.entries(answers).map(([qId, val]) => {
        const qType = quiz.questions.find(q => q._id === qId).type;
        const answerObj = { questionId: qId };
        if (qType === 'MCQ') {
          answerObj.optionId = val;
        } else if (typeof val === 'string' && (val.startsWith('/uploads/') || val.startsWith('data:image'))) {
          answerObj.imageAnswer = val;
        } else {
          answerObj.textAnswer = val;
        }
        return answerObj;
      })
    };
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/submissions`, submissionData);
      navigate(`/results/${res.data._id}`);
    } catch (err) {
      console.error('Submission error:', err);
      setIsSubmitting(false);
    }
  };

  if (!quiz) {
    return (
      <div className="container mx-auto p-6 max-w-4xl min-h-screen flex flex-col space-y-8 animate-pulse">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-8 skeleton w-64 animate-pulse" />
            <div className="h-4 skeleton w-32 animate-pulse" />
          </div>
          <div className="h-10 skeleton w-28 animate-pulse" />
        </div>

        {/* Question Area Skeleton */}
        <div className="flex-grow h-96 skeleton animate-pulse" />

        {/* Footer Buttons Skeleton */}
        <div className="flex justify-between">
          <div className="h-10 skeleton w-24 animate-pulse" />
          <div className="h-10 skeleton w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentQuestion];
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          <p className="text-slate-400">Question {currentQuestion + 1} of {quiz.questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${timeLeft < 60 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="glass-card p-8 mb-8 flex-grow">
        <h2 className="text-2xl font-semibold text-white mb-8">{q.text}</h2>

        {q.type === 'MCQ' && (
          <div className="space-y-4">
            {q.options.map((opt) => (
              <button
                key={opt._id}
                onClick={() => handleAnswerChange(q._id, opt._id)}
                className={`w-full p-4 rounded-xl text-left border transition-all ${answers[q._id] === opt._id ? 'border-vibrant-primary bg-vibrant-primary/10 text-white' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {(q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
          <div className="space-y-6">
            <textarea
              className="input-field min-h-[150px]"
              placeholder="Type your answer here..."
              value={answers[q._id] || ''}
              onChange={(e) => handleAnswerChange(q._id, e.target.value)}
            />
            <div className="flex items-center gap-4">
              <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm">
                <Upload size={16} /> Upload handwritten solution
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(q._id, e.target.files[0])} />
              </label>
              {answers[q._id]?.startsWith('/uploads/') && <span className="text-emerald-500 text-sm">Image uploaded!</span>}
            </div>
          </div>
        )}

        {q.type === 'DRAWING' && (() => {
          const boards = drawingBoards[q._id] || [{ id: 1, uploadedUrl: null }];
          const activeIdx = activeBoardIdx[q._id] || 0;
          const currentBoard = boards[activeIdx] || boards[0];

          const handleAddBoard = () => {
            const newBoards = [...boards, { id: Date.now(), uploadedUrl: null }];
            setDrawingBoards(prev => ({ ...prev, [q._id]: newBoards }));
            setActiveBoardIdx(prev => ({ ...prev, [q._id]: newBoards.length - 1 }));
          };

          const handleDeleteBoard = (idxToDelete) => {
            if (boards.length <= 1) return;
            const newBoards = boards.filter((_, idx) => idx !== idxToDelete);
            setDrawingBoards(prev => ({ ...prev, [q._id]: newBoards }));
            const nextActiveIdx = Math.max(0, activeIdx - 1);
            setActiveBoardIdx(prev => ({ ...prev, [q._id]: nextActiveIdx }));
            
            const uploadedUrls = newBoards.map(b => b.uploadedUrl).filter(Boolean);
            handleAnswerChange(q._id, uploadedUrls.join(','));
          };

          const handleSaveBoard = async (dataUrl) => {
            try {
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              const file = new File([blob], `drawing_${currentBoard.id}.png`, { type: 'image/png' });
              
              const formData = new FormData();
              formData.append('image', file);
              const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/submissions/upload`, formData);
              const imageUrl = uploadRes.data.imageUrl;

              const updatedBoards = boards.map((b, idx) => 
                idx === activeIdx ? { ...b, uploadedUrl: imageUrl } : b
              );
              
              setDrawingBoards(prev => ({ ...prev, [q._id]: updatedBoards }));
              
              const uploadedUrls = updatedBoards.map(b => b.uploadedUrl).filter(Boolean);
              handleAnswerChange(q._id, uploadedUrls.join(','));
            } catch (err) {
              console.error('Error saving board drawing:', err);
            }
          };

          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                {boards.map((board, idx) => (
                  <div key={board.id} className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1 pr-2 border border-white/5 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      type="button"
                      onClick={() => setActiveBoardIdx(prev => ({ ...prev, [q._id]: idx }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                        activeIdx === idx 
                          ? 'bg-vibrant-primary text-white font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${board.uploadedUrl ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 animate-pulse' : 'bg-slate-600'}`} />
                        Board {idx + 1}
                      </span>
                    </button>
                    {boards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBoard(idx)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded-md transition-all cursor-pointer font-bold text-xs"
                        title="Delete Board"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddBoard}
                  className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-semibold"
                >
                  + Add Board
                </button>
              </div>

              <div key={`${q._id}_board_${currentBoard.id}`} className="space-y-4 animate-in fade-in duration-300">
                <p className="text-sm text-slate-400 font-medium">
                  Drawing on <span className="text-white font-bold">Board {activeIdx + 1}</span>
                </p>
                <DrawingCanvas 
                  onSave={handleSaveBoard} 
                  initialImage={currentBoard.uploadedUrl ? (currentBoard.uploadedUrl.startsWith('data:image') ? currentBoard.uploadedUrl : `${import.meta.env.VITE_API_URL}${currentBoard.uploadedUrl}`) : null}
                />
              </div>

              {(() => {
                const totalBoards = boards.length;
                const savedBoards = boards.filter(b => b.uploadedUrl).length;
                if (savedBoards > 0) {
                  return (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>{savedBoards} / {totalBoards} board(s) saved and uploaded successfully!</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        })()}
      </div>

      <div className="flex justify-between">
        <button
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
          className="btn-secondary flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        {currentQuestion === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2 bg-emerald-600 shadow-emerald-900/20"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            <Send size={18} />
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className="btn-primary flex items-center gap-2"
          >
            Next <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AttemptQuiz;
