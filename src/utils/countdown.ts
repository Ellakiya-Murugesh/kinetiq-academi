export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  targetDate: Date;
}

/**
 * Calculates the next November 1 date.
 * If current date is past Nov 1 in the current year, targets Nov 1 of the following year.
 */
export function getNextBatchDate(): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  let target = new Date(currentYear, 10, 1, 0, 0, 0); // Month is 0-indexed: 10 = November

  if (now.getTime() >= target.getTime()) {
    target = new Date(currentYear + 1, 10, 1, 0, 0, 0);
  }

  return target;
}

export function calculateTimeLeft(targetDate?: Date): TimeLeft {
  const target = targetDate || getNextBatchDate();
  const now = new Date();
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      targetDate: target,
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    targetDate: target,
  };
}
