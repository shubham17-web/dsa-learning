import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Code2, Copy, Check } from 'lucide-react';

const SolutionView = ({ problem }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(problem.solution_code_cpp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!problem.solution_code_cpp) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
        <p>Official solution coming soon...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-primary-900 dark:text-primary-100 flex items-center gap-2 mb-3">
          <Lightbulb size={20} className="text-primary-500" /> Approach Explanation
        </h3>
        <p className="text-primary-800 dark:text-primary-200 text-sm leading-relaxed">
          The optimal approach for this problem involves using a **{problem.tags?.[0] || 'Optimized'}** strategy. 
          The time complexity is <code className="bg-primary-200/50 dark:bg-primary-800/50 px-1.5 py-0.5 rounded font-mono text-xs">{problem.time_complexity}</code> and 
          the space complexity is <code className="bg-primary-200/50 dark:bg-primary-800/50 px-1.5 py-0.5 rounded font-mono text-xs">{problem.space_complexity}</code>.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Code2 size={18} className="text-primary-500" /> C++ Implementation
          </h3>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="relative group">
          <pre className="bg-slate-950 p-6 rounded-2xl overflow-x-auto text-sm font-mono text-slate-300 border border-slate-800">
            <code>{problem.solution_code_cpp}</code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
};

export default SolutionView;
