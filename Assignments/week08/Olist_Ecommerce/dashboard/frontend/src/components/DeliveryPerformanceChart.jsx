import React from 'react';
import { Bar } from 'react-chartjs-2';
import InfoTooltip from './InfoTooltip';

const DeliveryPerformanceChart = ({ data, theme }) => {
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
                label: 'Late Delivery %',
                data: data.map(d => d.late_percentage),
                backgroundColor: '#f59e0b', // Warning
                borderRadius: 4,
                barPercentage: 0.6,
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
                        return ` ${context.parsed.y}% Late`;
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
                ticks: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 }, callback: value => value + '%' }
            }
        }
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono mr-3">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/delivery/performance</h2>
                    <InfoTooltip text="Tracks the percentage of orders delivered later than the estimated delivery date across the top states. A key metric for customer satisfaction." />
                </div>
                <p className="text-[13px] text-textSecondary font-sans">% of orders delivered after estimate</p>
            </div>
            <div className="flex-1 min-h-[250px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default DeliveryPerformanceChart;
