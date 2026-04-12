import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faLock,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { getUnitsByGradeProgress } from "@/api";

type UnitProgressItem = {
  unitId: number;
  unitTitle: string;
  unitNumber: number;
  progressPercent: number;
};

type PositionedUnit = UnitProgressItem & {
  cx: number;
  cy: number;
};

const NODE_WIDTH = 220;
const NODE_RADIUS = 58;
const BASE_Y = 100;
const Y_PATTERN = [-34, 52, -18, 64, -10, 42, -26];
const MIN_STEP_X = 230;
const MAX_STEP_X = 300;
const SIDE_PADDING = 20;
const MIN_MAP_WIDTH = 720;

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getUnitStyle(unit: UnitProgressItem, index: number) {
  const progress = clampProgress(unit.progressPercent);
  const isLocked = index > 0 && progress === 0;
  const isCurrent = !isLocked && progress === 0;
  const isCompleted = progress >= 100;

  if (isLocked) {
    return {
      outerRing: "from-gray-300 to-gray-400",
      outerBorder: "border-gray-200",
      middleBg: "bg-gray-100",
      innerBg: "bg-gray-200",
      iconColor: "text-gray-400",
      badge: "bg-gray-100 text-gray-500 border-gray-200",
      title: "text-gray-500",
      glow: "",
      connector: "#d1d5db",
      dot: "#e5e7eb",
      icon: faLock,
      statusText: "Locked",
      locked: true,
    };
  }

  if (isCompleted) {
    return {
      outerRing: "from-[#34d399] to-[#16a34a]",
      outerBorder: "border-green-100",
      middleBg: "bg-green-50",
      innerBg: "bg-gradient-to-br from-[#34d399] to-[#16a34a]",
      iconColor: "text-white",
      badge: "bg-green-50 text-[#15803d] border-green-200",
      title: "text-[#1e2e51]",
      glow: "shadow-[0_0_35px_rgba(34,197,94,0.22)]",
      connector: "#22c55e",
      dot: "#22c55e",
      icon: faBookOpen,
      statusText: "Completed",
      locked: false,
    };
  }

  if (isCurrent) {
    return {
      outerRing: "from-[#ffb067] to-[#f97316]",
      outerBorder: "border-orange-100",
      middleBg: "bg-orange-50",
      innerBg: "bg-gradient-to-br from-[#ff9f43] to-[#f97316]",
      iconColor: "text-white",
      badge: "bg-orange-50 text-[#d35400] border-orange-200",
      title: "text-[#1e2e51]",
      glow: "shadow-[0_0_40px_rgba(249,115,22,0.25)]",
      connector: "#fb923c",
      dot: "#fb923c",
      icon: faFire,
      statusText: "Current",
      locked: false,
    };
  }

  return {
    outerRing: "from-[#86efac] to-[#22c55e]",
    outerBorder: "border-emerald-100",
    middleBg: "bg-emerald-50",
    innerBg: "bg-gradient-to-br from-[#6ee7b7] to-[#22c55e]",
    iconColor: "text-white",
    badge: "bg-emerald-50 text-[#059669] border-emerald-200",
    title: "text-[#1e2e51]",
    glow: "shadow-[0_0_28px_rgba(74,222,128,0.18)]",
    connector: "#4ade80",
    dot: "#4ade80",
    icon: faBookOpen,
    statusText: "Unlocked",
    locked: false,
  };
}

function buildUnitPath(
  current: PositionedUnit,
  next: PositionedUnit,
  color: string,
  dot: string,
  index: number,
) {
  const startX = current.cx + NODE_RADIUS;
  const startY = current.cy;
  const endX = next.cx - NODE_RADIUS;
  const endY = next.cy;

  const midX = (startX + endX) / 2;
  const curvature =
    index % 3 === 0 ? -90 : index % 3 === 1 ? 95 : current.cy > next.cy ? -70 : 70;

  const controlY = (startY + endY) / 2 + curvature;

  return (
    <g key={`path-${current.unitId}-${next.unitId}`}>
      <path
        d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="10 10"
        strokeLinecap="round"
        opacity="0.95"
      />
      <circle cx={startX} cy={startY} r="5" fill={dot} />
      <circle cx={endX} cy={endY} r="5" fill={dot} />
    </g>
  );
}

