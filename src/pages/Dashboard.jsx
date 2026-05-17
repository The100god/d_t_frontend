import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Plus, BookOpen, Clock, Users, ArrowRight, Activity, Trash2, Download, Search, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [adminStats, setAdminStats] = useState({ totalParticipants: 0, completionRate: 0, totalQuizzes: 0 });
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    confirmText: 'Confirm',
    onConfirm: () => { },
  });

  // Student Search, Filter & Sort States
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');
  const [studentSortField, setStudentSortField] = useState('date');
  const [studentSortOrder, setStudentSortOrder] = useState('desc');

  // Teacher/Admin Search, Filter & Sort States
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');
  const [adminSortField, setAdminSortField] = useState('date');
  const [adminSortOrder, setAdminSortOrder] = useState('desc');

  const fetchData = async () => {
    if (!user) return;
    try {
      const quizEndpoint = user.role === 'admin' ? '/api/quizzes/admin/my-quizzes' : '/api/quizzes';
      const quizRes = await axios.get(`${import.meta.env.VITE_API_URL}${quizEndpoint}`);
      setQuizzes(quizRes?.data || []);

      if (user.role === 'student') {
        const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/submissions/my-submissions`);
        setSubmissions(subRes?.data || []);
      }

      if (user.role === 'admin') {
        const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/quizzes/admin/stats`);
        setAdminStats(statsRes?.data || { totalParticipants: 0, completionRate: 0, totalQuizzes: 0 });

        const allSubRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/submissions/admin/all-submissions`);
        setAllSubmissions(allSubRes?.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showErrorModal = (title, message) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => { },
    });
  };

  const handleCSVExport = () => {
    const listToExport = getFilteredAdminSubmissions();
    if (listToExport.length === 0) {
      showErrorModal('Export Failed', 'There are no student participation records to export.');
      return;
    }

    const headers = ['Student Name', 'Student Email', 'Quiz Title', 'Subject', 'Score', 'Total Marks', 'Status'];

    const rows = listToExport.map(sub => [
      `"${(sub.student?.name || 'Unknown Student').replace(/"/g, '""')}"`,
      `"${(sub.student?.email || 'N/A').replace(/"/g, '""')}"`,
      `"${(sub.quiz?.title || 'Deleted Quiz').replace(/"/g, '""')}"`,
      `"${(sub.quiz?.subject || 'N/A').replace(/"/g, '""')}"`,
      sub.status === 'graded' ? sub.gainedMarks : '---',
      sub.totalMarks || 100,
      `"${sub.status === 'graded' ? 'Graded' : 'Pending Review'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_quiz_participations.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSubmissionFromList = (submissionId, studentName, quizTitle) => {
    setModalConfig({
      isOpen: true,
      title: 'Remove Student Record',
      message: `Are you sure you want to remove the record for student "${studentName}" from the participation list of "${quizTitle}"?`,
      type: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/submissions/${submissionId}`);
          fetchData();
        } catch (err) {
          console.error('Error deleting submission:', err);
          showErrorModal('Failed to Remove Record', err.response?.data?.error || 'Failed to remove the student record.');
        }
      }
    });
  };

  const handleDeleteQuiz = (quizId, quizTitle) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Quiz',
      message: `Are you sure you want to delete the quiz "${quizTitle}"? This will delete all student submissions and stats for this quiz permanently.`,
      type: 'danger',
      confirmText: 'Delete Quiz',
      onConfirm: async () => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/quizzes/${quizId}`);
          fetchData();
        } catch (err) {
          console.error('Error deleting quiz:', err);
          showErrorModal('Failed to Delete Quiz', err.response?.data?.error || 'Failed to delete the quiz.');
        }
      }
    });
  };

  const handleDeleteSubmission = (submissionId, quizTitle) => {
    setModalConfig({
      isOpen: true,
      title: 'Remove Submission Record',
      message: `Are you sure you want to remove your submission record for "${quizTitle}" from your activity list?`,
      type: 'danger',
      confirmText: 'Remove',
      onConfirm: async () => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/submissions/${submissionId}`);
          fetchData();
        } catch (err) {
          console.error('Error deleting submission:', err);
          showErrorModal('Failed to Remove Record', err.response?.data?.error || 'Failed to delete the submission record.');
        }
      }
    });
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const getFilteredStudentSubmissions = () => {
    let result = [...submissions];

    if (studentSearchTerm) {
      const term = studentSearchTerm.toLowerCase();
      result = result.filter(sub =>
        (sub.quiz?.title || 'deleted quiz').toLowerCase().includes(term)
      );
    }

    if (studentStatusFilter) {
      result = result.filter(sub => sub.status === studentStatusFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (studentSortField === 'title') {
        const titleA = a.quiz?.title || '';
        const titleB = b.quiz?.title || '';
        comparison = titleA.localeCompare(titleB);
      } else if (studentSortField === 'score') {
        const scoreA = a.status === 'graded' ? (a.gainedMarks / (a.totalMarks || 1)) : -1;
        const scoreB = b.status === 'graded' ? (b.gainedMarks / (b.totalMarks || 1)) : -1;
        comparison = scoreA - scoreB;
      } else {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        comparison = dateA - dateB;
      }
      return studentSortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  };

  const getFilteredAdminSubmissions = () => {
    let result = [...allSubmissions];

    if (adminSearchTerm) {
      const term = adminSearchTerm.toLowerCase();
      result = result.filter(sub =>
        (sub.student?.name || 'unknown student').toLowerCase().includes(term) ||
        (sub.student?.email || '').toLowerCase().includes(term) ||
        (sub.quiz?.title || 'deleted quiz').toLowerCase().includes(term)
      );
    }

    if (adminStatusFilter) {
      result = result.filter(sub => sub.status === adminStatusFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (adminSortField === 'student') {
        const nameA = a.student?.name || '';
        const nameB = b.student?.name || '';
        comparison = nameA.localeCompare(nameB);
      } else if (adminSortField === 'quiz') {
        const titleA = a.quiz?.title || '';
        const titleB = b.quiz?.title || '';
        comparison = titleA.localeCompare(titleB);
      } else if (adminSortField === 'score') {
        const scoreA = a.status === 'graded' ? (a.gainedMarks / (a.totalMarks || 1)) : -1;
        const scoreB = b.status === 'graded' ? (b.gainedMarks / (b.totalMarks || 1)) : -1;
        comparison = scoreA - scoreB;
      } else {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        comparison = dateA - dateB;
      }
      return adminSortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  };

  const filteredStudentSubmissions = getFilteredStudentSubmissions();
  const filteredAdminSubmissions = getFilteredAdminSubmissions();

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-10 skeleton w-64" />
            <div className="h-4 skeleton w-48" />
          </div>
          {user?.role === 'admin' && <div className="h-12 skeleton w-44" />}
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 skeleton" />
          <div className="h-24 skeleton" />
          <div className="h-24 skeleton" />
        </div>

        {/* Main Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-12 skeleton w-full" />
            <div className="h-80 skeleton w-full" />
          </div>
          <div className="space-y-6">
            <div className="h-12 skeleton w-full" />
            <div className="h-80 skeleton w-full" />
          </div>
        </div>
      </div>
    );
  }

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

      {user.role === 'admin' ? (
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
      ) : (
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 bg-vibrant-primary/20 rounded-xl text-vibrant-primary"><BookOpen /></div>
          <div>
            <p className="text-slate-400 text-sm">Available Quizzes</p>
            <p className="text-2xl font-bold text-white">{quizzes?.length || 0}</p>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold text-white mt-3 mb-6 flex items-center gap-2">
        {user.role === 'admin' ? 'My Published Quizzes' : 'Available Quizzes'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {quizzes && quizzes.length > 0 && quizzes.map((quiz) => (
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
            {user.role === 'admin' ? (
              <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <Link
                  to={`/quiz-stats/${quiz._id}`}
                  className="flex items-center gap-1.5 text-vibrant-secondary hover:text-white transition-colors text-sm font-semibold cursor-pointer"
                >
                  View Stats
                  <ArrowRight size={16} />
                </Link>
                <button
                  onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all text-sm font-semibold cursor-pointer"
                  title="Delete Quiz"
                >
                  <Trash2 size={16} />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <Link
                to={`/attempt-quiz/${quiz._id}`}
                className="mt-auto flex items-center justify-between group text-white font-medium cursor-pointer"
              >
                <span>Start Quiz</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {user.role === 'admin' && (
        <div className="space-y-6 mt-10 mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="text-vibrant-secondary" size={24} /> Student Participation & Detailed Submissions
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCSVExport}
                className="btn-secondary flex items-center gap-2 text-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          {/* Admin Filters & Sorting Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="input-field pl-10 pr-4 py-2 w-full text-sm"
                placeholder="Search Student or Quiz..."
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Selector */}
            <div>
              <select
                className="input-field py-2 text-sm w-full cursor-pointer"
                value={adminStatusFilter}
                onChange={(e) => setAdminStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="graded">Graded</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>

            {/* Sort Field Selector */}
            <div>
              <select
                className="input-field py-2 text-sm w-full cursor-pointer"
                value={adminSortField}
                onChange={(e) => setAdminSortField(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="student">Sort by Student Name</option>
                <option value="quiz">Sort by Quiz Title</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setAdminSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer font-semibold"
              >
                <ArrowUpDown size={16} />
                <span>Order: {adminSortOrder === 'asc' ? 'ASC 🔼' : 'DESC 🔽'}</span>
              </button>
            </div>
          </div>

          <div className="glass-card overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-sm uppercase tracking-widest font-bold sticky top-0 z-10">
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Student</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Email</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Quiz Title</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Score</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Status</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Attempt Date</th>
                  <th className="px-6 py-4 text-right bg-midnight/95 backdrop-blur-md">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAdminSubmissions.length > 0 ? (
                  filteredAdminSubmissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{sub.student?.name || 'Unknown Student'}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{sub.student?.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>{sub.quiz?.title || 'Deleted Quiz'}</span>
                          {sub.quiz?.isDeleted && (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">Deleted</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {sub.status === 'graded' ? `${sub.gainedMarks} / ${sub.totalMarks || '100'}` : '---'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {sub.status === 'graded' ? 'Graded' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/results/${sub._id}`}
                            className="text-vibrant-secondary hover:underline font-medium cursor-pointer text-sm"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => handleDeleteSubmissionFromList(sub._id, sub.student?.name || sub.student?.email, sub.quiz?.title || 'Deleted Quiz')}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Delete Student Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500 text-sm">
                      No matching student participation records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.role === 'student' && submissions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="text-vibrant-secondary" size={24} /> My Activity & Results
          </h2>

          {/* Student Filters & Sorting Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
            {/* Search Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="input-field pl-10 pr-4 py-2 w-full text-sm"
                placeholder="Search Quiz..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Selector */}
            <div>
              <select
                className="input-field py-2 text-sm w-full cursor-pointer"
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="graded">Graded</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>

            {/* Sort Field Selector */}
            <div>
              <select
                className="input-field py-2 text-sm w-full cursor-pointer"
                value={studentSortField}
                onChange={(e) => setStudentSortField(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Quiz Title</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setStudentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer font-semibold"
              >
                <ArrowUpDown size={16} />
                <span>Order: {studentSortOrder === 'asc' ? 'ASC 🔼' : 'DESC 🔽'}</span>
              </button>
            </div>
          </div>

          <div className="glass-card overflow-x-auto max-h-80 overflow-y-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-sm uppercase tracking-widest font-bold sticky top-0 z-10">
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Quiz</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Score</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Status</th>
                  <th className="px-6 py-4 bg-midnight/95 backdrop-blur-md">Attempt Date</th>
                  <th className="px-6 py-4 text-right bg-midnight/95 backdrop-blur-md">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudentSubmissions.length > 0 ? (
                  filteredStudentSubmissions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{sub.quiz?.title || 'Deleted Quiz'}</td>
                      <td className="px-6 py-4 text-slate-300">
                        {sub.status === 'graded' ? `${sub.gainedMarks} / ${sub.totalMarks || '?'}` : '---'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'graded' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {sub.status === 'graded' ? 'Graded' : 'Pending Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {sub.status === 'graded' ? (
                            <Link to={`/results/${sub._id}`} className="text-vibrant-secondary hover:underline font-medium cursor-pointer text-sm">View Detailed</Link>
                          ) : (
                            <span className="text-slate-600 cursor-not-allowed text-sm">Waiting...</span>
                          )}
                          <button
                            onClick={() => handleDeleteSubmission(sub._id, sub.quiz?.title || 'Deleted Quiz')}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-all cursor-pointer"
                            title="Delete Submission Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">
                      No matching activity records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Reusable Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
      />
    </div>
  );
};

export default Dashboard;
