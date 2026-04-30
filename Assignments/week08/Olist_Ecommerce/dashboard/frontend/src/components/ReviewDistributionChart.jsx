import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import InfoTooltip from './InfoTooltip';

const ReviewDistributionChart = ({ data, theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#F8FAFC' : '#1F2937';

    // We want to ensure scores are ordered 5 to 1 for the legend/chart
    const sortedData = [...data].sort((a, b) => b.score - a.score);

    const chartData = {
        labels: sortedData.map(d => `${d.score} Star${d.score > 1 ? 's' : ''}`),
        datasets: [
            {
                data: sortedData.map(d => d.count),
                backgroundColor: [
                    '#10b981', // 5 Star - Success green
                    '#34d399', // 4 Star - Light green
                    '#fbbf24', // 3 Star - Yellow
                    '#f87171', // 2 Star - Light red
                    '#ef4444'  // 1 Star - Error red
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
                    label: context => ` ${new Intl.NumberFormat('pt-BR').format(context.parsed)} reviews`
                }
            }
        },
        cutout: '65%'
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono mr-3">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/customers/satisfaction</h2>
                    <InfoTooltip text="Displays the distribution of customer review scores from 1 to 5 stars. Crucial for understanding overall brand perception and customer satisfaction." />
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Customer satisfaction ratings</p>
            </div>
            <div className="flex-1 relative min-h-[200px]">
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default ReviewDistributionChart;
