import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Users, 
  ListTodo, 
  Calendar, 
  Trash2, 
  UserPlus,
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Check,
  Search
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  // Filters
  const [taskFilters, setTaskFilters] = useState({ priority: 'All', status: 'All', assignee: 'All' });
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [taskSearch, setTaskSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  
  // Forms
  const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', priority: 'Medium', assigned_id: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, membersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
        api.get(`/projects/${id}/members`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error(err);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (editingTask) {
      setTaskForm({
        title: editingTask.title,
        description: editingTask.description || '',
        due_date: editingTask.due_date || '',
        priority: editingTask.priority,
        assigned_id: editingTask.assigned_id?.toString() || ''
      });
      setIsTaskModalOpen(true);
    } else {
      setTaskForm({ title: '', description: '', due_date: '', priority: 'Medium', assigned_id: '' });
    }
  }, [editingTask]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, taskForm);
      } else {
        await api.post(`/projects/${id}/tasks`, taskForm);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      fetchData();
    } catch (err) {
      console.error(err);
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

  const filteredTasks = tasks
    .filter(task => {
      const pMatch = taskFilters.priority === 'All' || task.priority === taskFilters.priority;
      const sMatch = taskFilters.status === 'All' || task.status === taskFilters.status;
      const aMatch = taskFilters.assignee === 'All' || task.assigned_id?.toString() === taskFilters.assignee;
      const qMatch = task.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                     task.description?.toLowerCase().includes(taskSearch.toLowerCase());
      return pMatch && sMatch && aMatch && qMatch;
    })
    .sort((a, b) => {
      const valA = sortBy === 'due_date' ? (a.due_date ? new Date(a.due_date).getTime() : 4102444800000) : new Date(a.created_at).getTime();
      const valB = sortBy === 'due_date' ? (b.due_date ? new Date(b.due_date).getTime() : 4102444800000) : new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  const overdueCount = tasks.filter(t => t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date()).length;
  const upcomingCount = tasks.filter(t => {
    if (t.status === 'Done' || !t.due_date) return false;
    const diff = new Date(t.due_date).getTime() - new Date().getTime();
    return diff > 0 && diff < 86400000;
  }).length;

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, { email: newMemberEmail });
      setIsMemberModalOpen(false);
      setNewMemberEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add member");
    }
  };

  const handleUpdateStatus = async (taskId: number, status: string) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      setTaskToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-white text-center py-20">Loading project details...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-6">
        <button 
          onClick={() => navigate('/projects')}
          className="w-fit flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white uppercase tracking-widest transition-colors mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Projects
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-white tracking-tight">{project?.name}</h2>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
                  {project?.role}
                </span>
              </div>
              <p className="text-neutral-500 max-w-2xl">{project?.description || 'No description provided'}</p>
            </div>

            {(overdueCount > 0 || upcomingCount > 0) && (
              <div className="flex gap-4">
                {overdueCount > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{overdueCount} Overdue</span>
                  </div>
                )}
                {upcomingCount > 0 && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{upcomingCount} Due soon</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {project?.role === 'Admin' && (
              <>
                <button 
                  onClick={() => setIsMemberModalOpen(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wide border border-neutral-700/50"
                >
                  <UserPlus className="w-4 h-4" />
                  Team
                </button>
                <button 
                  onClick={() => setIsTaskModalOpen(true)}
                  className="bg-white hover:bg-neutral-200 text-neutral-950 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wide shadow-xl shadow-white/5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Task Board */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-4 gap-4 px-2">
            <div className="flex items-center gap-3">
              <ListTodo className="w-5 h-5 text-neutral-400" />
              <h3 className="text-xl font-bold text-white">Project Tasks</h3>
              <span className="text-xs font-mono text-neutral-600">[{filteredTasks.length}]</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                 <input 
                  type="text"
                  placeholder="Filter tasks..."
                  className="bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/10 w-40 md:w-60"
                  value={taskSearch}
                  onChange={e => setTaskSearch(e.target.value)}
                 />
              </div>
              <select 
                className="bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/10"
                value={taskFilters.priority}
                onChange={e => setTaskFilters({...taskFilters, priority: e.target.value})}
              >
                <option value="All">All Priorities</option>
                <option value="High">Priority: High</option>
                <option value="Medium">Priority: Medium</option>
                <option value="Low">Priority: Low</option>
              </select>

              <select 
                className="bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/10"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'created_at' | 'due_date')}
              >
                <option value="created_at">Sort: Created</option>
                <option value="due_date">Sort: Due Date</option>
              </select>

              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-lg px-3 py-1.5 hover:text-white transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <select 
                className="bg-neutral-900 border border-neutral-800 text-[10px] font-bold uppercase tracking-widest text-neutral-400 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/10"
                value={taskFilters.assignee}
                onChange={e => setTaskFilters({...taskFilters, assignee: e.target.value})}
              >
                <option value="All">All Assignees</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
             {['To Do', 'In Progress', 'Done'].map((status) => {
               const columnTasks = filteredTasks.filter(t => t.status === status);
               return (
                 <div key={status} className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Done' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-neutral-500')} />
                        <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{status}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-700">{columnTasks.length}</span>
                    </div>

                    <div className="space-y-4 min-h-[500px]">
                      {columnTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="bg-neutral-900/50 border border-neutral-800/80 p-4 rounded-xl group hover:border-neutral-500 transition-all duration-300 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                             <div className="flex flex-col gap-2">
                               <div className={cn("w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest", 
                                 task.priority === 'High' ? 'bg-red-500/10 text-red-500' : 
                                 task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                                 'bg-blue-500/10 text-blue-500'
                               )}>
                                 {task.priority}
                               </div>
                               {task.assigned_name && (
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                                   <div className="w-4 h-4 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] border border-neutral-700">
                                     {task.assigned_name[0]}
                                   </div>
                                   {task.assigned_name}
                                 </div>
                               )}
                             </div>
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {project?.role === 'Admin' && (
                                 <>
                                   <button 
                                     onClick={() => setEditingTask(task)}
                                     className="p-1 text-neutral-600 hover:text-white transition-colors"
                                     title="Edit Task"
                                   >
                                     <MoreVertical className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={() => setTaskToDelete(task)}
                                     className="p-1 text-neutral-600 hover:text-red-500 transition-colors"
                                     title="Delete Task"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                 </>
                               )}
                             </div>
                          </div>
                          
                          <h5 className="font-bold text-sm text-white mb-2 leading-snug">{task.title}</h5>
                          {task.description && <p className="text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>}
                          
                          <div className="flex items-center justify-between pt-4 border-t border-neutral-800/50 mt-auto">
                            <div className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", getUrgencyStyles(task.due_date, task.status))}>
                               <Calendar className="w-3 h-3" />
                               {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                            </div>
                            
                            <div className="flex gap-1">
                               {status !== 'To Do' && (
                                 <button onClick={() => handleUpdateStatus(task.id, 'To Do')} className="p-1 hover:bg-neutral-800 rounded text-neutral-600" title="Move to Todo">
                                   <Clock className="w-3 h-3" />
                                 </button>
                               )}
                               {status !== 'In Progress' && (
                                 <button onClick={() => handleUpdateStatus(task.id, 'In Progress')} className="p-1 hover:bg-neutral-800 rounded text-neutral-600" title="Move to In Progress">
                                   <Clock className="w-3 h-3" />
                                 </button>
                               )}
                               {status !== 'Done' && (
                                 <button onClick={() => handleUpdateStatus(task.id, 'Done')} className="p-1 hover:bg-neutral-800 rounded text-neutral-600" title="Mark as Done">
                                   <Check className="w-3 h-3" />
                                 </button>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {columnTasks.length === 0 && (
                        <div className="border border-dashed border-neutral-800 rounded-2xl h-24 flex items-center justify-center">
                          <p className="text-[10px] text-neutral-700 font-bold uppercase tracking-widest">No tasks</p>
                        </div>
                      )}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-2xl">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-neutral-400" />
                  <h3 className="text-lg font-bold text-white">Project Members</h3>
                </div>
                <button 
                  onClick={() => setIsMemberModalOpen(true)}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
             </div>

             <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                  <input 
                    type="text"
                    placeholder="Search people..."
                    className="w-full bg-neutral-800/50 border border-neutral-700/50 text-[10px] font-bold uppercase tracking-widest px-8 py-2.5 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/10"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                </div>
             </div>
             
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {filteredMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border text-xs font-bold uppercase shadow-inner transition-transform group-hover:scale-105",
                        member.role === 'Admin' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                      )}>
                         {member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{member.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
                            member.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-neutral-800 text-neutral-600'
                          )}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="text-[10px] text-neutral-700 text-center uppercase tracking-widest py-4">No results</p>
                )}
             </div>
             
             {project?.role === 'Admin' && (
               <button 
                  onClick={() => setIsMemberModalOpen(true)}
                  className="w-full mt-8 p-3 rounded-xl border border-dashed border-neutral-700 hover:border-neutral-500 text-xs font-bold text-neutral-500 hover:text-white transition-all uppercase tracking-widest"
               >
                  + Add Member
               </button>
             )}
           </div>

           <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-[0.2em]">Quick Stats</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-neutral-500 uppercase tracking-widest">Efficiency</span>
                    <span className="text-emerald-500">92%</span>
                 </div>
                 <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-emerald-500" />
                 </div>
                 <p className="text-[10px] text-neutral-600 leading-relaxed italic">
                   Great work! The team is completing tasks ahead of schedule this week.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }} className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-bold text-white">{editingTask ? 'Edit Task' : 'New Task'}</h3>
                 <button onClick={() => { setIsTaskModalOpen(false); setEditingTask(null); }} className="p-2 hover:bg-neutral-800 rounded-xl transition-colors">
                   <X className="w-5 h-5 text-neutral-400" />
                 </button>
               </div>
               <form onSubmit={handleTaskSubmit} className="space-y-5">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Title</label>
                   <input required className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Description</label>
                   <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10" rows={3} value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Due Date</label>
                     <input type="date" className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Priority</label>
                     <select className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                       <option>Low</option>
                       <option>Medium</option>
                       <option>High</option>
                     </select>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Assignee</label>
                   <select 
                     className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                     value={taskForm.assigned_id}
                     onChange={e => setTaskForm({...taskForm, assigned_id: e.target.value})}
                   >
                     <option value="">Unassigned</option>
                     {members.map(m => (
                       <option key={m.id} value={m.id}>{m.name}</option>
                     ))}
                   </select>
                 </div>
                 <button type="submit" className="w-full bg-white text-neutral-950 font-bold py-4 rounded-xl mt-4">
                   {editingTask ? 'Apply Changes' : 'Create Task'}
                 </button>
               </form>
             </motion.div>
          </div>
        )}
        
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemberModalOpen(false)} className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
               <h3 className="text-xl font-bold text-white mb-6">Add Team Member</h3>
               <form onSubmit={handleAddMember} className="space-y-5">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Address</label>
                   <input required type="email" placeholder="user@example.com" className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} />
                 </div>
                 <button type="submit" className="w-full bg-white text-neutral-950 font-bold py-4 rounded-xl mt-4 uppercase text-xs tracking-[0.2em]">Add Member</button>
               </form>
             </motion.div>
          </div>
        )}

        {taskToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTaskToDelete(null)} className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
               <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                   <Trash2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold text-white">Delete Task?</h3>
                 <p className="text-sm text-neutral-500 leading-relaxed">
                   Are you sure you want to delete <span className="text-white font-bold">"{taskToDelete.title}"</span>? This action cannot be undone.
                 </p>
                 <div className="grid grid-cols-2 gap-3 w-full mt-6">
                   <button 
                     onClick={() => setTaskToDelete(null)}
                     className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleDeleteTask}
                     className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors"
                   >
                     Confirm
                   </button>
                 </div>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any) {
  return twMerge(clsx(inputs));
}
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
