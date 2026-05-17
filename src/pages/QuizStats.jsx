import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Users, Target, Activity, ChevronLeft, Download, Search } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const QuizStats = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, subRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/quizzes/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/submissions/quiz/${id}`)
        ]);
        setQuiz(quizRes.data);
        setSubmissions(subRes.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const exportToCSV = () => {
    if (!submissions.length) return;
    
    const headers = ['Student Name', 'Email', 'Class', 'Stream', 'Score', 'Total Marks', 'Percentage', 'Status', 'Date'];
    const data = submissions.map(sub => [
      sub.student.name,
      sub.student.email,
      sub.student.studentClass,
      sub.student.stream,
      sub.gainedMarks,
      totalMarks,
      `${((sub.gainedMarks / totalMarks) * 100).toFixed(2)}%`,
      sub.status,
      new Date(sub.completedAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${quiz.title}_results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubmissions = submissions.filter(sub => 
    sub.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.student?.studentClass?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.student?.stream?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-10 skeleton w-1/3" />
          <div className="h-4 skeleton w-1/4" />
        </div>

        {/* Quick Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 skeleton" />
          <div className="h-28 skeleton" />
          <div className="h-28 skeleton" />
        </div>

        {/* Chart & Insights Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 skeleton" />
          <div className="h-72 skeleton" />
        </div>

        {/* Table Container Skeleton */}
        <div className="h-64 skeleton" />
      </div>
    );
  }

  const totalMarks = quiz?.totalMarks || 1;
  const avgScore = (submissions.length > 0) 
    ? submissions.reduce((acc, curr) => acc + (curr.gainedMarks || 0), 0) / submissions.length 
    : 0;
  const accuracyRate = (totalMarks > 0) ? (avgScore / totalMarks) * 100 : 0;
  const completionRate = (submissions.length > 0) ? 100 : 0; // Simplified for demo

  const isLightMode = localStorage.getItem('app-mode') === 'light';

  const scoreDistribution = {
    labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
    datasets: [{
      label: 'Number of Students',
      data: [0, 0, 0, 0, 0].map((_, i) => {
        const min = i * 20;
        const max = (i + 1) * 20;
        return submissions.filter(s => {
          const p = (s.gainedMarks / totalMarks) * 100;
          return p >= min && p <= max;
        }).length;
      }),
      backgroundColor: isLightMode ? 'rgba(139, 92, 246, 0.7)' : 'rgba(139, 92, 246, 0.5)',
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)' }, 
        ticks: { color: isLightMode ? '#0f172a' : 'rgba(255, 255, 255, 0.5)' } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: isLightMode ? '#0f172a' : 'rgba(255, 255, 255, 0.5)' } 
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
        <ChevronLeft size={20} /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{quiz.title} Analytics</h1>
          <p className="text-slate-400">Comprehensive overview of student performance</p>
        </div>
        <button onClick={exportToCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-vibrant-primary">
          <div className="p-3 bg-vibrant-primary/20 rounded-xl text-vibrant-primary"><Users /></div>
          <div>
            <p className="text-slate-400 text-sm">Total Attempts</p>
            <p className="text-2xl font-bold text-white">{submissions.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-vibrant-secondary">
          <div className="p-3 bg-vibrant-secondary/20 rounded-xl text-vibrant-secondary"><Target /></div>
          <div>
            <p className="text-slate-400 text-sm">Avg. Accuracy</p>
            <p className="text-2xl font-bold text-white">{accuracyRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border-t-2 border-emerald-500">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500"><Activity /></div>
          <div>
            <p className="text-slate-400 text-sm">Avg. Score</p>
            <p className="text-2xl font-bold text-white">{avgScore.toFixed(1)} / {totalMarks}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Score Distribution</h3>
          <div className="h-64">
            <Bar data={scoreDistribution} options={chartOptions} />
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col justify-center text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Insights</h3>
          <div className="space-y-6">
            <div>
              <p className="text-slate-500 text-sm mb-1 uppercase tracking-tighter">Highest Score</p>
              <p className="text-3xl font-bold text-emerald-500">
                {submissions.length > 0 ? Math.max(...submissions.map(s => s.gainedMarks || 0)) : 0}
              </p>
            </div>
            <div className="h-px bg-white/5 w-1/2 mx-auto" />
            <div>
              <p className="text-slate-500 text-sm mb-1 uppercase tracking-tighter">Lowest Score</p>
              <p className="text-3xl font-bold text-red-500">
                {submissions.length > 0 ? Math.min(...submissions.map(s => s.gainedMarks || 0)) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold text-white">Student Results</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, class..." 
              className="input-field pl-10 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-400 text-sm font-medium">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-center">Grade</th>
                <th className="px-6 py-4">Completed</th>
                <th className="px-6 py-4 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubmissions.map((sub) => (
                <tr key={sub._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{sub.student?.name || 'Unknown Student'}</span>
                      <span className="text-xs text-slate-500 uppercase">
                        {sub.student?.studentClass || 'N/A'} • {sub.student?.stream || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-300">{sub.gainedMarks} / {totalMarks}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${ (sub.gainedMarks/totalMarks) >= 0.8 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-vibrant-primary/10 text-vibrant-primary'}`}>
                      {((sub.gainedMarks / totalMarks) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(sub.completedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/results/${sub._id}`} className="text-vibrant-secondary hover:underline text-sm font-medium">View Detailed</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuizStats;