export function GradeUnits() {
  const { gradeId } = useParams();
  const [units, setUnits] = useState<UnitProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gradeIdNumber = useMemo(() => Number(gradeId), [gradeId]);

  useEffect(() => {
    const loadUnits = async () => {
      if (!gradeIdNumber || Number.isNaN(gradeIdNumber)) {
        setError("Grade ID không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getUnitsByGradeProgress(gradeIdNumber);

        if (res.success) {
          const sorted = [...(res.data ?? [])].sort(
            (a, b) => a.unitNumber - b.unitNumber || a.unitId - b.unitId,
          );
          setUnits(sorted);
        } else {
          setError(res.error?.message || "Không tải được danh sách unit");
        }
      } catch (err) {
        console.error("Error loading units:", err);
        setError("Có lỗi xảy ra khi tải danh sách unit");
      } finally {
        setLoading(false);
      }
    };

    loadUnits();
  }, [gradeIdNumber]);

  const layout = useMemo(() => {
    const count = units.length;

    if (count === 0) {
      return {
        positionedUnits: [] as PositionedUnit[],
        mapWidth: MIN_MAP_WIDTH,
        containerHeight: 430,
      };
    }

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1440;

    const usableWidth = Math.max(760, viewportWidth - 160);

    let stepX =
      count > 1
        ? Math.floor((usableWidth - SIDE_PADDING * 2) / (count - 1))
        : 0;

    stepX = Math.max(MIN_STEP_X, Math.min(MAX_STEP_X, stepX));

    const contentWidth =
      count === 1
        ? 2 * SIDE_PADDING + NODE_WIDTH
        : 2 * SIDE_PADDING + (count - 1) * stepX + NODE_WIDTH;

    const mapWidth = Math.max(MIN_MAP_WIDTH, contentWidth);

    const startX =
      count === 1
        ? mapWidth / 2
        : Math.max(SIDE_PADDING, (mapWidth - (count - 1) * stepX) / 2);

    const positionedUnits: PositionedUnit[] = units.map((unit, index) => ({
      ...unit,
      cx: startX + index * stepX,
      cy: BASE_Y + Y_PATTERN[index % Y_PATTERN.length],
    }));

    const minCy = Math.min(...positionedUnits.map((item) => item.cy));
    const maxCy = Math.max(...positionedUnits.map((item) => item.cy));

    const containerHeight = Math.max(430, maxCy - minCy + 260);

    return {
      positionedUnits,
      mapWidth,
      containerHeight,
    };
  }, [units]);

  const { positionedUnits, mapWidth, containerHeight } = layout;

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Đang tải các unit...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại Grade
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 pb-24">
      <section className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#155ca5] font-bold hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại Grade
        </Link>

        <div className="mt-4">
          <span className="inline-block px-3 py-1 rounded-full bg-[#73aaf9]/20 text-[#155ca5] text-xs font-bold uppercase tracking-wider">
            Grade {gradeId}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1e2e51] mt-3">
            Chọn Unit
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Đi theo lộ trình học. Các unit được sắp theo thứ tự và có progress riêng.
          </p>
        </div>
      </section>

      {units.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-lg font-bold text-[#1e2e51]">
            Khối này chưa có unit nào
          </p>
        </div>
      ) : (
        <section className="overflow-x-auto">
          <div className="min-w-max px-4 py-8">
            <div
              className="relative"
              style={{
                width: `${mapWidth}px`,
                height: `${containerHeight}px`,
              }}
            >
              <svg
                className="absolute inset-0 pointer-events-none"
                width={mapWidth}
                height={containerHeight}
                viewBox={`0 0 ${mapWidth} ${containerHeight}`}
              >
                {positionedUnits.slice(0, -1).map((unit, index) => {
                  const next = positionedUnits[index + 1];
                  const nextStyle = getUnitStyle(next, index + 1);

                  return buildUnitPath(
                    unit,
                    next,
                    nextStyle.connector,
                    nextStyle.dot,
                    index,
                  );
                })}
              </svg>

              {positionedUnits.map((unit, index) => {
                const style = getUnitStyle(unit, index);
                const progress = clampProgress(unit.progressPercent);

                return (
                  <div
                    key={unit.unitId}
                    className="absolute"
                    style={{
                      left: `${unit.cx - NODE_WIDTH / 2}px`,
                      top: `${unit.cy - NODE_RADIUS}px`,
                      width: `${NODE_WIDTH}px`,
                    }}
                  >
                    <Link
                      to={style.locked ? "#" : `/units/${unit.unitId}/sections`}
                      onClick={(e) => {
                        if (style.locked) e.preventDefault();
                      }}
                      className={`group block text-center ${style.locked ? "cursor-not-allowed" : ""}`}
                    >
                      <div className="relative mx-auto w-32 h-32">
                        <div
                          className={`absolute inset-0 rounded-full bg-gradient-to-br ${style.outerRing} p-[6px] ${style.glow} transition-all duration-300 group-hover:scale-105`}
                        >
                          <div
                            className={`w-full h-full rounded-full border ${style.outerBorder} ${style.middleBg} flex items-center justify-center`}
                          >
                            <div
                              className={`w-[84px] h-[84px] rounded-full ${style.innerBg} flex items-center justify-center shadow-inner`}
                            >
                              <FontAwesomeIcon
                                icon={style.icon}
                                className={`text-[28px] ${style.iconColor}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white border border-[#dbe7f7] shadow-sm text-xs font-black text-[#1e2e51]">
                          {progress}%
                        </div>
                      </div>

                      <div className="mt-5">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style.badge}`}
                        >
                          Unit {unit.unitNumber}
                        </div>

                        <h3 className={`mt-3 text-base font-black leading-tight px-3 ${style.title}`}>
                          {unit.unitTitle}
                        </h3>

                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          {style.statusText}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}