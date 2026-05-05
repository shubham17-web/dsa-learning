import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Star, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProblemCard = ({ problem }) => {
  const difficultyColors = {
    easy: 'text-green-500 bg-green-500/10 border-green-500/20',
    medium: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    hard: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="glass p-6 rounded-2xl group flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-primary-500/5 transition-all border-none"
    >
      <div className="flex gap-5 flex-1">
        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${
          problem.is_completed ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
        }`}>
          {problem.is_completed ? <CheckCircle2 size={24} /> : <Zap size={24} />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold group-hover:text-primary-600 transition-colors">{problem.title}</h3>
            {problem.is_starred && <Star size={16} fill="#eab308" className="text-yellow-500" />}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase ${difficultyColors[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {problem.time_complexity || 'O(N)'}
            </span>
            <div className="flex gap-2">
              {problem.tags?.map((tag, i) => (
                <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-500 font-medium">Acceptance Rate</p>
          <p className="font-bold text-slate-700 dark:text-slate-300">72.5%</p>
        </div>
        
        <Link 
          to={`/problems/${problem.slug}`}
          className="btn-primary flex items-center gap-2 group/btn px-6"
        >
          Solve <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ProblemCard;
