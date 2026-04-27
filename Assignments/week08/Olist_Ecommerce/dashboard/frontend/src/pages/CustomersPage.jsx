import React from 'react';
import GeoDistributionChart from '../components/GeoDistributionChart';
import CohortMatrix from '../components/CohortMatrix';
import DataTable from '../components/DataTable';
import { Database } from 'lucide-react';

const CustomersPage = ({ data, loading, theme }) => {
    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-primary animate-pulse flex flex-col items-center gap-4">
                <Database size={48} className="animate-spin-slow" />
                <span className="font-semibold font-mono text-lg text-textPrimary">Fetching Customer Data...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold font-sans text-textPrimary">Customers Analysis</h2>
                <p className="text-textSecondary text-sm mt-1">Geographic distribution and VIP segmentation.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <GeoDistributionChart data={data.geo} theme={theme} />
                </div>
                <div className="lg:col-span-2">
                    <CohortMatrix data={data.cohorts} theme={theme} />
                </div>
            </div>
            
            <div className="w-full mt-6">
                <DataTable 
                    title="GET /v1/customers/vip" 
                    description="Retrieves top customers by monetary value (RFM)."
                    method="GET"
                    theme={theme}
                    columns={[
                        { header: 'Location', accessor: 'city', render: r => <span className="font-mono text-sm">{r.city}, {r.state}</span> },
                        { header: 'Orders', accessor: 'orders', render: r => <span className="font-mono text-sm">{r.orders}</span> },
                        { header: 'Total Spent', accessor: 'spent', render: r => <span className="font-mono text-sm font-semibold text-textPrimary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.spent)}</span> },
                        { header: 'AOV', accessor: 'aov', render: r => <span className="font-mono text-sm text-textSecondary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.aov)}</span> },
                        { header: 'Last Active', accessor: 'last_order', render: r => <span className="font-mono text-sm text-textSecondary">{r.last_order}</span> }
                    ]}
                    data={data.rfm}
                />
            </div>
        </div>
    );
};

export default CustomersPage;
