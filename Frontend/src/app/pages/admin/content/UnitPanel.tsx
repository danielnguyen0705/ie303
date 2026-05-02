import type { ReactNode } from "react";
import { BookOpen, Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import type { Grade, Unit } from "@/api/admin/types";

type ActiveStage = "grade" | "unit" | "section" | "lesson" | "question";

type UnitPanelProps = {
  selectedGrade: Grade | null;
  units: Unit[];
  selectedUnit: Unit | null;
  activeStage: ActiveStage;
  deletingItem: string | null;
  onSelectUnit: (unit: Unit) => void;
  onDeleteUnit: (id: number) => void;
  onExpandUnit: () => void;
  onOpenCreateUnit: () => void;
};

function getUnitDisplayNumber(unit: Unit, index: number): number {
  return unit.unitNumber ?? unit.orderIndex ?? index + 1;
}

function StageHeader({
  title,
  count,
  icon,
  right,
}: {
  title: string;
  count: number;
  icon: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="text-[#155ca5]">{icon}</div>
        <h2 className="font-bold text-base text-slate-900">
          {title} ({count})
        </h2>
      </div>
      {right}
    </div>
  );
}

function CompactStageCard({
  label,
  title,
  description,
  onExpand,
}: {
  label: string;
  title: string;
  description?: string;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-[#155ca5]/40 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-[#155ca5] font-bold">
            {label}
          </p>
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="text-xs text-slate-500 line-clamp-2">
            {description || "Nhấn để mở lại danh sách"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

export default function UnitPanel({
  selectedGrade,
  units,
  selectedUnit,
  activeStage,
  deletingItem,
  onSelectUnit,
  onDeleteUnit,
  onExpandUnit,
  onOpenCreateUnit,
}: UnitPanelProps) {
  const isUnitExpanded = activeStage === "unit" || !selectedGrade;

  if (!selectedGrade) return null;

  return isUnitExpanded ? (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <StageHeader
        title="Units"
        count={units.length}
        icon={<BookOpen className="w-4 h-4" />}
        right={
          <button
            onClick={onOpenCreateUnit}
            className="px-2.5 py-1.5 bg-[#155ca5] text-white rounded-md text-xs font-bold hover:bg-[#005095] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            Add
          </button>
        }
      />

      <div className="px-4 pt-2 text-xs text-slate-500">
        Grade: <span className="font-semibold">{selectedGrade.name}</span>
      </div>

      <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-200 mt-2">
        {units.length === 0 ? (
          <div className="p-5 text-sm text-slate-500 text-center">No units found</div>
        ) : (
          units.map((unit, index) => (
            <div
              key={`unit-${unit.id}`}
              onClick={() => onSelectUnit(unit)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedUnit?.id === unit.id
                  ? "bg-[#155ca5]/10 border-l-4 border-[#155ca5]"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-[11px] font-bold text-[#155ca5]">
                      UNIT {String(getUnitDisplayNumber(unit, index)).padStart(2, "0")}
                    </p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      ID: {unit.id}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Grade ID: {unit.gradeId}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 break-words">
                    {unit.name || `Unit ${getUnitDisplayNumber(unit, index)}`}
                  </p>

                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap break-words">
                    {unit.description?.trim() || "No description"}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                    <span>Order: {unit.orderIndex ?? "-"}</span>
                    <span>Progress: {unit.progress ?? 0}%</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteUnit(unit.id);
                  }}
                  disabled={deletingItem === `unit-${unit.id}`}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                >
                  {deletingItem === `unit-${unit.id}` ? (
                    <Loader2 className="w-3.5 h-3.5 text-red-600 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ) : selectedUnit ? (
    <CompactStageCard
      label="Unit"
      title={selectedUnit.name}
      description={selectedUnit.description}
      onExpand={onExpandUnit}
    />
  ) : null;
}