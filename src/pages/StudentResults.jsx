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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Results...</div>;
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
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Award size={120} />
        </div>
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
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 text-sm font-medium">Question {index + 1}</span>
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
                        <CheckCircle size={16} /> CORRECT
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{studentAnswer?.score}/{studentAnswer?.maxMarks} Marks</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1 text-red-500 text-sm font-bold">
                        <XCircle size={16} /> INCORRECT
                      </span>
                      <span className="text-xs text-slate-500 font-bold">{studentAnswer?.score}/{studentAnswer?.maxMarks} Marks</span>
                    </div>
                  )}

                  {user.role === 'admin' && question.type !== 'MCQ' && (
                    <div className="flex gap-2 ml-4 border-l border-white/10 pl-4">
                      <button
                        onClick={() => handleManualGrade(question._id, true)}
                        className={`p-1.5 rounded-lg transition-all ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500/20'}`}
                        title="Mark as Correct"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleManualGrade(question._id, false)}
                        className={`p-1.5 rounded-lg transition-all ${!isCorrect ? 'bg-red-500 text-white' : 'bg-white/5 text-red-500 hover:bg-red-500/20'}`}
                        title="Mark as Incorrect"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
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
                    {studentAnswer?.imageAnswer && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={studentAnswer.imageAnswer.startsWith('data:image') ? studentAnswer.imageAnswer : `${import.meta.env.VITE_API_URL}${studentAnswer.imageAnswer}`}
                          alt="Your answer"
                          className="max-h-60 object-contain mx-auto bg-black/40"
                        />
                      </div>
                    )}
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
                          <div className="rounded-lg overflow-hidden border border-vibrant-primary/20">
                            <img
                              src={question.correctAnswer.startsWith('data:image') ? question.correctAnswer : `${import.meta.env.VITE_API_URL}${question.correctAnswer}`}
                              alt="Correct solution"
                              className="max-h-60 object-contain mx-auto bg-black/40"
                            />
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
    </div>
  );
};

export default StudentResults;
