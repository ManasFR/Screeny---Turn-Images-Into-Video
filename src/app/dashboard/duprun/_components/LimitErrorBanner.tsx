'use client';

import { AlertTriangle } from 'lucide-react';
import { PlanLimits } from '@/types/duprun';

interface LimitErrorBannerProps {
  planLimits: PlanLimits | null;
}

const LimitErrorBanner = ({ planLimits }: LimitErrorBannerProps) => {
  return (
    <div className="mb-6 bg-red-900/30 border border-red-500 rounded-2xl p-4 flex items-center gap-3">
      <AlertTriangle className="w-6 h-6 text-red-400" />
      <div>
        <p className="font-semibold text-red-400">Export Limit Reached</p>
        <p className="text-sm text-gray-300">
          {planLimits?.videosLimit === 0
            ? 'Please purchase a plan to export videos.'
            : `You've reached your monthly limit of ${planLimits?.videosLimit} videos. Upgrade your plan or wait for next month.`}
        </p>
      </div>
    </div>
  );
};

export default LimitErrorBanner;
