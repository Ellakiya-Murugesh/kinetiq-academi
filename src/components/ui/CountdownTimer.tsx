import React, { useState, useEffect } from 'react';
import { calculateTimeLeft, TimeLeft, getNextBatchDate } from '../../utils/countdown';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  className?: string;
  variant?: 'light' | 'dark' | 'card';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  className = '',
  variant = 'light',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const nextBatchStr = getNextBatchDate().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  const getContainerStyle = () => {
    switch (variant) {
      case 'dark':
        return 'bg-navy-800/80 border-navy-700 text-white';
      case 'card':
        return 'bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 text-navy-500 shadow-sm';
      default:
        return 'bg-white border border-gray-100 text-navy-500 shadow-md';
    }
  };

  const getUnitBoxStyle = () => {
    switch (variant) {
      case 'dark':
        return 'bg-navy-900 border border-navy-700 text-primary-400';
      case 'card':
        return 'bg-white border border-primary-100 text-primary-600 shadow-sm';
      default:
        return 'bg-gray-50 border border-gray-200 text-primary-500 shadow-sm';
    }
  };

  return (
    <div className={`rounded-2xl p-5 md:p-6 transition-all ${getContainerStyle()} ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-500 animate-spin-slow" />
          <span className="font-bold text-sm tracking-wide uppercase">
            Next Batch Starts: <span className="text-primary-500">{nextBatchStr}</span>
          </span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20 w-fit">
          Admissions Open
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
        {timeUnits.map((unit) => (
          <div
            key={unit.label}
            className={`rounded-xl p-2.5 sm:p-4 flex flex-col items-center justify-center transition-all ${getUnitBoxStyle()}`}
          >
            <span className="text-2xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs uppercase font-semibold text-gray-400 tracking-wider mt-1">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
