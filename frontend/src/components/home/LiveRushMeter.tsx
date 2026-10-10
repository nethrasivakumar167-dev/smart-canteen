import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  fetchKitchenStatus,
  getKitchenActivity,
  KitchenStatus,
} from '../../api/publicApi';

export const LiveRushMeter: React.FC = () => {
  const [kitchenStatus, setKitchenStatus] = useState<KitchenStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchKitchenStatus()
      .then((status) => {
        if (isMounted) setKitchenStatus(status);
      })
      .catch((error) => console.error('Failed to load live kitchen status:', error));

    return () => {
      isMounted = false;
    };
  }, []);

  if (!kitchenStatus) return null;

  const activity = getKitchenActivity(kitchenStatus.activeOrdersCount);
  const statusClasses = activity.label === 'Rush'
    ? 'bg-red-500/20 text-red-700 border-red-500/30'
    : activity.label === 'Busy'
      ? 'bg-amber-500/20 text-amber-700 border-amber-500/30'
      : 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';

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
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusClasses}`}>
                {activity.label}
              </span>
            </div>
            <p className="text-xs text-slate mt-0.5">
              {kitchenStatus.activeOrdersCount} active {
                kitchenStatus.activeOrdersCount === 1 ? 'order' : 'orders'
              } received or being prepared
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="w-full md:w-72 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate">Kitchen Load</span>
            <span className="text-navy font-mono">{activity.loadPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-navy to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${activity.loadPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};