import React, { useEffect, useState } from 'react';
import { problemService } from '../services/api';
import ProblemCard from '../components/ProblemCard';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List as ListIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await problemService.getQuestions();
        setProblems(res.data);
      } catch (err) {
        console.error("Error fetching problems", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Practice Problems</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Master DSA concepts with curated practice sets</p>
        </div>
        
        <div className="flex bg-white dark:bg-dark-card p-1 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm">
          <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary-600 shadow-sm">
            <LayoutGrid size={18} />
          </button>
          <button className="px-3 py-1.5 text-slate-400 hover:text-slate-600 transition-colors">
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass p-4 rounded-2xl flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by title, tags or concepts..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
            {['all', 'easy', 'medium', 'hard'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${
                  filter === lvl 
                    ? 'bg-white dark:bg-dark-card text-primary-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button className="btn-secondary flex items-center gap-2 py-2 px-4">
            <Filter size={18} /> More Filters
          </button>
          
          <button className="btn-secondary flex items-center gap-2 py-2 px-4">
            <SlidersHorizontal size={18} /> Sort
          </button>
        </div>
      </div>

      {/* Problem List */}
      <div className="space-y-4 pb-20">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl w-full" />
            ))
          ) : filteredProblems.length > 0 ? (
            filteredProblems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold">No problems found</h3>
              <p className="text-slate-500 mt-2">Try adjusting your filters or search keywords</p>
              <button 
                onClick={() => {setFilter('all'); setSearch('')}}
                className="mt-6 text-primary-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProblemsPage;
