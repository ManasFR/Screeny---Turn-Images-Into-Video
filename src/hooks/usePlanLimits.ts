'use client';

import { useState, useCallback } from 'react';
import { PlanLimits } from '@/types/duprun';

export const usePlanLimits = () => {
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [showLimitError, setShowLimitError] = useState(false);

  const fetchPlanLimits = useCallback(async () => {
    try {
      const res = await fetch('/api/user/check-export-limit');
      const data = await res.json();
      if (data.success) {
        setPlanLimits(data);
      } else {
        setPlanLimits({
          hasAccess: false,
          videosUsed: 0,
          videosLimit: 0,
          videosRemaining: 0,
          watermark: true,
          noWatermark: false,
        });
      }
    } catch (err) {
      console.error('Failed to fetch plan limits:', err);
    }
  }, []);

  const triggerLimitError = useCallback(() => {
    setShowLimitError(true);
    setTimeout(() => setShowLimitError(false), 5000);
  }, []);

  return {
    planLimits,
    showLimitError,
    setShowLimitError,
    fetchPlanLimits,
    triggerLimitError,
  };
};
