import React from 'react';
import { Filter, Calendar, MapPin } from 'lucide-react';

const GlobalFilters = ({ options, filters, setFilters }) => {
    
    const handleChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? null : value
        }));
    };

    return (
        <div className="bg-surface border border-borderDefault rounded-2xl p-4 mb-8 shadow-soft flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-textPrimary font-semibold font-mono">
                <Filter size={18} className="text-primary" />
                <span>Filters</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                {/* Date Filter */}
                <div className="flex items-center bg-surface rounded-2xl px-3 py-2 border border-borderHover focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 transition-all">
                    <Calendar size={16} className="text-textSecondary mr-2" />
                    <select 
                        className="bg-transparent border-none outline-none text-[13px] text-textPrimary cursor-pointer w-full sm:w-auto appearance-none font-sans font-medium"
                        value={filters.year_month || 'all'}
                        onChange={(e) => handleChange('year_month', e.target.value)}
                    >
                        <option value="all">All Time</option>
                        {options?.months?.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                </div>

                {/* State Filter */}
                <div className="flex items-center bg-surface rounded-2xl px-3 py-2 border border-borderHover focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15 transition-all">
                    <MapPin size={16} className="text-textSecondary mr-2" />
                    <select 
                        className="bg-transparent border-none outline-none text-[13px] text-textPrimary cursor-pointer w-full sm:w-auto appearance-none font-sans font-medium"
                        value={filters.state || 'all'}
                        onChange={(e) => handleChange('state', e.target.value)}
                    >
                        <option value="all">All States</option>
                        {options?.states?.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default GlobalFilters;
