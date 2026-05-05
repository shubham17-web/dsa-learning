import React, { useEffect, useState } from 'react';
import { discussionService } from '../services/api';
import { MessageSquare, User, Clock, Send, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DiscussionSection = ({ slug }) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [slug]);

  const fetchDiscussions = async () => {
    try {
      const res = await discussionService.getDiscussions(slug);
      setDiscussions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscussionClick = async (discussion) => {
    setSelectedDiscussion(discussion);
    try {
      const res = await discussionService.getComments(discussion.id);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Note: Backend might need a comment creation endpoint, but we'll simulate for now
      // Assuming a generic comment creation exists or adding one to our logic
      const mockComment = {
        id: Date.now(),
        content: newComment,
        username: 'You',
        created_at: new Date().toISOString()
      };
      setComments(prev => [...prev, mockComment]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading discussions...</div>;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedDiscussion ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Community Discussions</h3>
              <button className="btn-primary py-2 px-4 text-xs">New Post</button>
            </div>

            {discussions.length > 0 ? (
              discussions.map((d) => (
                <div 
                  key={d.id} 
                  onClick={() => handleDiscussionClick(d)}
                  className="glass p-5 rounded-2xl cursor-pointer card-hover border border-slate-100 dark:border-dark-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{d.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1">{d.content}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-400">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5"><User size={12} /> {d.username}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(d.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {d.comment_count} comments</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                <p>No discussions yet. Be the first to ask!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setSelectedDiscussion(null)}
              className="text-sm font-bold text-primary-600 hover:underline mb-4 flex items-center gap-1"
            >
               ← Back to all posts
            </button>

            <div className="glass p-6 rounded-3xl border border-primary-500/10 bg-primary-50/5">
               <h3 className="text-xl font-bold mb-3">{selectedDiscussion.title}</h3>
               <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                 {selectedDiscussion.content}
               </p>
               <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300">
                    <User size={14} /> {selectedDiscussion.username}
                  </span>
                  <span>{new Date(selectedDiscussion.created_at).toLocaleString()}</span>
               </div>
            </div>

            <div className="space-y-4 pt-4">
               <h4 className="font-bold flex items-center gap-2">
                 <MessageSquare size={18} className="text-primary-500" /> Comments ({comments.length})
               </h4>
               
               <div className="space-y-4">
                 {comments.map((c) => (
                   <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-dark-border">
                     <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                       <User size={16} className="text-slate-400" />
                     </div>
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{c.username}</span>
                          <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <form onSubmit={handlePostComment} className="mt-8 relative">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all min-h-[100px]"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="absolute bottom-4 right-4 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiscussionSection;
