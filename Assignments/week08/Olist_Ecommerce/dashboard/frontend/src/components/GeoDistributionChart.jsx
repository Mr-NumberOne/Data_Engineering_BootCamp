import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const GeoDistributionChart = ({ data, theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#F8FAFC' : '#1F2937';

    const chartData = {
        labels: data.map(d => d.state),
        datasets: [
            {
                data: data.map(d => d.revenue),
                backgroundColor: [
                    '#476eae', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b',
                    '#ef4444', '#8b5cf6', '#6366f1', '#14b8a6', '#f43f5e'
                ],
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: 2,
                hoverOffset: 4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 }, usePointStyle: true, padding: 16 }
            },
            tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: textColor,
                borderColor: gridColor,
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                titleFont: { family: 'IBM Plex Mono', size: 13 },
                bodyFont: { family: 'Inter', size: 13 },
                callbacks: {
                    label: context => ` ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed)}`
                }
            }
        },
        cutout: '65%'
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/sales/geo</h2>
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Top 10 states by revenue</p>
            </div>
            <div className="flex-1 relative min-h-[200px]">
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default GeoDistributionChart;
