import React from 'react';
import DeliveryPerformanceChart from '../components/DeliveryPerformanceChart';
import GeoDistributionChart from '../components/GeoDistributionChart';
import FreightRatioChart from '../components/FreightRatioChart';
import { Database } from 'lucide-react';

const LogisticsPage = ({ data, loading, theme }) => {
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-primary animate-pulse flex flex-col items-center gap-4">
                <Database size={48} className="animate-spin-slow" />
                <span className="font-semibold font-mono text-lg text-textPrimary">Fetching Logistics Data...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold font-sans text-textPrimary">Logistics & Delivery</h2>
                <p className="text-textSecondary text-sm mt-1">Delivery delays and regional distribution.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="col-span-1">
                    <DeliveryPerformanceChart data={data.delivery} theme={theme} />
                </div>
                <div className="col-span-1 flex flex-col gap-6">
                    <GeoDistributionChart data={data.geo} theme={theme} />
                    <FreightRatioChart data={data.freightRatio} theme={theme} />
                </div>
            </div>
        </div>
    );
};

export default LogisticsPage;
