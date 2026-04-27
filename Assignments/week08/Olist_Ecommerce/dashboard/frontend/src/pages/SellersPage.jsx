import React from 'react';
import LeadConversionChart from '../components/LeadConversionChart';
import DataTable from '../components/DataTable';
import { Database } from 'lucide-react';

const SellersPage = ({ data, loading, theme }) => {
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-primary animate-pulse flex flex-col items-center gap-4">
                <Database size={48} className="animate-spin-slow" />
                <span className="font-semibold font-mono text-lg text-textPrimary">Fetching Seller Data...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold font-sans text-textPrimary">Sellers & Leads</h2>
                <p className="text-textSecondary text-sm mt-1">Marketing funnel and seller performance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <LeadConversionChart data={data.leads} theme={theme} />
                </div>
            </div>
            
            <div className="w-full mt-6">
                <DataTable 
                    title="GET /v1/sellers/performance" 
                    description="Retrieves aggregate performance metrics for top sellers."
                    method="GET"
                    theme={theme}
                    columns={[
                        { header: 'Location', accessor: 'city', render: r => <span className="font-mono text-sm">{r.city}, {r.state}</span> },
                        { header: 'Fulfilled', accessor: 'orders', render: r => <span className="font-mono text-sm">{r.orders}</span> },
                        { header: 'Revenue', accessor: 'revenue', render: r => <span className="font-mono text-sm font-semibold text-textPrimary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.revenue)}</span> },
                        { header: 'Avg Delivery', accessor: 'delivery_days', render: r => <span className="font-mono text-sm">{r.delivery_days} days</span> },
                        { header: 'Review', accessor: 'review_score', render: r => <span className="font-mono text-sm font-semibold text-secondary">{r.review_score} / 5.0</span> }
                    ]}
                    data={data.sellers}
                />
            </div>
        </div>
    );
};

export default SellersPage;
