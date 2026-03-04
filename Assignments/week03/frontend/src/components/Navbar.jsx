import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, FolderHeart, Activity } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem', color: 'white', display: 'flex' }}>
                        <FolderHeart size={24} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>ProManager</h2>
                </Link>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', border: 'none', background: 'transparent' }}>Projects</Link>
                    <Link to="/logs" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', border: 'none', background: 'transparent', display: 'flex', gap: '0.5rem' }}>
                        <Activity size={18} />
                        Activity Logs
                    </Link>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>{user.email}</span>
                <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
