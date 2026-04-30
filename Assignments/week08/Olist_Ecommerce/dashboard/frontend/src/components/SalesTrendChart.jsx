import React from 'react';
import { Line } from 'react-chartjs-2';
import InfoTooltip from './InfoTooltip';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const SalesTrendChart = ({ data, theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#F8FAFC' : '#1F2937';

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'Revenue',
                data: data.map(d => d.revenue),
                borderColor: '#4d6fb0',
                backgroundColor: isDark ? 'rgba(77, 111, 176, 0.2)' : 'rgba(77, 111, 176, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#FFFFFF',
                pointBorderWidth: 2,
            }
        ]
    };

    const options = {
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
                        return ` ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 } }
            },
            y: {
                grid: { color: gridColor, drawBorder: false },
                ticks: {
                    color: textColor,
                    font: { family: 'IBM Plex Mono', size: 11 },
                    callback: function(value) {
                        return 'R$ ' + value / 1000 + 'k';
                    }
                }
            }
        }
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono mr-3">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/sales/trend</h2>
                    <InfoTooltip text="Displays the total revenue generated month-over-month. Helps identify seasonal spikes or overall business growth trajectories." />
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Monthly revenue over time</p>
            </div>
            <div className="flex-1 min-h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default SalesTrendChart;
