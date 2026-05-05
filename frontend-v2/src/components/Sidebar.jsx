import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Code2, 
  BookOpen, 
  User, 
  Trophy, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, to, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
      ${isActive 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'}
    `}
  >
    <Icon size={22} className="shrink-0" />
    {!collapsed && (
      <motion.span
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="font-medium whitespace-nowrap"
      >
        {label}
      </motion.span>
    )}
  </NavLink>
);

const Sidebar = ({ collapsed, setCollapsed }) => {
  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen sticky top-0 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border flex flex-col transition-colors duration-300 z-50"
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary-600/30">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-violet-500 bg-clip-text text-transparent">
              DSA Pro
            </span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white mx-auto shadow-lg shadow-primary-600/30">
            <Zap size={20} fill="currentColor" />
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" collapsed={collapsed} />
        <SidebarItem icon={Code2} label="Problems" to="/problems" collapsed={collapsed} />
        <SidebarItem icon={BookOpen} label="Roadmap" to="/roadmap" collapsed={collapsed} />
        <SidebarItem icon={Trophy} label="Contests" to="/contests" collapsed={collapsed} />
        <div className="my-6 border-t border-slate-100 dark:border-dark-border mx-2" />
        <SidebarItem icon={User} label="Profile" to="/profile" collapsed={collapsed} />
        <SidebarItem icon={Settings} label="Settings" to="/settings" collapsed={collapsed} />
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-2">
        <button className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 w-full transition-all">
          <LogOut size={22} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-primary-600 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
