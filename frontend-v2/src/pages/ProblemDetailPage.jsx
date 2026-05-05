import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemService } from '../services/api';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Send, 
  ChevronLeft, 
  Settings, 
  RotateCcw, 
  MessageSquare, 
  Sparkles,
  Info,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChat from '../components/AIChat';
import SolutionView from '../components/SolutionView';
import DiscussionSection from '../components/DiscussionSection';

const ProblemDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [showAI, setShowAI] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await problemService.getQuestion(slug);
        setProblem(res.data);
        setCode(res.data.starter_code_cpp || '');
      } catch (err) {
        console.error("Error fetching problem", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  const handleRun = async () => {
    setExecuting(true);
    setResults(null);
    try {
      const res = await problemService.executeCode({ code, language: 'cpp', question_id: problem.id });
      setOutput(res.data.output);
      setResults(res.data);
    } catch (err) {
      setOutput("Error: Could not execute code.");
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    setExecuting(true);
    try {
      const res = await problemService.executeCode({ code, language: 'cpp', question_id: problem.id });
      setResults(res.data);
      if (res.data.status === 'success') {
        await problemService.updateProgress(problem.id, { status: 'completed' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-8 overflow-hidden">
      {/* Action Bar */}
      <div className="h-14 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-dark-border" />
          <h2 className="font-bold text-lg">{problem.title}</h2>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
            problem.difficulty === 'easy' ? 'text-green-500 border-green-500/20 bg-green-500/10' :
            problem.difficulty === 'medium' ? 'text-orange-500 border-orange-500/20 bg-orange-500/10' :
            'text-red-500 border-red-500/20 bg-red-500/10'
          }`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm transition-all ${
              showAI ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-slate-100 dark:bg-slate-800 text-primary-600'
            }`}
          >
            <Sparkles size={16} /> AI Assistant
          </button>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-dark-border" />
          <button 
            onClick={handleRun}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
          >
            <Play size={16} fill="currentColor" /> Run
          </button>
          <button 
            onClick={handleSubmit}
            disabled={executing}
            className="flex items-center gap-2 px-6 py-1.5 bg-primary-600 text-white rounded-lg font-bold text-sm transition-all hover:bg-primary-700 shadow-lg shadow-primary-600/20 disabled:opacity-50"
          >
            <Send size={16} /> Submit
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Description & Discussions */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg">
          <div className="flex border-b border-slate-100 dark:border-dark-border px-4 bg-slate-50/50 dark:bg-slate-900/50">
            {['description', 'discussions', 'solutions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-bold capitalize transition-all border-b-2 relative -mb-[1px] ${
                  activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 prose dark:prose-invert max-w-none">
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {problem.description}
                </p>

                {problem.examples && problem.examples.length > 0 && (
                  <div className="space-y-6">
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="space-y-2">
                        <h4 className="text-sm font-bold flex items-center gap-2">Example {i + 1}</h4>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-dark-border font-mono text-sm">
                          <p><span className="text-slate-400">Input:</span> {ex.input}</p>
                          <p><span className="text-slate-400">Output:</span> {ex.output}</p>
                          {ex.explanation && <p className="mt-2 italic"><span className="text-slate-400">Explanation:</span> {ex.explanation}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints && (
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2 mb-2"><Info size={16} /> Constraints</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-500">
                      {problem.constraints.split('\n').map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}

                {/* Hint System */}
                <div className="pt-8 border-t border-slate-100 dark:border-dark-border">
                   <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                     <Sparkles size={16} className="text-primary-500" /> Need a nudge?
                   </h4>
                   {hintIndex === -1 ? (
                     <button 
                       onClick={() => setHintIndex(0)}
                       className="text-sm font-bold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-4 py-2 rounded-xl transition-all"
                     >
                       Reveal first hint
                     </button>
                   ) : (
                     <div className="space-y-4">
                        {problem.hints?.split('\n').slice(0, hintIndex + 1).map((h, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-200"
                          >
                            <span className="font-bold mr-2">Hint {i + 1}:</span> {h}
                          </motion.div>
                        ))}
                        {hintIndex < (problem.hints?.split('\n').length || 0) - 1 && (
                          <button 
                            onClick={() => setHintIndex(prev => prev + 1)}
                            className="text-xs font-bold text-slate-500 hover:text-primary-600 transition-all"
                          >
                            Next hint →
                          </button>
                        )}
                     </div>
                   )}
                </div>
              </motion.div>
            )}
            {activeTab === 'discussions' && (
              <DiscussionSection slug={slug} />
            )}
            {activeTab === 'solutions' && (
              <SolutionView problem={problem} />
            )}
          </div>
        </div>

        {/* Right Panel: Editor & Console */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          <div className="flex-1 min-h-0 relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
               <button className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"><Settings size={16} /></button>
               <button onClick={() => setCode(problem.starter_code_cpp)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"><RotateCcw size={16} /></button>
            </div>
            <Editor
              height="100%"
              defaultLanguage="cpp"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 20 },
                smoothScrolling: true,
                cursorBlinking: 'expand',
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace'
              }}
            />
          </div>

          {/* Console / Results */}
          <div className="h-1/3 bg-slate-950 border-t border-slate-800 flex flex-col">
            <div className="h-10 px-4 flex items-center bg-slate-900 border-b border-slate-800 shrink-0">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Terminal size={12} /> Console Output
               </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
               {executing ? (
                 <div className="flex items-center gap-3 text-slate-400">
                   <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
                   Executing code...
                 </div>
               ) : results ? (
                 <div className="space-y-4">
                    <div className={`flex items-center gap-2 font-bold ${results.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {results.status === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      {results.status === 'success' ? 'All Test Cases Passed!' : 'Wrong Answer'}
                      <span className="text-slate-500 text-xs font-normal ml-4 flex items-center gap-1">
                        <Clock size={12} /> {results.execution_time}s
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {results.test_cases?.map((tc, i) => (
                         <div key={i} className={`p-3 rounded-lg border ${tc.passed ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-400">Case {i + 1}</span>
                              {tc.passed ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                            </div>
                            <div className="text-[11px] space-y-1">
                              <p><span className="text-slate-500">Input:</span> {tc.input}</p>
                              <p><span className="text-slate-500">Expected:</span> {tc.expected}</p>
                              <p><span className={tc.passed ? 'text-green-400' : 'text-red-400'}><span className="text-slate-500">Actual:</span> {tc.actual}</span></p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               ) : (
                 <div className="text-slate-600">Run code to see test case results.</div>
               )}
            </div>
          </div>
        </div>

        {/* AI Overlay */}
        <AnimatePresence>
          {showAI && (
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute right-0 top-14 bottom-0 w-[400px] z-50 shadow-2xl"
            >
              <AIChat context={problem} onClose={() => setShowAI(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
