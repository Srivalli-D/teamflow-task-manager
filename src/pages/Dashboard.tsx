import { useEffect, useState } from 'react';
import api from '../services/api';
import { motion } from 'motion/react';
import { 
  Projector, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  LayoutGrid,
  ListTodo
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
  projectsCount: number;
  tasksCount: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  recentTasks: any[];
}

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-neutral-700 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-2 py-1 bg-neutral-800/50 rounded-full">
          Live <TrendingUp className="w-3 h-3" />
        </span>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-neutral-900 rounded-2xl border border-neutral-800" />)}
    </div>
    <div className="h-96 bg-neutral-900 rounded-2xl border border-neutral-800" />
  </div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-emerald-500/10 text-emerald-500';
      case 'In Progress': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-neutral-500/10 text-neutral-500';
    }
  };

  const getUrgencyStyles = (dueDate: string, status: string) => {
    if (!dueDate || status === 'Done') return 'text-neutral-600';
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (diff < 0) return 'text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded';
    if (hours < 24) return 'text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded';
    return 'text-neutral-500';
  };

  const overdueTasks = stats?.recentTasks.filter(t => {
    if (!t.due_date || t.status === 'Done') return false;
    return new Date(t.due_date).getTime() < new Date().getTime();
  }) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">System Overview</h2>
          <p className="text-neutral-500 mt-1">Real-time performance and team activity</p>
        </div>
        <Link 
          to="/projects" 
          className="bg-white text-neutral-950 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-xl shadow-white/5"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </header>

      {overdueTasks.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="bg-red-500/20 p-2 rounded-xl text-red-500">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-200 uppercase tracking-widest">Action Required</p>
            <p className="text-sm text-neutral-400">You have <span className="font-bold text-white">{overdueTasks.length}</span> overdue tasks across your projects.</p>
          </div>
          <Link to="/projects" className="text-xs font-bold text-neutral-500 hover:text-white uppercase tracking-widest underline decoration-neutral-800 underline-offset-4">
            Review Now
          </Link>
        </motion.div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Projects" 
          value={stats?.projectsCount || 0} 
          icon={LayoutGrid} 
          color="bg-blue-500" 
          trend={true}
        />
        <StatCard 
          label="Active Tasks" 
          value={stats?.tasksCount || 0} 
          icon={ListTodo} 
          color="bg-purple-500" 
        />
        <StatCard 
          label="Completed" 
          value={stats?.tasksByStatus.find(s => s.status === 'Done')?.count || 0} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label="In Progress" 
          value={stats?.tasksByStatus.find(s => s.status === 'In Progress')?.count || 0} 
          icon={Clock} 
          color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <Link to="/projects" className="text-xs font-bold text-neutral-500 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {stats?.recentTasks && stats.recentTasks.length > 0 ? (
              <div className="divide-y divide-neutral-800">
                {stats.recentTasks.map((task, i) => (
                  <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-neutral-800/50 transition-colors cursor-default group">
                    <div className={cn("w-1.5 h-8 rounded-full", task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{task.project_name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider", getUrgencyStyles(task.due_date, task.status))}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : task.status}
                      </span>
                      <time className="text-[10px] font-mono text-neutral-600 group-hover:text-neutral-400 transition-colors uppercase">
                        {new Date(task.updated_at).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-neutral-600">
                <BarChart3 className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-sm font-medium">No recent activity found</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white px-2">Task Priority</h3>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6">
            {['High', 'Medium', 'Low'].map((priority) => {
              const count = stats?.tasksByPriority.find(p => p.priority === priority)?.count || 0;
              const percentage = stats?.tasksCount ? (count / stats.tasksCount) * 100 : 0;
              const color = priority === 'High' ? 'bg-red-500' : priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500';
              
              return (
                <div key={priority} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-neutral-400">{priority}</span>
                    <span className="text-white">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn("h-full rounded-full transition-all duration-1000", color)}
                    />
                  </div>
                </div>
              );
            })}
            
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex items-start gap-3 p-4 bg-red-900/10 rounded-xl border border-red-900/20">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-100 uppercase tracking-wide">Attention Required</p>
                  <p className="text-xs text-red-200/60 mt-1">
                    {stats?.tasksByPriority.find(p => p.priority === 'High')?.count || 0} critical tasks pending review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any) {
  return twMerge(clsx(inputs));
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
