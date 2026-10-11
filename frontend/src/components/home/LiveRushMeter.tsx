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
    ? 'theme-danger-soft theme-danger-border theme-danger-text'
    : activity.label === 'Busy'
      ? 'theme-gold-surface theme-primary-text theme-warning-text'
      : 'theme-sky-surface theme-primary-text theme-accent-border';

  return (
    <div className="w-full theme-rush-surface border theme-border rounded-2xl p-4 sm:p-6 mb-12 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl theme-secondary-surface theme-primary-text flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base theme-primary-text">
                Live Campus Kitchen Traffic
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${statusClasses}`}>
                {activity.label}
              </span>
            </div>
            <p className="text-xs theme-secondary-text mt-0.5">
              {kitchenStatus.activeOrdersCount} active {
                kitchenStatus.activeOrdersCount === 1 ? 'order' : 'orders'
              } received or being prepared
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="w-full md:w-72 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="theme-secondary-text">Kitchen Load</span>
            <span className="theme-primary-text font-mono">{activity.loadPercent}%</span>
          </div>
          <div className="w-full h-2.5 theme-secondary-surface rounded-full overflow-hidden">
            <div
              className="h-full theme-rush-bar rounded-full transition-all duration-500"
              style={{ width: `${activity.loadPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};