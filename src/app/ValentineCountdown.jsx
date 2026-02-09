import { useEffect, useMemo, useState } from "react";


function getNextFeb14() {
  const now = new Date();
  const year = now.getFullYear();
  const feb14ThisYear = new Date(year, 1, 14, 0, 0, 0); // month is 0-based (1 = Feb)

  // if we've passed Feb 14 already, target next year
  return now > feb14ThisYear ? new Date(year + 1, 1, 14, 0, 0, 0) : feb14ThisYear;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function ValentineCountdown() {
  const target = useMemo(() => getNextFeb14(), []);

  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target));

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(calcTimeLeft(target));
    }, 1000);

    return () => clearInterval(t);
  }, [target]);

  return (
    <div>
      <div className="w-full max-w-md text-center">
        <div className="flex items-end justify-center gap-3">
          <CountBox value={pad2(timeLeft.days)} label="DAYS" />
          <CountBox value={pad2(timeLeft.hours)} label="HOURS" />
          <CountBox value={pad2(timeLeft.minutes)} label="MINUTES" />
          <CountBox value={pad2(timeLeft.seconds)} label="SECONDS" />
        </div>
      </div>
    </div>
  );
}

function CountBox({ value, label }) {
  return (
    <div className="">
      <div className="rounded-2xl bg-red-200/95 border border-red-700/40 shadow-md px-3.5 py-2">
        <div className="text-2xl sm:text-4xl font-bold tracking-wide text-red-500">
          {value}
        </div>
      </div>
      <div className="mt-2 text-[10px] text-gray-800 font-extrabold">
        {label}
      </div>
    </div>
  );
}

function calcTimeLeft(target) {
  const now = new Date();
  let diff = Math.max(0, target.getTime() - now.getTime()); // ms

  const totalSeconds = Math.floor(diff / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}
