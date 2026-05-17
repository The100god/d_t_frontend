import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, ChevronLeft, Award, BookOpen } from 'lucide-react';

const StudentResults = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawingPages, setDrawingPages] = useState({});
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    images: [],
    activeIndex: 0,
    title: ''
  });

  const isLightMode = localStorage.getItem('app-mode') === 'light';

  const openLightbox = (imageStr, index = 0, title = 'Student Answer') => {
    if (!imageStr) return;
    const imgs = imageStr.split(',').filter(Boolean);
    setLightbox({
      isOpen: true,
      images: imgs,
      activeIndex: index,
      title
    });
  };

  const fetchResults = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/submissions/${id}`);
      setSubmission(res.data);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGrade = async (questionId, isCorrect) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/submissions/grade`, {
        submissionId: id,
        questionId,
        isCorrect,
        score: isCorrect ? 1 : 0
      });
      // Refetch to get fully populated submission data
      fetchResults();
    } catch (err) {
      console.error('Error updating grade:', err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3 flex-grow">
            <div className="h-8 skeleton w-1/3" />
            <div className="h-4 skeleton w-1/4" />
          </div>
          <div className="h-10 skeleton w-24" />
        </div>

        {/* Score Card Skeleton */}
        <div className="h-48 skeleton animate-pulse" />

        {/* Questions List Skeleton */}
        <div className="space-y-6">
          <div className="h-40 skeleton animate-pulse" />
          <div className="h-40 skeleton animate-pulse" />
          <div className="h-40 skeleton animate-pulse" />
        </div>
      </div>
    );
  }
  if (!submission) return <div className="min-h-screen flex items-center justify-center text-white">Result not found.</div>;

  // SECURITY: Students can only view results if status is 'graded'
  if (user.role === 'student' && submission.status !== 'graded') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 animate-pulse">
          <BookOpen size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Result Under Review</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Your quiz has been submitted successfully! However, some questions (like drawings or long answers) require manual review by your teacher.
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-slate-300 max-w-sm">
          <p className="text-sm">You will be able to see your detailed score and feedback once your teacher has finished grading your attempt.</p>
        </div>
        <Link to="/" className="btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const { quiz, answers, gainedMarks, totalMarks } = submission;
  const percentage = (gainedMarks / (totalMarks || 1)) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
        <ChevronLeft size={20} /> Back to Dashboard
      </Link>

      <div className="glass-card p-8 mb-10 text-center relative overflow-hidden">
        <h1 className="text-4xl font-bold text-white mb-2">{quiz.title} Results</h1>
        <div className="flex flex-col items-center gap-1 mb-6">
          <p className="text-vibrant-primary font-semibold uppercase tracking-wider">{submission.student.name}</p>
          <p className="text-slate-400 text-sm">{submission.student.studentClass} • {submission.student.stream} • {quiz.subject}</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="64" cy="64" r="58"
                fill="transparent"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              <circle
                cx="64" cy="64" r="58"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * percentage) / 100}
                className="text-vibrant-primary transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{gainedMarks}/{totalMarks}</span>
              <span className="text-xs text-slate-400">SCORE</span>
            </div>
          </div>
          <p className="mt-4 text-xl font-semibold text-slate-200">
            {percentage >= 80 ? 'Excellent Work!' : percentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen size={24} /> Detailed Review
        </h2>

        {quiz.questions.map((question, index) => {
          const studentAnswer = answers.find(a => a.questionId === question._id);
          const isCorrect = studentAnswer?.isCorrect;

          return (
            <div key={question._id} className="glass-card p-6 border-l-4 overflow-hidden" style={{ borderLeftColor: isCorrect ? '#10b981' : '#ef4444' }}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 pb-4 border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-slate-400 text-sm font-medium">Question {index + 1}</span>
                  {isCorrect ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-emerald-500 text-xs sm:text-sm font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle size={14} /> CORRECT
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{studentAnswer?.score}/{studentAnswer?.maxMarks} Marks</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-red-500 text-xs sm:text-sm font-bold bg-red-500/10 px-2.5 py-1 rounded-full">
                        <XCircle size={14} /> INCORRECT
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{studentAnswer?.score}/{studentAnswer?.maxMarks} Marks</span>
                    </div>
                  )}
                </div>

                {user.role === 'admin' && question.type !== 'MCQ' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto sm:border-l sm:border-white/10 sm:pl-4">
                    <span className="text-xs text-slate-500 font-medium sm:hidden">Teacher Grading Action:</span>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleManualGrade(question._id, true)}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${isCorrect
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/10'
                          }`}
                        title="Mark as Correct"
                      >
                        <CheckCircle size={16} />
                        <span>Correct</span>
                      </button>
                      <button
                        onClick={() => handleManualGrade(question._id, false)}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${!isCorrect
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                          : 'bg-white/5 text-red-500 hover:bg-red-500/10 border border-red-500/10'
                          }`}
                        title="Mark as Incorrect"
                      >
                        <XCircle size={16} />
                        <span>Incorrect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-lg text-white font-medium mb-4">{question.text}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Your Answer</p>
                  <div className="p-4 bg-white/5 rounded-xl text-slate-200 border border-white/5">
                    {question.type === 'MCQ' ? (
                      question.options.find(o => o._id.toString() === studentAnswer?.optionId?.toString())?.text || 'No answer selected'
                    ) : (
                      studentAnswer?.textAnswer || 'No answer provided'
                    )}
                    {studentAnswer?.imageAnswer && (() => {
                      const images = studentAnswer.imageAnswer.split(',').filter(Boolean);
                      const activePage = drawingPages[question._id] || 0;
                      const currentImage = images[activePage] || images[0];

                      return (
                        <div className="space-y-3 mt-2">
                          <div
                            onClick={() => openLightbox(studentAnswer.imageAnswer, activePage, `${submission.student.name}'s Answer`)}
                            className="rounded-lg overflow-hidden border border-white/10 relative cursor-zoom-in hover:border-vibrant-primary/50 transition-all group"
                            title="Click to view full screen"
                          >
                            <img
                              src={currentImage.startsWith('data:image') ? currentImage : `${import.meta.env.VITE_API_URL}${currentImage}`}
                              alt={`Your answer - Board ${activePage + 1}`}
                              className="max-h-60 object-contain mx-auto bg-black group-hover:scale-[1.01] transition-transform duration-300"
                              key={currentImage}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className={`opacity-0 group-hover:opacity-100 backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xl ${isLightMode
                                  ? 'bg-white/80 border-slate-300 text-slate-900'
                                  : 'bg-midnight/80 border-white/15 text-white'
                                }`}>
                                🔍 Click to view full screen
                              </span>
                            </div>
                            {images.length > 1 && (
                              <div className={`absolute top-2 right-2 backdrop-blur-md px-2.5 py-1 rounded-lg border text-[10px] font-bold text-vibrant-secondary uppercase tracking-widest ${isLightMode
                                  ? 'bg-white/80 border-slate-300 shadow-md'
                                  : 'bg-midnight/80 border-white/10'
                                }`}>
                                Board {activePage + 1} of {images.length}
                              </div>
                            )}
                          </div>
                          {images.length > 1 && (
                            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-2">
                              <button
                                type="button"
                                disabled={activePage === 0}
                                onClick={() => setDrawingPages(prev => ({ ...prev, [question._id]: activePage - 1 }))}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              >
                                ◀ Prev
                              </button>
                              <span className="text-xs text-slate-400 font-medium">
                                {activePage + 1}/{images.length}
                              </span>
                              <button
                                type="button"
                                disabled={activePage === images.length - 1}
                                onClick={() => setDrawingPages(prev => ({ ...prev, [question._id]: activePage + 1 }))}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              >
                                Next ▶
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Correct Solution</p>
                  <div className="p-4 bg-vibrant-primary/5 rounded-xl text-vibrant-primary border border-vibrant-primary/10">
                    {question.type === 'MCQ' ? (
                      question.options.find(o => o.isCorrect)?.text
                    ) : (
                      <>
                        {question.correctAnswer?.startsWith('/uploads/') || question.correctAnswer?.startsWith('data:image') ? (
                          <div
                            onClick={() => openLightbox(question.correctAnswer, 0, 'Correct Solution')}
                            className="rounded-lg overflow-hidden border border-vibrant-primary/20 relative cursor-zoom-in hover:border-vibrant-primary/50 transition-all group"
                            title="Click to view full screen"
                          >
                            <img
                              src={question.correctAnswer.startsWith('data:image') ? question.correctAnswer : `${import.meta.env.VITE_API_URL}${question.correctAnswer}`}
                              alt="Correct solution"
                              className="max-h-60 object-contain mx-auto bg-black group-hover:scale-[1.01] transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <span className={`opacity-0 group-hover:opacity-100 backdrop-blur-md px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xl ${isLightMode
                                  ? 'bg-white/80 border-slate-300 text-slate-900'
                                  : 'bg-midnight/80 border-white/15 text-white'
                                }`}>
                                🔍 Click to view full screen
                              </span>
                            </div>
                          </div>
                        ) : (
                          question.correctAnswer || 'Answer guide will be provided by teacher'
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Glassmorphic Lightbox Modal */}
      {lightbox.isOpen && (
        <div className={`fixed inset-0 z-50 backdrop-blur-xl flex flex-col justify-between p-6 animate-in fade-in duration-200 transition-colors duration-300 ${isLightMode ? 'bg-slate-50/95 text-slate-900' : 'bg-black/90 text-white'
          }`}>
          {/* Header */}
          <div className={`flex justify-between items-center w-full max-w-5xl mx-auto border-b pb-4 transition-colors ${isLightMode ? 'border-slate-200' : 'border-white/10'
            }`}>
            <div>
              <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'
                }`}>{lightbox.title}</h2>
              {lightbox.images.length > 1 && (
                <p className={`text-xs mt-1 uppercase tracking-widest font-semibold ${isLightMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  Board {lightbox.activeIndex + 1} of {lightbox.images.length}
                </p>
              )}
            </div>
            <button
              onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
              className={`transition-all cursor-pointer p-2.5 rounded-full border ${isLightMode
                  ? 'text-slate-500 hover:text-slate-900 bg-slate-200/50 hover:bg-slate-200 border-slate-300/50 hover:border-slate-300'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                }`}
              title="Close Full Screen"
            >
              <XCircle size={24} />
            </button>
          </div>

          {/* Main Image Display */}
          <div className="flex-grow flex items-center justify-center p-4 relative max-w-5xl mx-auto w-full">
            {lightbox.images.length > 1 && (
              <button
                disabled={lightbox.activeIndex === 0}
                onClick={() => setLightbox(prev => ({ ...prev, activeIndex: prev.activeIndex - 1 }))}
                className={`absolute left-0 sm:left-4 hover:scale-105 p-3 rounded-full transition-all cursor-pointer shrink-0 z-10 disabled:opacity-20 disabled:pointer-events-none ${isLightMode
                    ? 'bg-white/95 border border-slate-300 text-slate-900 hover:bg-white shadow-lg'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center relative rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
              <img
                src={
                  lightbox.images[lightbox.activeIndex].startsWith('data:image')
                    ? lightbox.images[lightbox.activeIndex]
                    : `${import.meta.env.VITE_API_URL}${lightbox.images[lightbox.activeIndex]}`
                }
                alt={`Full screen view - Page ${lightbox.activeIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain transition-all duration-300 transform scale-100"
                key={lightbox.activeIndex}
              />
            </div>

            {lightbox.images.length > 1 && (
              <button
                disabled={lightbox.activeIndex === lightbox.images.length - 1}
                onClick={() => setLightbox(prev => ({ ...prev, activeIndex: prev.activeIndex + 1 }))}
                className={`absolute right-0 sm:right-4 hover:scale-105 p-3 rounded-full transition-all cursor-pointer shrink-0 z-10 disabled:opacity-20 disabled:pointer-events-none ${isLightMode
                    ? 'bg-white/95 border border-slate-300 text-slate-900 hover:bg-white shadow-lg'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
              >
                <ChevronLeft size={24} className="rotate-180" />
              </button>
            )}
          </div>

          {/* Bottom Footer Pagination Bar */}
          <div className={`w-full max-w-5xl mx-auto flex flex-col items-center gap-4 border-t pt-4 transition-colors ${isLightMode ? 'border-slate-200' : 'border-white/10'
            }`}>
            {lightbox.images.length > 1 ? (
              <div className="flex gap-2.5 overflow-x-auto py-1 max-w-full scrollbar-none">
                {lightbox.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightbox(prev => ({ ...prev, activeIndex: idx }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${lightbox.activeIndex === idx
                        ? 'bg-vibrant-primary text-white scale-105 shadow-md shadow-vibrant-primary/20'
                        : isLightMode
                          ? 'bg-slate-200/60 text-slate-600 hover:text-slate-900 border border-slate-300/50 hover:bg-slate-200'
                          : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                      }`}
                  >
                    Board {idx + 1}
                  </button>
                ))}
              </div>
            ) : (
              <p className={`text-xs font-semibold tracking-wider uppercase ${isLightMode ? 'text-slate-400' : 'text-slate-500'
                }`}>Full Screen Image Viewer</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;
