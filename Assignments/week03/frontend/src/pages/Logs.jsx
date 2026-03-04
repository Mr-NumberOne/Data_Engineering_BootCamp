import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Activity, Clock, Folder, Briefcase, Target, Star, Zap, Book, Monitor, Layout, ChevronDown, ChevronUp } from 'lucide-react';

const AVAILABLE_ICONS = { Folder, Briefcase, Target, Star, Zap, Book, Monitor, Layout };

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProjects, setExpandedProjects] = useState({});

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs/');
            setLogs(res.data);

            // Expand all by default initially
            const initialExpanded = {};
            res.data.forEach(log => {
                const pId = log.project ? log.project.id : 'unassigned';
                initialExpanded[pId] = true;
            });
            setExpandedProjects(initialExpanded);

            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    return (
        <div>
            <Navbar />

            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '50%', color: 'white', display: 'flex' }}>
                        <Activity size={28} />
                    </div>
                    <div>
                        <h1 style={{ margin: 0 }}>Activity Logs</h1>
                        <p>Track all edits and actions performed across your projects.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-5">Loading logs...</div>
                ) : (
                    <div>
                        {logs.length === 0 ? (
                            <div className="glass-panel text-center p-5">No activity recorded yet.</div>
                        ) : (
                            Object.entries(
                                logs.reduce((acc, log) => {
                                    const projectId = log.project ? log.project.id : 'unassigned';
                                    if (!acc[projectId]) {
                                        acc[projectId] = {
                                            project: log.project,
                                            logs: []
                                        };
                                    }
                                    acc[projectId].logs.push(log);
                                    return acc;
                                }, {})
                            ).map(([projectId, group]) => {
                                const projectColor = group.project?.color || '#476EAE';
                                const IconComponent = AVAILABLE_ICONS[group.project?.icon] || Folder;

                                const isExpanded = expandedProjects[projectId];

                                return (
                                    <div key={projectId} className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
                                        <div
                                            onClick={() => toggleProject(projectId)}
                                            style={{
                                                padding: '1.5rem',
                                                background: `${projectColor}15`,
                                                borderBottom: isExpanded ? `1px solid ${projectColor}30` : 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = `${projectColor}25`}
                                            onMouseLeave={(e) => e.currentTarget.style.background = `${projectColor}15`}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: `${projectColor}20`, color: projectColor }}>
                                                <IconComponent size={24} />
                                            </div>
                                            <h3 style={{ margin: 0, color: projectColor, flexGrow: 1 }}>{group.project ? group.project.name : 'Unassigned / Deleted Project'}</h3>
                                            <div style={{ color: projectColor, opacity: 0.8 }}>
                                                {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                                {group.logs.map((log, idx) => (
                                                    <li key={log.id} style={{
                                                        padding: '1.5rem',
                                                        borderBottom: idx !== group.logs.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '1rem',
                                                        animation: 'fadeIn 0.3s ease-in-out'
                                                    }}>
                                                        <div style={{ color: 'var(--primary)', marginTop: '0.2rem' }}>
                                                            <Clock size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.25rem' }}>
                                                                {log.entity_type} {log.entity_id}
                                                            </div>
                                                            <div style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                                                                {log.action}
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                                {new Date(log.timestamp).toLocaleString(undefined, {
                                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logs;
