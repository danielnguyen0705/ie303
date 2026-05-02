import type { ReactNode } from "react";
import { FolderTree, Layers3, Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import type { Grade, Section, Unit } from "@/api/admin/types";

type ActiveStage = "grade" | "unit" | "section" | "lesson" | "question";

type ContentSidebarProps = {
  grades: Grade[];
  sections: Section[];
  selectedGrade: Grade | null;
  selectedUnit: Unit | null;
  selectedSection: Section | null;
  activeStage: ActiveStage;
  deletingItem: string | null;
  onSelectGrade: (grade: Grade) => void;
  onSelectSection: (section: Section) => void;
  onDeleteGrade: (id: number) => void;
  onExpandGrade: () => void;
  onExpandSection: () => void;
  onOpenCreateGrade: () => void;
};

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

export default function ContentSidebar({
  grades,
  sections,
  selectedGrade,
  selectedUnit,
  selectedSection,
  activeStage,
  deletingItem,
  onSelectGrade,
  onSelectSection,
  onDeleteGrade,
  onExpandGrade,
  onExpandSection,
  onOpenCreateGrade,
}: ContentSidebarProps) {
  const isGradeExpanded = activeStage === "grade" || !selectedGrade;
  const isSectionExpanded = activeStage === "section" || !selectedUnit;

  return (
    <div className="space-y-4">
      {isGradeExpanded ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <StageHeader
            title="Grades"
            count={grades.length}
            icon={<FolderTree className="w-4 h-4" />}
            right={
              <button
                onClick={onOpenCreateGrade}
                className="px-2.5 py-1.5 bg-[#155ca5] text-white rounded-md text-xs font-bold hover:bg-[#005095] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                Add
              </button>
            }
          />

          <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-200">
            {grades.length === 0 ? (
              <div className="p-5 text-sm text-slate-500 text-center">No grades yet</div>
            ) : (
              grades.map((grade) => (
                <div
                  key={`grade-${grade.id}`}
                  onClick={() => onSelectGrade(grade)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedGrade?.id === grade.id
                      ? "bg-[#155ca5]/10 border-l-4 border-[#155ca5]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-[#155ca5] mb-1">
                        #{grade.id}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {grade.name}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {grade.description || "No description"}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGrade(grade.id);
                      }}
                      disabled={deletingItem === `grade-${grade.id}`}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      {deletingItem === `grade-${grade.id}` ? (
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
      ) : selectedGrade ? (
        <CompactStageCard
          label="Grade"
          title={selectedGrade.name}
          description={selectedGrade.description}
          onExpand={onExpandGrade}
        />
      ) : null}

      {selectedUnit &&
        (isSectionExpanded ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <StageHeader
              title="Sections"
              count={sections.length}
              icon={<Layers3 className="w-4 h-4" />}
            />

            <div className="px-4 pt-2 text-xs text-slate-500">
              Unit: <span className="font-semibold">{selectedUnit.name}</span>
            </div>

            <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-200 mt-2">
              {sections.length === 0 ? (
                <div className="p-5 text-sm text-slate-500 text-center">
                  No sections found
                </div>
              ) : (
                sections.map((section) => (
                  <div
                    key={`section-${section.id}`}
                    onClick={() => onSelectSection(section)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedSection?.id === section.id
                        ? "bg-[#155ca5]/10 border-l-4 border-[#155ca5]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Layers3 className="w-4 h-4 text-[#155ca5] mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {section.name}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {section.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : selectedSection ? (
          <CompactStageCard
            label="Section"
            title={selectedSection.name}
            description={selectedSection.description}
            onExpand={onExpandSection}
          />
        ) : null)}
    </div>
  );
}