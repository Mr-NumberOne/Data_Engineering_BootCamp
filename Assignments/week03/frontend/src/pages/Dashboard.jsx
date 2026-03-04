import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Folder, Briefcase, Target, Star, Zap, Book, Monitor, Layout } from 'lucide-react';

const AVAILABLE_ICONS = { Folder, Briefcase, Target, Star, Zap, Book, Monitor, Layout };
const AVAILABLE_COLORS = ['#476EAE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', icon: 'Folder', color: '#476EAE' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects/');
            setProjects(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects/', newProject);
            setShowModal(false);
            setNewProject({ name: '', description: '', icon: 'Folder', color: '#476EAE' });
            fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <Navbar />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Projects Dashboard</h1>
                        <p>Manage your projects and their associated tasks.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <PlusCircle size={20} /> New Project
                    </button>
                </div>

                {loading ? (
                    <div className="flex-center p-5"><p>Loading projects...</p></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                        {projects.length === 0 ? (
                            <div className="glass-panel text-center" style={{ gridColumn: '1 / -1', padding: '4rem' }}>
                                <Folder size={48} color="var(--primary-light)" style={{ marginBottom: '1rem' }} />
                                <h3>No projects yet</h3>
                                <p>Create your first project to get started organizing your work.</p>
                            </div>
                        ) : (
                            projects.map(project => {
                                const IconComponent = AVAILABLE_ICONS[project.icon] || Folder;
                                const projectColor = project.color || '#476EAE';
                                return (
                                    <Link
                                        to={`/projects/${project.id}`}
                                        key={project.id}
                                        className="glass-panel hover-lift"
                                        style={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%',
                                            borderTop: `4px solid ${projectColor}`,
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                    >
                                        <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: `${projectColor}20`, color: projectColor }}>
                                                <IconComponent size={24} />
                                            </div>
                                            {project.name}
                                        </h3>
                                        <p style={{ marginTop: '1rem', flexGrow: 1 }}>{project.description || 'No description provided.'}</p>
                                        <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Created: {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--white)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <div className="input-group">
                                <label className="input-label">Project Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Description (Optional)</label>
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Project Icon</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {Object.keys(AVAILABLE_ICONS).map(iconName => {
                                        const Icon = AVAILABLE_ICONS[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setNewProject({ ...newProject, icon: iconName })}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: newProject.icon === iconName ? `2px solid ${newProject.color}` : '2px solid transparent',
                                                    background: newProject.icon === iconName ? `${newProject.color}20` : 'var(--bg-color)',
                                                    color: newProject.icon === iconName ? newProject.color : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Icon size={24} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Project Color</label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {AVAILABLE_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewProject({ ...newProject, color })}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: color,
                                                border: newProject.color === color ? '3px solid var(--white)' : '3px solid transparent',
                                                boxShadow: newProject.color === color ? `0 0 0 2px ${color}` : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
