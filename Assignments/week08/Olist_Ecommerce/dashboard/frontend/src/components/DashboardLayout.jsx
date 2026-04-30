import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Database, LayoutDashboard, Users, Store, Truck, Calendar, MapPin, Search, Bell, Sun, Moon } from 'lucide-react';

const Topbar = ({ options, filters, setFilters, theme, toggleTheme }) => {
    const handleChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value === 'all' ? null : value }));
    };

    return (
        <header className="h-20 bg-surface border-b border-borderDefault flex items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-300">
            {/* Search (Mocked for design accuracy) */}
            <div className="flex items-center gap-3 bg-background rounded-full px-4 py-2 w-64 border border-borderDefault focus-within:border-primary/50 transition-colors">
                <Search size={18} className="text-textSecondary" />
                <input type="text" placeholder="Search here..." className="bg-transparent border-none outline-none text-sm w-full text-textPrimary" />
            </div>

            <div className="flex items-center gap-6">
                {/* Global Filters */}
                <div className="flex items-center gap-4 bg-background rounded-full px-2 py-1 border border-borderDefault transition-colors">
                    <div className="flex items-center px-3 py-1.5 rounded-full hover:bg-surface transition-colors">
                        <Calendar size={16} className="text-primary mr-2" />
                        <select 
                            className="bg-transparent border-none outline-none text-sm text-textPrimary cursor-pointer font-medium appearance-none"
                            value={filters.year_month || 'all'}
                            onChange={(e) => handleChange('year_month', e.target.value)}
                        >
                            <option value="all">All Time</option>
                            {options?.months?.map(month => <option key={month} value={month}>{month}</option>)}
                        </select>
                    </div>
                    <div className="w-px h-6 bg-borderDefault"></div>
                    <div className="flex items-center px-3 py-1.5 rounded-full hover:bg-surface transition-colors">
                        <MapPin size={16} className="text-primary mr-2" />
                        <select 
                            className="bg-transparent border-none outline-none text-sm text-textPrimary cursor-pointer font-medium appearance-none"
                            value={filters.state || 'all'}
                            onChange={(e) => handleChange('state', e.target.value)}
                        >
                            <option value="all">All States</option>
                            {options?.states?.map(state => <option key={state} value={state}>{state}</option>)}
                        </select>
                    </div>
                </div>

                {/* Theme Toggle & Profile */}
                <div className="flex items-center gap-4 border-l border-borderDefault pl-6">
                    <button 
                        onClick={toggleTheme}
                        className="text-textSecondary hover:text-primary transition-colors p-2 rounded-full hover:bg-background"
                        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button className="relative text-textSecondary hover:text-primary transition-colors p-2 rounded-full hover:bg-background">
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
                        <img src="https://ui-avatars.com/api/?name=Olist+Admin&background=4d6fb0&color=fff" alt="Profile" />
                    </div>
                </div>
            </div>
        </header>
    );
};

const Sidebar = () => {
    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/sellers', label: 'Sellers', icon: Store },
        { path: '/logistics', label: 'Logistics', icon: Truck },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-borderDefault flex flex-col hidden md:flex z-30 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300">
            <div className="h-20 flex items-center px-8 border-b border-borderDefault shrink-0">
                <h1 className="text-xl font-bold font-sans tracking-tight text-textPrimary flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-medium shadow-primary/30">
                        <Database size={18} strokeWidth={2.5} />
                    </div>
                    Olist<span className="text-primary">Analytics</span>
                </h1>
            </div>
            
            <div className="px-6 py-8 flex-1 overflow-y-auto">
                <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-4 ml-2">Dashboard</p>
                <nav className="space-y-2">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                                ${isActive 
                                    ? 'bg-primary text-white shadow-md shadow-primary/25 translate-x-1' 
                                    : 'text-textSecondary hover:bg-background hover:text-primary'
                                }
                            `}
                        >
                            <item.icon size={18} strokeWidth={2} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            <div className="p-6 border-t border-borderDefault shrink-0">
                <p className="text-xs text-textSecondary text-center font-mono">
                    &copy; 2026 mr.number one
                </p>
            </div>
        </aside>
    );
};

const DashboardLayout = ({ options, filters, setFilters, theme, toggleTheme }) => {
    return (
        <div className={`min-h-screen bg-background text-textPrimary flex transition-colors duration-300`}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Topbar options={options} filters={filters} setFilters={setFilters} theme={theme} toggleTheme={toggleTheme} />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
