import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, Loader2, Play, Star } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faLock,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { getLessonsBySectionProgress, getSectionsByUnitProgress, getUnit, getUnitReviews } from "@/api";
import type { SectionLessonProgressItem } from "@/api/lessons";
import type { UnitReviewResponse } from "@/api/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

type SectionProgressItem = {
  sectionId: number;
  sectionTitle: string;
  sectionNumber: number;
  progressPercent: number;
};

type PositionedSection = SectionProgressItem & {
  pathKey: string;
  cx: number;
  cy: number;
  row: number;
  col: number;
};

type PositionedPathNode = {
  pathKey: string;
  cx: number;
  cy: number;
  row: number;
  col: number;
};

type PositionedUnitReview = PositionedPathNode & {
  review: UnitReviewResponse;
};

const NODE_WIDTH = 220;
const NODE_RADIUS = 58;
const BASE_Y = 96;
const COLUMN_Y_PATTERN = [0, 42, 0];
const MIN_STEP_X = 220;
const MAX_STEP_X = 520;
const SIDE_PADDING = 72;
const MIN_MAP_WIDTH = 720;
const MAX_COLUMNS = 3;
const ROW_STEP_Y = 360;
const LESSON_RING_SIZE = 166;
const LESSON_RING_RADIUS = 72;
const LESSON_RING_CIRCUMFERENCE = 2 * Math.PI * LESSON_RING_RADIUS;

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isSectionUnlocked(sections: SectionProgressItem[], index: number) {
  if (index <= 0) {
    return true;
  }

  return clampProgress(sections[index - 1]?.progressPercent ?? 0) >= 100;
}

