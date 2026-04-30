import React from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = ({ text }) => {
    return (
        <div className="relative flex items-center group cursor-help ml-2">
            <Info size={16} className="text-textSecondary hover:text-primary transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface text-textPrimary text-[12px] font-sans rounded-lg shadow-medium border border-borderDefault opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-center">
                {text}
                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-borderDefault"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[3px] border-transparent border-t-surface -mt-[2px]"></div>
            </div>
        </div>
    );
};

export default InfoTooltip;
