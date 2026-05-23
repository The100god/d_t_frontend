import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Save, X, Upload } from 'lucide-react';
import DrawingCanvas from '../components/DrawingCanvas';
import ImageUploadAndCapture from '../components/ImageUploadAndCapture';

const CreateQuiz = () => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [totalMarks, setTotalMarks] = useState(10);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  const addQuestion = (type) => {
    const newQuestion = {
      type,
      text: '',
      options: type === 'MCQ' ? [
        { text: '', image: '', isCorrect: true },
        { text: '', image: '', isCorrect: false }
      ] : [],
      correctAnswer: '',
      imageHint: '',
      marks: 1,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex][field] = value;
    if (field === 'isCorrect' && value === true) {
      updated[qIndex].options.forEach((o, i) => {
        if (i !== oIndex) o.isCorrect = false;
      });
    }
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].options.push({ text: '', image: '', isCorrect: false });
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/quizzes`, { 
        title, 
        subject, 
        timeLimit, 
        totalMarks: Number(totalMarks), 
        questions 
      });
      navigate('/');
    } catch (err) {
      console.error('Error creating quiz:', err);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Create New Quiz</h1>
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save size={18} /> Publish Quiz
          </button>
        </div>

        <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Quiz Title</label>
            <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Subject</label>
            <input className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Time Limit (mins)</label>
            <input type="number" className="input-field" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Total Marks</label>
            <input type="number" className="input-field" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="glass-card p-6 space-y-4 relative">
              <button 
                type="button" 
                onClick={() => removeQuestion(qIndex)}
                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-vibrant-primary uppercase tracking-tighter">
                Question {qIndex + 1} • {q.type.replace('_', ' ')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="md:col-span-3">
                  <input 
                    className="input-field text-lg font-medium" 
                    placeholder="Enter question text here..."
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <ImageUploadAndCapture 
                    value={q.imageHint} 
                    onChange={(val) => updateQuestion(qIndex, 'imageHint', val)}
                    label="Add Question Image"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Question Marks</label>
                  <input 
                    type="number"
                    className="input-field py-1 h-9 text-sm" 
                    value={q.marks}
                    onChange={(e) => updateQuestion(qIndex, 'marks', Number(e.target.value))}
                    required
                  />
                </div>
                <div className="flex-[3]" />
              </div>

              {q.type === 'MCQ' && (
                <div className="space-y-3">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex gap-3 items-center">
                      <input 
                        type="radio" 
                        name={`correct-${qIndex}`} 
                        checked={opt.isCorrect}
                        onChange={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                        className="cursor-pointer"
                      />
                      <div className="flex-grow">
                        <input 
                          className="input-field" 
                          placeholder={`Option ${oIndex + 1}`}
                          value={opt.text}
                          onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                          required
                        />
                      </div>
                      <div className="shrink-0">
                        <ImageUploadAndCapture 
                          value={opt.image} 
                          onChange={(val) => updateOption(qIndex, oIndex, 'image', val)}
                          label="Add Option Image"
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addOption(qIndex)} className="text-sm text-vibrant-secondary hover:underline cursor-pointer">+ Add Option</button>
                </div>
              )}

              {(q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
                <textarea 
                  className="input-field" 
                  placeholder="Reference answer or solution guide..."
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                />
              )}

              {q.type === 'DRAWING' && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-400 italic">Provide a reference drawing or upload a solution image:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase">Draw Solution</p>
                      <DrawingCanvas onSave={(data) => updateQuestion(qIndex, 'correctAnswer', data)} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase">Or Upload Image</p>
                      <div className="flex flex-col items-center justify-center border border-dashed border-white/20 rounded-xl p-8 bg-white/5 h-[300px]">
                        <label className="btn-secondary cursor-pointer flex items-center gap-2">
                          <Upload size={18} /> Upload Solution
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('image', file);
                                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/submissions/upload`, formData);
                                updateQuestion(qIndex, 'correctAnswer', res.data.imageUrl);
                              }
                            }} 
                          />
                        </label>
                        {q.correctAnswer?.startsWith('/uploads/') && <p className="mt-2 text-emerald-500 text-xs font-bold">Image Uploaded!</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 justify-center py-10">
          <button type="button" onClick={() => addQuestion('MCQ')} className="btn-secondary">+ MCQ</button>
          <button type="button" onClick={() => addQuestion('SHORT_ANSWER')} className="btn-secondary">+ Short Answer</button>
          <button type="button" onClick={() => addQuestion('LONG_ANSWER')} className="btn-secondary">+ Long Answer</button>
          <button type="button" onClick={() => addQuestion('DRAWING')} className="btn-secondary">+ Drawing</button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz;