function getSectionStyle(
  section: SectionProgressItem,
  index: number,
  sections: SectionProgressItem[],
) {
  const progress = clampProgress(section.progressPercent);
  const isLocked = !isSectionUnlocked(sections, index);
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

function getLessonSegmentColor(lesson: SectionLessonProgressItem) {
  if (!lesson.unlocked) return "#cbd5e1";
  if (lesson.current) return "#f97316";
  if (lesson.completed) return "#22c55e";
  if (lesson.reviewLesson) return "#38bdf8";
  return "#86efac";
}

function getLessonStatusText(lesson: SectionLessonProgressItem) {
  if (!lesson.unlocked) return "Locked";
  if (lesson.current) return "Current";
  if (lesson.completed) return "Completed";
  if (lesson.reviewLesson) return "Review";
  return "Unlocked";
}

function LessonSegmentRing({ lessons }: { lessons: SectionLessonProgressItem[] }) {
  const count = Math.max(lessons.length, 1);
  const gap = count > 1 ? 9 : 0;
  const segmentLength = Math.max(0, LESSON_RING_CIRCUMFERENCE / count - gap);

  return (
    <svg
      className="absolute left-1/2 top-1/2 h-[166px] w-[166px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
      viewBox={`0 0 ${LESSON_RING_SIZE} ${LESSON_RING_SIZE}`}
      aria-hidden="true"
    >
      <circle
        cx={LESSON_RING_SIZE / 2}
        cy={LESSON_RING_SIZE / 2}
        r={LESSON_RING_RADIUS}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
      />
      {lessons.length > 0 &&
        lessons.map((lesson, index) => (
          <circle
            key={lesson.lessonId}
            cx={LESSON_RING_SIZE / 2}
            cy={LESSON_RING_SIZE / 2}
            r={LESSON_RING_RADIUS}
            fill="none"
            stroke={getLessonSegmentColor(lesson)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${segmentLength} ${LESSON_RING_CIRCUMFERENCE - segmentLength}`}
            strokeDashoffset={-(LESSON_RING_CIRCUMFERENCE / count) * index}
            transform={`rotate(-90 ${LESSON_RING_SIZE / 2} ${LESSON_RING_SIZE / 2})`}
            className="drop-shadow-sm"
          />
        ))}
    </svg>
  );
}

function buildSectionPath(
  current: PositionedPathNode,
  next: PositionedPathNode,
  color: string,
  dot: string,
) {
  const sameRow = current.row === next.row;
  const movingRight = next.cx >= current.cx;

  const startX = sameRow
    ? current.cx + (movingRight ? NODE_RADIUS : -NODE_RADIUS)
    : current.cx;
  const startY = sameRow ? current.cy : current.cy + NODE_RADIUS;
  const endX = sameRow
    ? next.cx + (movingRight ? -NODE_RADIUS : NODE_RADIUS)
    : next.cx;
  const endY = sameRow ? next.cy : next.cy - NODE_RADIUS;

  const path = sameRow
    ? `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`
    : `M ${startX} ${startY} C ${startX} ${startY + 90}, ${endX} ${endY - 90}, ${endX} ${endY}`;

  return (
    <g key={`path-${current.pathKey}-${next.pathKey}`}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="11 11"
        strokeLinecap="round"
        opacity="0.95"
      />
      <circle cx={startX} cy={startY} r="5" fill={dot} />
      <circle cx={endX} cy={endY} r="5" fill={dot} />
    </g>
  );
}

export function SectionSelection() {
  const { copy } = useLanguage();
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionProgressItem[]>([]);
  const [sectionLessons, setSectionLessons] = useState<Record<number, SectionLessonProgressItem[]>>({});
  const [unitReviews, setUnitReviews] = useState<UnitReviewResponse[]>([]);
  const [unitDisplayNumber, setUnitDisplayNumber] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unitIdNumber = useMemo(() => Number(unitId), [unitId]);

  useEffect(() => {
    const loadUnitMeta = async () => {
      if (!unitIdNumber || Number.isNaN(unitIdNumber)) {
        setUnitDisplayNumber(null);
        return;
      }

      const response = await getUnit(unitIdNumber);
      setUnitDisplayNumber(response.success && response.data ? response.data.unitNumber : null);
    };

    void loadUnitMeta();
  }, [unitIdNumber]);

  useEffect(() => {
    const loadSections = async () => {
      if (!unitIdNumber || Number.isNaN(unitIdNumber)) {
        setError(copy("Invalid unit ID", "Unit ID không hợp lệ"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getSectionsByUnitProgress(unitIdNumber);

        if (res.success) {
          const sorted = [...(res.data ?? [])].sort(
            (a, b) =>
              a.sectionNumber - b.sectionNumber || a.sectionId - b.sectionId,
          );
          setSections(sorted);

          const lessonEntries = await Promise.all(
            sorted.map(async (section) => {
              const lessonsResponse = await getLessonsBySectionProgress(section.sectionId);
              const lessons = lessonsResponse.success
                ? [...(lessonsResponse.data ?? [])].sort(
                    (a, b) =>
                      (a.orderIndex ?? a.lessonNumber) - (b.orderIndex ?? b.lessonNumber) ||
                      a.lessonNumber - b.lessonNumber ||
                      a.lessonId - b.lessonId,
                  )
                : [];

              return [section.sectionId, lessons] as const;
            }),
          );

          setSectionLessons(Object.fromEntries(lessonEntries));
        } else {
          setError(res.error?.message || copy("Could not load sections", "Không tải được danh sách section"));
        }
      } catch (err) {
        console.error("Error loading sections:", err);
        setError(copy("An error occurred while loading sections", "Có lỗi xảy ra khi tải danh sách section"));
      } finally {
        setLoading(false);
      }
    };

    void loadSections();
  }, [copy, unitIdNumber]);

  useEffect(() => {
    const loadUnitReviews = async () => {
      if (!unitIdNumber || Number.isNaN(unitIdNumber)) {
        setUnitReviews([]);
        return;
      }

      const response = await getUnitReviews();
      if (!response.success || !response.data) {
        setUnitReviews([]);
        return;
      }

      setUnitReviews(response.data.filter((review) => review.unitId === unitIdNumber));
    };

    void loadUnitReviews();
  }, [unitIdNumber]);

  const layout = useMemo(() => {
    const hasUnitReview = unitReviews.length > 0;
    const count = sections.length + (hasUnitReview ? 1 : 0);

    if (sections.length === 0) {
      return {
        positionedSections: [] as PositionedSection[],
        reviewPosition: null as PositionedUnitReview | null,
        mapWidth: MIN_MAP_WIDTH,
        containerHeight: 430,
      };
    }

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1440;

    const usableWidth = Math.max(720, viewportWidth - 120);

    const columns = Math.min(
      count,
      viewportWidth >= 1280 ? MAX_COLUMNS : viewportWidth >= 768 ? 2 : 1,
    );
    const rows = Math.ceil(count / columns);
    const stepX =
      columns <= 1
        ? 0
        : Math.max(
          MIN_STEP_X,
          Math.min(
            MAX_STEP_X,
            Math.floor((usableWidth - SIDE_PADDING * 2 - NODE_WIDTH) / (columns - 1)),
          ),
        );

    const contentWidth =
      columns === 1
        ? 2 * SIDE_PADDING + NODE_WIDTH
        : 2 * SIDE_PADDING + (columns - 1) * stepX + NODE_WIDTH;

    const mapWidth = Math.max(
      Math.min(usableWidth + SIDE_PADDING * 2, Math.max(contentWidth, MIN_MAP_WIDTH)),
      contentWidth,
    );

    const getPosition = (index: number) => {
      const row = Math.floor(index / columns);
      const columnInRow = index % columns;
      const isReverseRow = row % 2 === 1;
      const itemsInRow =
        row === rows - 1 && count % columns !== 0 ? count % columns : columns;
      const visualColumn = isReverseRow ? itemsInRow - 1 - columnInRow : columnInRow;
      const rowWidth = NODE_WIDTH + Math.max(itemsInRow - 1, 0) * stepX;
      const rowStartX =
        itemsInRow === 1
          ? mapWidth / 2
          : (mapWidth - rowWidth) / 2 + NODE_WIDTH / 2;

      return {
        cx: rowStartX + visualColumn * stepX,
        cy: BASE_Y + row * ROW_STEP_Y + COLUMN_Y_PATTERN[visualColumn % COLUMN_Y_PATTERN.length],
        row,
        col: visualColumn,
      };
    };

    const positionedSections: PositionedSection[] = sections.map((section, index) => {
      return {
        ...section,
        pathKey: `section-${section.sectionId}`,
        ...getPosition(index),
      };
    });

    const reviewPosition: PositionedUnitReview | null = hasUnitReview
      ? {
          pathKey: `unit-review-${unitReviews[0].id}`,
          review: unitReviews[0],
          ...getPosition(sections.length),
        }
      : null;

    const allPositions = reviewPosition
      ? [...positionedSections, reviewPosition]
      : positionedSections;
    const minCy = Math.min(...allPositions.map((item) => item.cy));
    const maxCy = Math.max(...allPositions.map((item) => item.cy));

    const containerHeight = Math.max(430, maxCy - minCy + 300);

    return {
      positionedSections,
      reviewPosition,
      mapWidth,
      containerHeight,
    };
  }, [sections, unitReviews]);

  const { positionedSections, reviewPosition, mapWidth, containerHeight } = layout;
  const isUnitCompleted =
    sections.length > 0 && sections.every((section) => clampProgress(section.progressPercent) >= 100);
  const selectedSection =
    selectedSectionId == null
      ? null
      : sections.find((section) => section.sectionId === selectedSectionId) ?? null;
  const selectedLessons = selectedSectionId == null ? [] : sectionLessons[selectedSectionId] ?? [];
  const pathNodes = reviewPosition ? [...positionedSections, reviewPosition] : positionedSections;
  const unitReviewLocked = !isUnitCompleted;

  if (loading) {
    return (
      <main className="w-full px-4 py-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">{copy("Loading sections...", "Đang tải các section...")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full px-4 py-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50"
          >
            <ChevronLeft className="w-4 h-4" />
            {copy("Back", "Quay lại")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-4 pb-12">
      <section className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[#155ca5] font-bold hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          {copy("Back", "Quay lại")}
        </button>

        <div className="mt-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#73aaf9]/20 text-[#155ca5] text-xs font-bold uppercase tracking-wider">
            Unit {unitDisplayNumber ?? unitId}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1e2e51] mt-3">
            {copy("Choose a Section", "Chọn Section")}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {copy("Choose a section to continue into lessons.", "Chọn 1 section để tiếp tục qua lesson.")}
          </p>
        </div>
      </section>

      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-lg font-bold text-[#1e2e51]">
            {copy("This unit does not have any sections yet.", "Unit này chưa có section nào")}
          </p>
        </div>
      ) : (
        <section className="space-y-6">
          <div className="overflow-x-auto">
            <div className="min-w-max pl-0 pr-4 py-4">
              <div
                className="relative mx-auto"
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
                  {pathNodes.slice(0, -1).map((section, index) => {
                    const next = pathNodes[index + 1];
                    const isNextUnitReview = next.pathKey.startsWith("unit-review-");
                    const nextStyle = isNextUnitReview
                      ? {
                          connector: unitReviewLocked ? "#d1d5db" : "#38bdf8",
                          dot: unitReviewLocked ? "#e5e7eb" : "#38bdf8",
                        }
                      : getSectionStyle(next as PositionedSection, index + 1, positionedSections);

                    return buildSectionPath(
                      section,
                      next,
                      nextStyle.connector,
                      nextStyle.dot,
                    );
                  })}
                </svg>

                {positionedSections.map((section, index) => {
                  const style = getSectionStyle(section, index, positionedSections);
                  const progress = clampProgress(section.progressPercent);
                  const lessons = sectionLessons[section.sectionId] ?? [];

                  return (
                    <div
                      key={section.sectionId}
                      className="absolute"
                      style={{
                        left: `${section.cx - NODE_WIDTH / 2}px`,
                        top: `${section.cy - NODE_RADIUS}px`,
                        width: `${NODE_WIDTH}px`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!style.locked) {
                            setSelectedSectionId(section.sectionId);
                          }
                        }}
                        className={`group block w-full text-center ${style.locked ? "cursor-not-allowed" : ""}`}
                      >
                        <div className="relative mx-auto w-32 h-32">
                          <LessonSegmentRing lessons={lessons} />
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

                          {lessons.length > 0 && (
                            <div className="absolute -right-5 top-1/2 -translate-y-1/2 rounded-full border border-[#dbe7f7] bg-white px-2 py-1 text-[11px] font-black text-[#155ca5] shadow-sm">
                              {lessons.length}
                            </div>
                          )}
                        </div>

                        <div className="mt-5">
                          <div
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style.badge}`}
                          >
                            Section {section.sectionNumber}
                          </div>

                          <h3
                            className={`mt-3 text-base font-black leading-tight px-3 ${style.title}`}
                          >
                            {section.sectionTitle}
                          </h3>

                          <p className="mt-2 text-xs font-semibold text-gray-500">
                            {copy(style.statusText, style.statusText === "Locked"
                              ? "Bị khóa"
                              : style.statusText === "Completed"
                                ? "Hoàn thành"
                                : style.statusText === "Current"
                                  ? "Hiện tại"
                                  : "Đã mở")}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}

                {reviewPosition && (
                  <div
                    className="absolute"
                    style={{
                      left: `${reviewPosition.cx - NODE_WIDTH / 2}px`,
                      top: `${reviewPosition.cy - NODE_RADIUS}px`,
                      width: `${NODE_WIDTH}px`,
                    }}
                  >
                    {unitReviewLocked ? (
                      <div className="group block w-full cursor-not-allowed text-center">
                        <div className="relative mx-auto h-32 w-32">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 p-[6px] transition-all duration-300">
                            <div className="flex h-full w-full items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                              <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gray-200 shadow-inner">
                                <FontAwesomeIcon icon={faLock} className="text-[28px] text-gray-400" />
                              </div>
                            </div>
                          </div>

                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[#dbe7f7] bg-white px-3 py-1 text-xs font-black text-[#1e2e51] shadow-sm">
                            {copy("Review", "Ôn tập")}
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="inline-block rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                            {copy("Unit Review", "Ôn tập Unit")}
                          </div>
                          <h3 className="mt-3 px-3 text-base font-black leading-tight text-gray-500">
                            {reviewPosition.review.title}
                          </h3>
                          <p className="mt-2 text-xs font-semibold text-gray-500">
                            {copy("Locked", "Bị khóa")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={`/reviews/unit?reviewId=${reviewPosition.review.id}`}
                        className="group block w-full text-center"
                      >
                        <div className="relative mx-auto h-32 w-32">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7dd3fc] to-[#0284c7] p-[6px] shadow-[0_0_35px_rgba(14,165,233,0.24)] transition-all duration-300 group-hover:scale-105">
                            <div className="flex h-full w-full items-center justify-center rounded-full border border-sky-100 bg-sky-50">
                              <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-inner">
                                <Star className="h-8 w-8 fill-white text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-[#dbe7f7] bg-white px-3 py-1 text-xs font-black text-[#1e2e51] shadow-sm">
                            {copy("Review", "Ôn tập")}
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0369a1]">
                            {copy("Unit Review", "Ôn tập Unit")}
                          </div>
                          <h3 className="mt-3 px-3 text-base font-black leading-tight text-[#1e2e51]">
                            {reviewPosition.review.title}
                          </h3>
                          <p className="mt-2 text-xs font-semibold text-gray-500">
                            {copy("Unlocked", "Đã mở")}
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {false && isUnitCompleted && unitReviews.length > 0 && (
            <div className="rounded-3xl border border-[#dbeafe] bg-[#f8fbff] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#155ca5]">
                    {copy("Unit Review", "Ôn tập Unit")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#1e2e51]">
                    {copy(
                      "This unit is done. You can jump straight into the review.",
                      "Unit này đã xong, vào review tiếp luôn được.",
                    )}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    {copy(
                      "The unit review is attached directly to the learning flow so you can move from studying into review without going back to the dashboard.",
                      "Review của unit được gắn thẳng vào hành trình học để mình chuyển từ học sang ôn ngay, không phải quay ra dashboard tìm nữa.",
                    )}
                  </p>
                </div>
                <Link
                  to={`/reviews/unit?reviewId=${unitReviews[0].id}`}
                  className="inline-flex items-center rounded-full bg-[#155ca5] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f4c88]"
                >
                  {copy("Open Unit Review", "Mở Unit Review")}
                </Link>
              </div>

              {unitReviews.length > 1 && (
                <p className="mt-4 text-sm text-slate-500">
                  {copy(
                    `There are ${unitReviews.length} review packs for this unit. The button above opens the first one, and you can switch packs inside the review screen.`,
                    `Có ${unitReviews.length} gói review cho unit này. Nút trên sẽ mở gói đầu tiên, còn trong màn hình review mình vẫn đổi gói được.`,
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <Dialog
        open={selectedSectionId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedSectionId(null);
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl border-[#dbeafe] bg-white p-0 shadow-2xl">
          <div className="rounded-t-3xl bg-[#58cc02] px-6 py-5 text-white shadow-[inset_0_-5px_0_rgba(0,0,0,0.12)]">
            <DialogHeader>
              <DialogDescription className="text-xs font-black uppercase tracking-[0.22em] text-white/80">
                Section {selectedSection?.sectionNumber}
              </DialogDescription>
              <DialogTitle className="pr-8 text-2xl font-black leading-tight text-white">
                {selectedSection?.sectionTitle ?? copy("Lessons", "Lesson")}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-4 mb-4 inline-flex items-center gap-2 rounded-full border border-[#dbe7f7] bg-white px-4 py-2 text-sm font-black text-[#155ca5] shadow-sm">
              <Star className="h-4 w-4 fill-[#58cc02] text-[#58cc02]" />
              {copy(
                `${selectedLessons.length} lessons in this section`,
                `${selectedLessons.length} lesson trong section nay`,
              )}
            </div>

            {selectedLessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                {copy("This section does not have lessons yet.", "Section nay chua co lesson nao.")}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedLessons.map((lesson) => {
                  const statusText = getLessonStatusText(lesson);
                  const isLocked = !lesson.unlocked;

                  return isLocked ? (
                    <div
                      key={lesson.lessonId}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 opacity-75"
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-inner"
                        style={{ backgroundColor: getLessonSegmentColor(lesson) }}
                      >
                        <FontAwesomeIcon icon={faLock} className="text-lg" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Lesson {lesson.lessonNumber}
                        </p>
                        <p className="truncate text-base font-black text-slate-500">
                          {lesson.lessonTitle}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-500">
                        {copy(statusText, "Bi khoa")}
                      </span>
                    </div>
                  ) : (
                    <Link
                      key={lesson.lessonId}
                      to={`/lessons/${lesson.lessonId}`}
                      className="group flex items-center gap-4 rounded-2xl border border-[#dbe7f7] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-md"
                    >
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-inner"
                        style={{ backgroundColor: getLessonSegmentColor(lesson) }}
                      >
                        {lesson.reviewLesson ? (
                          <Star className="h-5 w-5 fill-white" />
                        ) : (
                          <Play className="h-5 w-5 fill-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-black uppercase tracking-wider text-[#155ca5]">
                          {lesson.reviewLesson ? copy("Review", "Review") : `Lesson ${lesson.lessonNumber}`}
                        </p>
                        <p className="truncate text-base font-black text-[#1e2e51]">
                          {lesson.lessonTitle}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#f1f8ff] px-3 py-1 text-xs font-black text-[#155ca5]">
                        {copy(
                          statusText,
                          statusText === "Completed"
                            ? "Hoan thanh"
                            : statusText === "Current"
                              ? "Hien tai"
                              : statusText === "Review"
                                ? "Review"
                                : "Da mo",
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {selectedSection && (
              <Link
                to={`/sections/${selectedSection.sectionId}/lessons`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#dbe7f7] bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#155ca5] transition hover:bg-[#eef6ff]"
              >
                {copy("Open full lesson path", "Mo lo trinh lesson day du")}
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
