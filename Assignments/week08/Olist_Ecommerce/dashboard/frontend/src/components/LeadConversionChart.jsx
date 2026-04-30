import React from 'react';
import { Bar } from 'react-chartjs-2';
import InfoTooltip from './InfoTooltip';

const LeadConversionChart = ({ data, theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#F8FAFC' : '#1F2937';

    const chartData = {
        labels: data.map(d => d.origin),
        datasets: [
            {
                label: 'Conversion Rate (%)',
                data: data.map(d => d.rate),
                backgroundColor: '#10b981', // Success/Green
                borderRadius: 4,
                yAxisID: 'y',
                barPercentage: 0.6,
            },
            {
                label: 'Total Leads',
                data: data.map(d => d.total),
                backgroundColor: isDark ? '#334155' : '#E2E8F0', // Gray
                borderRadius: 4,
                yAxisID: 'y1',
                barPercentage: 0.6,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 }, usePointStyle: true }
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
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 } }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: gridColor, drawBorder: false },
                ticks: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 }, callback: value => value + '%' },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: textColor, font: { family: 'IBM Plex Mono', size: 11 } },
            }
        }
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono mr-3">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/leads/conversion</h2>
                    <InfoTooltip text="Shows the conversion rate of marketing qualified leads (MQLs) into active sellers, broken down by their originating marketing channel." />
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Marketing funnel performance by origin</p>
            </div>
            <div className="flex-1 min-h-[250px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default LeadConversionChart;
