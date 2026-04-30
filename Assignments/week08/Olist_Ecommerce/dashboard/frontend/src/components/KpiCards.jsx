import React from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Package, Truck, Star } from 'lucide-react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
};

const KpiCards = ({ kpis, theme }) => {
    if (!kpis) return null;

    const isDark = theme === 'dark';

    const cards = [
        { 
            title: 'Total Revenue', 
            value: formatCurrency(kpis.total_revenue), 
            icon: DollarSign, 
            isPrimary: true 
        },
        { 
            title: 'Total Orders', 
            value: formatNumber(kpis.total_orders), 
            icon: ShoppingCart, 
            color: 'text-success', 
            bg: isDark ? 'bg-success/10' : 'bg-[#ECFDF5]' 
        },
        { 
            title: 'Avg Order Value', 
            value: formatCurrency(kpis.aov), 
            icon: TrendingUp, 
            color: 'text-warning', 
            bg: isDark ? 'bg-warning/10' : 'bg-[#FFF7ED]' 
        },
        { 
            title: 'Total Items Sold', 
            value: formatNumber(kpis.total_items), 
            icon: Package, 
            color: 'text-primary', 
            bg: isDark ? 'bg-primary/10' : 'bg-[#EEF2FF]' 
        },
        { 
            title: 'Total Freight', 
            value: formatCurrency(kpis.total_freight), 
            icon: Truck, 
            color: 'text-error', 
            bg: isDark ? 'bg-error/10' : 'bg-[#FEF2F2]' 
        },
        { 
            title: 'Avg Review Score', 
            value: kpis.avg_review_score.toFixed(1) + ' / 5.0', 
            icon: Star, 
            color: 'text-secondary', 
            bg: isDark ? 'bg-secondary/10' : 'bg-primaryLight' 
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {cards.map((card, index) => (
                <div 
                    key={index} 
                    className={`rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 flex flex-col justify-between h-36 border ${
                        card.isPrimary 
                        ? 'bg-primary border-primary text-white shadow-primary/20' 
                        : 'bg-surface border-borderDefault text-textPrimary'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold font-sans tracking-wide ${card.isPrimary ? 'text-white/80' : 'text-textSecondary'}`}>
                            {card.title}
                        </h3>
                        <div className={`p-2 rounded-xl ${card.isPrimary ? 'bg-white/20 text-white' : `${card.bg} ${card.color}`}`}>
                            <card.icon size={20} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <p className={`text-3xl font-bold font-sans tracking-tight ${card.isPrimary ? 'text-white' : 'text-textPrimary'}`}>
                            {card.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KpiCards;
