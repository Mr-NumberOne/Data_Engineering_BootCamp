import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CategoryRevenueChart = ({ data, theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#F8FAFC' : '#1F2937';

    const chartData = {
        labels: data.map(d => d.category.split('_').join(' ').substring(0, 15) + (d.category.length > 15 ? '...' : '')),
        datasets: [
            {
                label: 'Revenue',
                data: data.map(d => d.revenue),
                backgroundColor: '#476eae', // Primary
                borderRadius: 4,
                barPercentage: 0.7,
            }
        ]
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
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
                    label: function(context) {
                        return ` ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.x)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: gridColor, drawBorder: false },
                ticks: {
                    color: textColor,
                    font: { family: 'IBM Plex Mono', size: 11 },
                    callback: function(value) {
                        return 'R$ ' + value / 1000 + 'k';
                    }
                }
            },
            y: {
                grid: { display: false, drawBorder: false },
                ticks: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 } }
            }
        }
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/categories/top</h2>
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Top 10 categories by revenue generation</p>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default CategoryRevenueChart;
