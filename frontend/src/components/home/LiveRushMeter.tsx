import React from 'react';
import { Activity, Clock, Users, Flame } from 'lucide-react';

export const LiveRushMeter: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-navy/10 to-emerald-500/10 border border-slate/30 rounded-2xl p-4 sm:p-6 mb-12 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy/20 text-navy flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base text-ink">
                Live Campus Kitchen Traffic
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 border border-amber-500/30">
                MODERATE RUSH
              </span>
            </div>
            <p className="text-xs text-slate mt-0.5">
              5 active orders being prepared • Current avg turnaround: 8-10 minutes
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="w-full md:w-72 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate">Kitchen Load</span>
            <span className="text-navy font-mono">42% (Optimal)</span>
          </div>
          <div className="w-full h-2.5 bg-slate/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-navy to-amber-500 rounded-full transition-all duration-500"
              style={{ width: '42%' }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};