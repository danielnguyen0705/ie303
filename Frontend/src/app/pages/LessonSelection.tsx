import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, Loader2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSeedling,
  faLock,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { getLessonsBySectionProgress, getSection } from "@/api";
import { useLanguage } from "@/context/LanguageContext";

type LessonProgressItem = {
  lessonId: number;
  lessonTitle: string;
  lessonNumber: number;
  orderIndex?: number | null;
  reviewLesson: boolean;
  completed: boolean;
  unlocked: boolean;
  current: boolean;
};

type PositionedLesson = LessonProgressItem & {
  cx: number;
  cy: number;
  row: number;
  col: number;
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

function getLessonStyle(lesson: LessonProgressItem) {
  const isLocked = !lesson.unlocked;
  const isCurrent = lesson.current;
  const isCompleted = lesson.completed;

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
    };
  }

  if (lesson.reviewLesson) {
    return {
      outerRing: "from-[#7dd3fc] to-[#0284c7]",
      outerBorder: "border-sky-100",
      middleBg: "bg-sky-50",
      innerBg: "bg-gradient-to-br from-[#38bdf8] to-[#0284c7]",
      iconColor: "text-white",
      badge: "bg-sky-50 text-[#0369a1] border-sky-200",
      title: "text-[#1e2e51]",
      glow: "shadow-[0_0_35px_rgba(14,165,233,0.2)]",
      connector: "#38bdf8",
      dot: "#38bdf8",
      icon: faSeedling,
      statusText: isCompleted ? "Review Done" : isCurrent ? "Review Ready" : "Review",
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
      icon: faSeedling,
      statusText: "Completed",
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
    icon: faSeedling,
    statusText: "Unlocked",
  };
}

