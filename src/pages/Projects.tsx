import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  FolderKanban, 
  ChevronRight, 
  Search, 
  Users, 
  Calendar,
  X,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setIsModalOpen(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Projects</h2>
          <p className="text-neutral-500 mt-1">Manage and collaborate on your team initiatives</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-neutral-950 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Project
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-white transition-colors" />
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-medium animate-pulse">Syncing projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/projects/${project.id}`}
                className="group block h-full bg-neutral-900 border border-neutral-800 p-6 rounded-2xl hover:border-neutral-500 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight className="w-5 h-5 text-neutral-500" />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center group-hover:bg-white group-hover:text-neutral-950 transition-colors">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-white transition-colors">{project.name}</h3>
                </div>
                
                <p className="text-sm text-neutral-500 line-clamp-2 mb-6 min-h-[40px]">
                  {project.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest bg-neutral-800 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" />
                    Team
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-3xl p-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
            <LayoutGrid className="w-8 h-8 text-neutral-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
          <p className="text-neutral-500 max-w-sm mb-8">
            Create your first project to start tracking tasks and collaborating with your team members.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-white font-bold text-sm underline decoration-neutral-700 underline-offset-8 hover:decoration-white transition-all"
          >
            Create your first project →
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white">Create Project</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest ml-1">Project Name</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="e.g. Website Redesign"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    rows={4}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="Describe the goals and scope of this project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-neutral-200 text-neutral-950 font-bold py-4 rounded-xl transition-all shadow-xl shadow-white/5 active:scale-95"
                >
                  Create Project
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
