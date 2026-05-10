import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { getMyActivityCalendar } from "@/api";

type ActivityCalendarDay = {
  date: string;
  studied: boolean;
  skipUsed: boolean;
  studyCount: number;
  skipCount: number;
};

type ActivityCalendarResponse = {
  year: number;
  month: number;
  monthLabel: string;
  totalStudyDays: number;
  totalSkipDays: number;
  days: ActivityCalendarDay[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;

const formatMonthLabel = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

const toKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function ActivityCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [calendar, setCalendar] = useState<ActivityCalendarResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadCalendar = async () => {
      setLoading(true);
      setError(null);

      const response = await getMyActivityCalendar(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
      );

      if (!active) {
        return;
      }

      if (!response.success || !response.data) {
        setError(response.error?.message || "Failed to load activity calendar");
        setCalendar(null);
      } else {
        setCalendar(response.data);
      }

      if (active) {
        setLoading(false);
      }
    };

    void loadCalendar();

    return () => {
      active = false;
    };
  }, [selectedMonth]);

  const dayMap = useMemo(() => {
    return new Map((calendar?.days ?? []).map((day) => [day.date, day]));
  }, [calendar]);

  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1,
    );
    const startOffset = firstOfMonth.getDay();
    const firstCellDate = new Date(
      firstOfMonth.getFullYear(),
      firstOfMonth.getMonth(),
      1 - startOffset,
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCellDate.getTime() + index * DAY_MS);
      return {
        date,
        currentMonth: date.getMonth() === selectedMonth.getMonth(),
        today: toKey(date) === toKey(new Date()),
      };
    });
  }, [selectedMonth]);

  const shiftMonth = (delta: number) => {
    setSelectedMonth((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
    });
  };

  const monthTitle = calendar?.monthLabel ?? formatMonthLabel(selectedMonth);

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-100">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Calendar className="w-7 h-7 text-[#155ca5]" />
              Activity Calendar
            </h2>
            <p className="text-sm text-slate-500">
              See the days you studied and the days you used SKIP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors grid place-items-center"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="h-10 w-10 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors grid place-items-center"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Studied
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Used SKIP
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 font-semibold text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            {monthTitle}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Study days
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-700">
              {calendar?.totalStudyDays ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              SKIP days
            </p>
            <p className="mt-1 text-2xl font-black text-amber-700">
              {calendar?.totalSkipDays ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Calendar month
            </p>
            <p className="mt-1 text-2xl font-black text-slate-800">
              {selectedMonth.getMonth() + 1}/{selectedMonth.getFullYear()}
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
              State
            </p>
            <p className="mt-1 text-2xl font-black text-blue-700">
              {loading ? "Loading" : "Ready"}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Failed to load calendar</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="px-2 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-white">
            {gridDays.map(({ date, currentMonth, today }) => {
              const key = toKey(date);
              const dayData = dayMap.get(key);
              const studied = Boolean(dayData?.studied);
              const skipUsed = Boolean(dayData?.skipUsed);
              const isEmpty = !currentMonth;

              return (
                <div
                  key={key}
                  className={`min-h-[92px] border-r border-b border-slate-100 p-2 transition-colors ${
                    isEmpty ? "bg-slate-50/70 text-slate-400" : "bg-white"
                  } ${today ? "ring-2 ring-inset ring-[#155ca5]/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm font-bold ${
                        currentMonth ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {today && (
                      <span className="rounded-full bg-[#155ca5]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#155ca5]">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {studied && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                        title={`Studied ${dayData?.studyCount ?? 0} time(s)`}
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Study
                      </span>
                    )}
                    {skipUsed && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700"
                        title={`Used SKIP ${dayData?.skipCount ?? 0} time(s)`}
                      >
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Skip
                      </span>
                    )}
                    {!studied && !skipUsed && currentMonth && (
                      <span className="text-[11px] text-slate-400">
                        No activity
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading calendar data...
          </div>
        )}
      </div>
    </div>
  );
}
