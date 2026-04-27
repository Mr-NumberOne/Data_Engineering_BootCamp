import React from 'react';

const CohortMatrix = ({ data, theme }) => {
    if (!data || data.length === 0) return (
        <div className="bg-surface rounded-2xl p-6 border border-borderDefault shadow-soft w-full transition-colors duration-300">
            <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono">GET</span>
                <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/customers/cohorts</h2>
            </div>
            <div className="text-textSecondary text-[13px] text-center py-8">No data available</div>
        </div>
    );

    const isDark = theme === 'dark';

    return (
        <div className="bg-surface rounded-2xl shadow-soft border border-borderDefault w-full overflow-hidden flex flex-col h-full transition-colors duration-300">
            <div className="p-6 border-b border-borderDefault flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/customers/cohorts</h2>
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Repeat purchase rate by first-order month</p>
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-background border-b border-borderDefault sticky top-0 transition-colors duration-300">
                        <tr>
                            <th className="px-6 py-3 text-[11px] font-semibold text-textSecondary font-mono tracking-wider">Cohort Month</th>
                            <th className="px-6 py-3 text-[11px] font-semibold text-textSecondary font-mono tracking-wider text-right">Cohort Size</th>
                            <th className="px-6 py-3 text-[11px] font-semibold text-textSecondary font-mono tracking-wider text-right">Repeat Customers</th>
                            <th className="px-6 py-3 text-[11px] font-semibold text-textSecondary font-mono tracking-wider text-right">Repeat Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className={`border-b border-borderDefault transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-primaryLight'}`}>
                                <td className="px-6 py-4 text-[13px] font-mono text-textPrimary">{row.cohort}</td>
                                <td className="px-6 py-4 text-[13px] font-mono text-textSecondary text-right">{new Intl.NumberFormat('pt-BR').format(row.size)}</td>
                                <td className="px-6 py-4 text-[13px] font-mono text-textSecondary text-right">{new Intl.NumberFormat('pt-BR').format(row.repeat)}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[12px] font-semibold font-mono ${row.rate > 2 ? 'bg-success/10 text-success' : 'bg-background text-textSecondary'}`}>
                                        {row.rate.toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CohortMatrix;
