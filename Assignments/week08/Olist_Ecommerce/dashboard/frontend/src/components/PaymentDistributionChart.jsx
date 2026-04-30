import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import InfoTooltip from './InfoTooltip';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PaymentDistributionChart = ({ data, theme }) => {
    if (!data || data.length === 0) return null;

    const isDark = theme === 'dark';
    const textColor = isDark ? '#94A3B8' : '#475569';
    const gridColor = isDark ? '#334155' : '#E2E8F0';
    const tooltipBg = isDark ? '#1E293B' : '#FFFFFF';
    const tooltipText = isDark ? '#F8FAFC' : '#1F2937';

    const chartData = {
        labels: data.map(d => {
            const typeStr = d.payment_type || 'unknown';
            return typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
        }),
        datasets: [
            {
                data: data.map(d => d.total_value),
                backgroundColor: [
                    '#4d6fb0', // Primary
                    '#6385c9', // Secondary
                    '#354e7d', // Tertiary
                    '#10b981', // Success
                    '#f59e0b', // Warning
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
                position: 'bottom',
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    padding: 20,
                    font: { family: 'IBM Plex Mono', size: 11 }
                }
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
                    label: function(context) {
                        return ` ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed)}`;
                    }
                }
            }
        },
        cutout: '70%'
    };

    return (
        <div className="bg-surface rounded-2xl p-6 shadow-soft transition-colors duration-300 h-full flex flex-col border border-borderDefault">
            <div className="mb-6">
                <div className="flex items-center mb-1">
                    <span className="px-2 py-0.5 rounded-[4px] bg-primaryLight text-primary text-[11px] font-semibold font-mono mr-3">GET</span>
                    <h2 className="text-[15px] font-semibold font-mono text-textPrimary">/v1/payments/distribution</h2>
                    <InfoTooltip text="Shows the proportion of total revenue coming from each payment method. Helps understand customer payment preferences." />
                </div>
                <p className="text-[13px] text-textSecondary font-sans">Revenue breakdown by payment method</p>
            </div>
            <div className="flex-1 relative min-h-[250px]">
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
};

export default PaymentDistributionChart;
