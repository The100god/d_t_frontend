import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, BookOpen, Clock, Users, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [adminStats, setAdminStats] = useState({ totalParticipants: 0, completionRate: 0, totalQuizzes: 0 });

  const fetchData = async () => {
    if (!user) return;
    try {
      const quizEndpoint = user.role === 'admin' ? '/api/quizzes/admin/my-quizzes' : '/api/quizzes';
      const quizRes = await axios.get(`${import.meta.env.VITE_API_URL}${quizEndpoint}`);
      setQuizzes(quizRes.data);

      if (user.role === 'student') {
        const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/submissions/my-submissions`);
        setSubmissions(subRes.data);
      }

      if (user.role === 'admin') {
        const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/quizzes/admin/stats`);
        setAdminStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // console.log(submissions)

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Hello, {user.name || user.email.split('@')[0]}</h1>
          <p className="text-slate-400">Here's what's happening with your quizzes today.</p>
        </div>
        {user.role === 'admin' && (
          <Link to="/create-quiz" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            Create New Quiz
          </Link>
        )}
      </div>

      {user.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="p-3 bg-vibrant-primary/20 rounded-xl text-vibrant-primary"><BookOpen /></div>
            <div>
              <p className="text-slate-400 text-sm">Active Quizzes</p>
              <p className="text-2xl font-bold text-white">{quizzes.length}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="p-3 bg-vibrant-secondary/20 rounded-xl text-vibrant-secondary"><Users /></div>
            <div>
              <p className="text-slate-400 text-sm">Total Participants</p>
              <p className="text-2xl font-bold text-white">{adminStats.totalParticipants}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500"><Clock /></div>
            <div>
              <p className="text-slate-400 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold text-white">{adminStats.completionRate}%</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        {user.role === 'admin' ? 'My Published Quizzes' : 'Available Quizzes'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="glass-card glass-card-hover p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-vibrant-primary/10 text-vibrant-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                {quiz.subject}
              </span>
              <span className="flex items-center gap-1 text-slate-400 text-sm">
                <Clock size={14} />
                {quiz.timeLimit}m
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
            <p className="text-slate-400 text-sm mb-6 flex-grow">
              {user.role === 'admin' ? 'Manage your quiz settings and view analytics.' : 'Test your knowledge on this subject.'}
            </p>
            <Link
              to={user.role === 'admin' ? `/quiz-stats/${quiz._id}` : `/attempt-quiz/${quiz._id}`}
              className="mt-auto flex items-center justify-between group text-white font-medium"
            >
              {user.role === 'admin' ? 'View Stats' : 'Start Quiz'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
      </div>

      {user.role === 'student' && submissions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="text-vibrant-secondary" size={24} /> My Activity & Results
          </h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-sm uppercase tracking-widest font-bold">
                  <th className="px-6 py-4">Quiz</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{sub.quiz.title}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {sub.status === 'graded' ? `${sub.gainedMarks} / ${sub.totalMarks || '?'}` : '---'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {sub.status === 'graded' ? 'Graded' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'graded' ? (
                        <Link to={`/results/${sub._id}`} className="text-vibrant-secondary hover:underline font-medium">View Detailed</Link>
                      ) : (
                        <span className="text-slate-600 cursor-not-allowed">Waiting...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
