import React from 'react';

const DataTable = ({ title, description, columns, data, method = "GET", theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';

    return (
        <div className="bg-surface rounded-2xl shadow-soft border border-borderDefault overflow-hidden w-full transition-colors duration-300">
            <div className="p-6 border-b border-borderDefault flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold font-mono ${method === 'GET' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {method}
                    </span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">{title}</h2>
                </div>
                {description && <p className="text-[13px] text-textSecondary font-sans">{description}</p>}
            </div>
            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-background border-b border-borderDefault sticky top-0 transition-colors duration-300">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-3 text-[11px] font-semibold text-textSecondary font-mono tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr key={rowIdx} className={`border-b border-borderDefault transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-primaryLight'}`}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4">
                                        {col.render ? col.render(row) : <span className="font-mono text-[13px] text-textPrimary">{row[col.accessor]}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
