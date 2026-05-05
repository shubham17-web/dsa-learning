import React, { useEffect, useState } from 'react';
import { dashboardService, problemService } from '../services/api';
import { 
  Trophy, 
  Flame, 
  Target, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Brain,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="glass p-6 rounded-2xl flex items-center gap-6 card-hover">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
      <Icon size={28} />
    </div>
    <div className="flex-1">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend && (
          <span className="text-green-500 text-xs font-bold flex items-center gap-0.5">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dailyRes] = await Promise.all([
          dashboardService.getStats(),
          problemService.getDailyChallenge()
        ]);
        setStats(statsRes.data);
        setDaily(dailyRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = [
    { name: 'Mon', solved: 4 },
    { name: 'Tue', solved: 7 },
    { name: 'Wed', solved: 5 },
    { name: 'Thu', solved: 10 },
    { name: 'Fri', solved: 8 },
    { name: 'Sat', solved: 12 },
    { name: 'Sun', solved: 9 },
  ];

  if (loading) return <div className="flex items-center justify-center h-96">
    <motion.div 
      animate={{ rotate: 360 }} 
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
    />
  </div>;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, Gamer! 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">You've solved 12% more than last week. Keep it up!</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Clock size={18} /> View History
          </button>
          <button className="btn-primary flex items-center gap-2 shadow-primary-600/30">
            <Zap size={18} fill="currentColor" /> Resume Learning
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={CheckCircle2} 
          label="Problems Solved" 
          value={stats?.total_solved || 0} 
          trend="+5" 
          color="bg-primary-500" 
        />
        <StatCard 
          icon={Flame} 
          label="Current Streak" 
          value={`${stats?.streak || 0} Days`} 
          trend="New Personal Best" 
          color="bg-orange-500" 
        />
        <StatCard 
          icon={Target} 
          label="Accuracy" 
          value={`${stats?.accuracy || 0}%`} 
          trend="+2.4%" 
          color="bg-green-500" 
        />
        <StatCard 
          icon={Trophy} 
          label="Global Rank" 
          value="#1,245" 
          trend="Top 5%" 
          color="bg-violet-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-primary-500" /> Solving Activity
              </h3>
              <p className="text-sm text-slate-500">Problems solved in the last 7 days</p>
            </div>
            <select className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-sm font-medium outline-none border-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="solved" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSolved)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Challenge & Topics */}
        <div className="space-y-6">
          {/* Daily Challenge Card */}
          <div className="bg-gradient-to-br from-primary-600 to-violet-600 p-8 rounded-3xl text-white shadow-xl shadow-primary-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Brain size={120} />
            </div>
            <div className="relative z-10">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Problem of the Day</span>
              <h3 className="text-2xl font-bold mt-4">{daily?.question?.title || "Two Sum"}</h3>
              <p className="text-primary-100 mt-2 text-sm line-clamp-2">
                {daily?.question?.description || "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."}
              </p>
              <div className="flex gap-2 mt-6">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{daily?.question?.difficulty || "Easy"}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Arrays</span>
              </div>
              <button className="w-full mt-6 bg-white text-primary-600 font-bold py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 group">
                Solve Now <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Progress by Topic */}
          <div className="glass p-6 rounded-3xl">
            <h3 className="font-bold mb-4">Topic Mastery</h3>
            <div className="space-y-4">
              {stats?.topic_progress?.slice(0, 4).map((topic, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{topic.name}</span>
                    <span className="text-slate-500">{topic.solved}/{topic.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.percentage}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-primary-500' : 
                        i === 1 ? 'bg-green-500' : 
                        i === 2 ? 'bg-orange-500' : 'bg-violet-500'
                      }`} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:underline">
              View All Topics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