function buildLessonPath(
  current: PositionedLesson,
  next: PositionedLesson,
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
    <g key={`path-${current.lessonId}-${next.lessonId}`}>
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

function getReviewLessonMeta(lessons: LessonProgressItem[], lessonId: number) {
  let regularLessonsSinceLastReview = 0;
  let reviewIndex = 0;

  for (const lesson of lessons) {
    if (lesson.reviewLesson) {
      reviewIndex += 1;
      if (lesson.lessonId === lessonId) {
        return {
          reviewIndex,
          coveredLessons: regularLessonsSinceLastReview,
        };
      }
      regularLessonsSinceLastReview = 0;
    } else {
      regularLessonsSinceLastReview += 1;
    }
  }

  return null;
}

export function LessonSelection() {
  const { copy } = useLanguage();
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonProgressItem[]>([]);
  const [sectionTitle, setSectionTitle] = useState<string | null>(null);
  const [sectionDisplayNumber, setSectionDisplayNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sectionIdNumber = useMemo(() => Number(sectionId), [sectionId]);

  useEffect(() => {
    const loadSectionMeta = async () => {
      if (!sectionIdNumber || Number.isNaN(sectionIdNumber)) {
        setSectionTitle(null);
        setSectionDisplayNumber(null);
        return;
      }

      const response = await getSection(sectionIdNumber);
      if (response.success && response.data) {
        setSectionTitle(response.data.title);
        setSectionDisplayNumber(response.data.sectionNumber);
      } else {
        setSectionTitle(null);
        setSectionDisplayNumber(null);
      }
    };

    void loadSectionMeta();
  }, [sectionIdNumber]);

  useEffect(() => {
    const loadLessons = async () => {
      if (!sectionIdNumber || Number.isNaN(sectionIdNumber)) {
        setError(copy("Invalid section ID", "Section ID không hợp lệ"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getLessonsBySectionProgress(sectionIdNumber);

        if (res.success) {
          const sorted = [...(res.data ?? [])].sort(
            (a, b) =>
              (a.orderIndex ?? a.lessonNumber) - (b.orderIndex ?? b.lessonNumber) ||
              a.lessonNumber - b.lessonNumber ||
              a.lessonId - b.lessonId,
          );
          setLessons(sorted);
        } else {
          setError(res.error?.message || copy("Could not load lessons", "Không tải được danh sách lesson"));
        }
      } catch (err) {
        console.error("Error loading lessons:", err);
        setError(copy("An error occurred while loading lessons", "Có lỗi xảy ra khi tải danh sách lesson"));
      } finally {
        setLoading(false);
      }
    };

    void loadLessons();
  }, [copy, sectionIdNumber]);

  const layout = useMemo(() => {
    const count = lessons.length;

    if (count === 0) {
      return {
        positionedLessons: [] as PositionedLesson[],
        mapWidth: MIN_MAP_WIDTH,
        containerHeight: 430,
      };
    }

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1440;

    const usableWidth = Math.max(760, viewportWidth - 120);

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

    const positionedLessons: PositionedLesson[] = lessons.map((lesson, index) => {
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
        ...lesson,
        cx: rowStartX + visualColumn * stepX,
        cy: BASE_Y + row * ROW_STEP_Y + COLUMN_Y_PATTERN[visualColumn % COLUMN_Y_PATTERN.length],
        row,
        col: visualColumn,
      };
    });

    const minCy = Math.min(...positionedLessons.map((item) => item.cy));
    const maxCy = Math.max(...positionedLessons.map((item) => item.cy));

    const containerHeight = Math.max(430, maxCy - minCy + 300);

    return {
      positionedLessons,
      mapWidth,
      containerHeight,
    };
  }, [lessons]);

  const { positionedLessons, mapWidth, containerHeight } = layout;

  if (loading) {
    return (
      <main className="w-full px-4 py-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">{copy("Loading lessons...", "Đang tải các lesson...")}</p>
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

        <div className="learner-tech-panel mt-3 rounded-[2rem] px-6 py-6 md:px-8">
          <h3 className="text-2xl md:text-3xl font-black text-[#1e2e51]">
            {sectionTitle ?? `Section ${sectionDisplayNumber ?? sectionId}`}
          </h3>
          <p className="text-gray-600 mt-2 text-lg">
            {copy(
              "Current lessons are orange, completed lessons are green, and locked lessons are gray.",
              "Lesson đang học sẽ màu cam, hoàn thành sẽ màu xanh, chưa mở khóa sẽ màu xám.",
            )}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#155ca5]">
            {copy(
              "Review lessons appear in the learning path after the regular lessons arranged for this section.",
              "Bài review sẽ xuất hiện trong lộ trình sau các bài thường đã được sắp cho section này.",
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4b6f97]">
            <span className="lesson-tech-badge rounded-full border border-white/70 px-4 py-2">
              Adaptive flow
            </span>
            <span className="lesson-tech-badge rounded-full border border-white/70 px-4 py-2">
              Structured path
            </span>
            <span className="lesson-tech-badge rounded-full border border-white/70 px-4 py-2">
              Smart review
            </span>
          </div>
        </div>
      </section>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-lg font-bold text-[#1e2e51]">
            {copy("This section does not have any lessons yet.", "Section này chưa có lesson nào")}
          </p>
        </div>
      ) : (
        <section className="overflow-x-auto">
          <div className="min-w-max px-4 py-8">
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
                {positionedLessons.slice(0, -1).map((lesson, index) => {
                  const next = positionedLessons[index + 1];
                  const nextStyle = getLessonStyle(next);

                  return buildLessonPath(
                    lesson,
                    next,
                    nextStyle.connector,
                    nextStyle.dot,
                  );
                })}
              </svg>

              {positionedLessons.map((lesson) => {
                const style = getLessonStyle(lesson);
                const isLocked = !lesson.unlocked;
                const reviewMeta = lesson.reviewLesson
                  ? getReviewLessonMeta(lessons, lesson.lessonId)
                  : null;

                return (
                  <div
                    key={lesson.lessonId}
                    className="absolute"
                    style={{
                      left: `${lesson.cx - NODE_WIDTH / 2}px`,
                      top: `${lesson.cy - NODE_RADIUS}px`,
                      width: `${NODE_WIDTH}px`,
                    }}
                  >
                    <Link
                      to={isLocked ? "#" : `/lessons/${lesson.lessonId}`}
                      onClick={(e) => {
                        if (isLocked) e.preventDefault();
                      }}
                      className={`group block text-center ${isLocked ? "cursor-not-allowed" : ""}`}
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
                      </div>

                      <div className="mt-5">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style.badge}`}
                        >
                          {lesson.reviewLesson
                            ? `${copy("Review", "Review")} ${reviewMeta?.reviewIndex ?? lesson.lessonNumber}`
                            : `Lesson ${lesson.lessonNumber}`}
                        </div>

                        <h3
                          className={`mt-3 text-base font-black leading-tight px-3 ${style.title}`}
                        >
                          {lesson.lessonTitle}
                        </h3>

                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          {copy(style.statusText, style.statusText === "Locked"
                            ? "Bị khóa"
                            : style.statusText === "Completed"
                              ? "Hoàn thành"
                              : style.statusText === "Current"
                                ? "Hiện tại"
                                : style.statusText === "Review Done"
                                  ? "Review đã xong"
                                  : style.statusText === "Review Ready"
                                    ? "Review sẵn sàng"
                                    : style.statusText === "Review"
                                      ? "Review"
                                      : "Đã mở")}
                        </p>

                        {lesson.reviewLesson && reviewMeta && (
                          <p className="mt-1 text-xs font-semibold text-[#155ca5]">
                            {copy(
                              `Review after ${reviewMeta.coveredLessons} lessons`,
                              `Ôn lại sau ${reviewMeta.coveredLessons} bài`,
                            )}
                          </p>
                        )}
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
