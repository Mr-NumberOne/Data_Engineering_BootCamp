import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Trash2, CheckCircle, Clock, Circle, Edit2, Folder, Briefcase, Target, Star, Zap, Book, Monitor, Layout } from 'lucide-react';

const AVAILABLE_ICONS = { Folder, Briefcase, Target, Star, Zap, Book, Monitor, Layout };
const AVAILABLE_COLORS = ['#476EAE', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];

const ProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [editingProject, setEditingProject] = useState(false);
    const [editProjectData, setEditProjectData] = useState({ name: '', description: '', icon: 'Folder', color: '#476EAE' });
    const [editingTask, setEditingTask] = useState(null);
    const [editTaskData, setEditTaskData] = useState({ title: '', status: '' });
    const [deletingProject, setDeletingProject] = useState(false);
    const [deletingTask, setDeletingTask] = useState(null);

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks/project/${id}`)
            ]);
            setProject(projRes.data);
            setTasks(tasksRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            await api.post('/tasks/', { title: newTaskTitle, project_id: parseInt(id) });
            setNewTaskTitle('');
            const res = await api.get(`/tasks/project/${id}`);
            setTasks(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateTaskStatus = async (taskId, currentStatus) => {
        const statusFlow = {
            'TODO': 'IN_PROGRESS',
            'IN_PROGRESS': 'DONE',
            'DONE': 'TODO'
        };
        const nextStatus = statusFlow[currentStatus] || 'TODO';

        try {
            await api.put(`/tasks/${taskId}`, { status: nextStatus });
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditProjectClick = () => {
        setEditProjectData({
            name: project.name,
            description: project.description,
            icon: project.icon || 'Folder',
            color: project.color || '#476EAE'
        });
        setEditingProject(true);
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${id}`, editProjectData);
            setEditingProject(false);
            fetchProjectData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditTaskClick = (e, task) => {
        e.stopPropagation();
        setEditingTask(task.id);
        setEditTaskData({ title: task.title, status: task.status });
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tasks/${editingTask}`, editTaskData);
            setEditingTask(null);
            fetchProjectData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteProject = async () => {
        try {
            await api.delete(`/projects/${id}`);
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTask = async () => {
        try {
            await api.delete(`/tasks/${deletingTask}`);
            setDeletingTask(null);
            fetchProjectData();
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'DONE': return <CheckCircle size={20} color="var(--success)" />;
            case 'IN_PROGRESS': return <Clock size={20} color="var(--warning)" />;
            default: return <Circle size={20} color="var(--text-muted)" />;
        }
    };

    if (loading) return (<div><Navbar /><div className="flex-center p-5">Loading project...</div></div>);
    if (!project) return (<div><Navbar /><div className="flex-center p-5">Project not found</div></div>);

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: `${project.color || '#476EAE'}20`, color: project.color || '#476EAE' }}>
                                {(() => {
                                    const IconComponent = AVAILABLE_ICONS[project.icon] || Folder;
                                    return <IconComponent size={28} />;
                                })()}
                            </div>
                            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {project.name}
                                <button onClick={handleEditProjectClick} className="btn" style={{ padding: '0.25rem', background: 'transparent', color: 'var(--text-muted)' }}>
                                    <Edit2 size={16} />
                                </button>
                            </h1>
                        </div>
                        <p style={{ margin: 0 }}>{project.description}</p>
                    </div>
                    <button onClick={() => setDeletingProject(true)} className="btn btn-danger">
                        <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Delete Project
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3>Add New Task</h3>
                    <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            className="input-field"
                            style={{ flexGrow: 1, margin: 0 }}
                            placeholder="What needs to be done?"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">Add Task</button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Tasks</h3>
                    {tasks.length === 0 ? (
                        <p className="text-center text-muted" style={{ padding: '2rem 0' }}>No tasks assigned to this project yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {tasks.map(task => (
                                <div key={task.id} style={{
                                    display: 'flex', alignItems: 'center', padding: '1rem 1.5rem',
                                    background: 'var(--white)', borderRadius: '12px',
                                    border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s ease', cursor: 'pointer'
                                }}
                                    onClick={() => updateTaskStatus(task.id, task.status)}>
                                    <div style={{ marginRight: '1rem' }}>
                                        {getStatusIcon(task.status)}
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <div style={{ fontWeight: 500, color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.status === 'DONE' ? 'line-through' : 'none' }}>
                                            {task.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Status: <span style={{ fontWeight: 600 }}>{task.status}</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleEditTaskClick(e, task)} className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)' }}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setDeletingTask(task.id); }} className="btn" style={{ padding: '0.5rem', background: 'transparent', color: 'var(--danger)' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Project Modal */}
            {
                editingProject && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--white)' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Edit Project</h2>
                            <form onSubmit={handleUpdateProject}>
                                <div className="input-group">
                                    <label className="input-label">Project Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        value={editProjectData.name}
                                        onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        value={editProjectData.description}
                                        onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
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
                                                    onClick={() => setEditProjectData({ ...editProjectData, icon: iconName })}
                                                    style={{
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        border: editProjectData.icon === iconName ? `2px solid ${editProjectData.color}` : '2px solid transparent',
                                                        background: editProjectData.icon === iconName ? `${editProjectData.color}20` : 'var(--bg-color)',
                                                        color: editProjectData.icon === iconName ? editProjectData.color : 'var(--text-muted)',
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
                                                onClick={() => setEditProjectData({ ...editProjectData, color })}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: color,
                                                    border: editProjectData.color === color ? '3px solid var(--white)' : '3px solid transparent',
                                                    boxShadow: editProjectData.color === color ? `0 0 0 2px ${color}` : 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" onClick={() => setEditingProject(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Task Modal */}
            {
                editingTask && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', background: 'var(--white)' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Edit Task</h2>
                            <form onSubmit={handleUpdateTask}>
                                <div className="input-group">
                                    <label className="input-label">Task Title</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        required
                                        value={editTaskData.title}
                                        onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Status</label>
                                    <select
                                        className="input-field"
                                        value={editTaskData.status}
                                        onChange={(e) => setEditTaskData({ ...editTaskData, status: e.target.value })}
                                    >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="DONE">DONE</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" onClick={() => setEditingTask(null)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Delete Project Modal */}
            {
                deletingProject && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--white)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--danger)' }}>
                                <Trash2 size={48} />
                            </div>
                            <h2 style={{ marginBottom: '1rem' }}>Delete Project?</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                Are you sure you want to delete this project and all of its tasks? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                <button type="button" onClick={() => setDeletingProject(false)} className="btn btn-secondary">Cancel</button>
                                <button type="button" onClick={handleDeleteProject} className="btn btn-danger">Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Task Modal */}
            {
                deletingTask && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--white)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--danger)' }}>
                                <Trash2 size={48} />
                            </div>
                            <h2 style={{ marginBottom: '1rem' }}>Delete Task?</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                                Are you sure you want to delete this task? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                <button type="button" onClick={() => setDeletingTask(null)} className="btn btn-secondary">Cancel</button>
                                <button type="button" onClick={handleDeleteTask} className="btn btn-danger">Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProjectDetail;
