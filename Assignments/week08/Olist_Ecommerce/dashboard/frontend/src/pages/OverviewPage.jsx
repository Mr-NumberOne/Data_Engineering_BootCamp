import React from 'react';
import KpiCards from '../components/KpiCards';
import SalesTrendChart from '../components/SalesTrendChart';
import PaymentDistributionChart from '../components/PaymentDistributionChart';
import CategoryRevenueChart from '../components/CategoryRevenueChart';
import DayOfWeekChart from '../components/DayOfWeekChart';
import { Database } from 'lucide-react';

const OverviewPage = ({ data, loading, theme }) => {
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-primary animate-pulse flex flex-col items-center gap-4">
                <Database size={48} className="animate-spin-slow" />
                <span className="font-semibold font-mono text-lg text-textPrimary">Fetching Dashboard Data...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold font-sans text-textPrimary">Overview Dashboard</h2>
                <p className="text-textSecondary text-sm mt-1">High-level metrics and sales trajectory.</p>
            </div>
            
            <KpiCards kpis={data.kpis} theme={theme} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesTrendChart data={data.salesTrend} theme={theme} />
                </div>
                <div className="lg:col-span-1">
                    <PaymentDistributionChart data={data.payments} theme={theme} />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="col-span-1">
                    <CategoryRevenueChart data={data.categories} theme={theme} />
                </div>
                <div className="col-span-1">
                    <DayOfWeekChart data={data.dayOfWeek} theme={theme} />
                </div>
            </div>
        </div>
    );
};

export default OverviewPage;
