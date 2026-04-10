import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  BookOpen,
  FileText,
  Loader2,
  Layers3,
  ChevronRight,
  FolderTree,
  Pencil,
} from "lucide-react";
import { adminApi } from "@/api";
import type {
  Grade,
  Unit,
  Section,
  Lesson,
  SectionType,
  SkillType,
} from "@/api/admin/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import QuestionPanel from "./content/QuestionPanel";

type ActiveStage = "grade" | "unit" | "section" | "lesson" | "question";

function getUnitDisplayNumber(unit: Unit, index: number): number {
  return unit.unitNumber ?? unit.orderIndex ?? index + 1;
}

function getSectionDisplayNumber(section: Section, index: number): number {
  return section.sectionNumber ?? section.orderIndex ?? index + 1;
}

function getLessonDisplayNumber(lesson: Lesson, index: number): number {
  return lesson.lessonNumber ?? lesson.orderIndex ?? index + 1;
}

function sortUnits(items: Unit[]): Unit[] {
  return [...items].sort((a, b) => {
    const aNum = a.unitNumber ?? a.orderIndex ?? a.id ?? 0;
    const bNum = b.unitNumber ?? b.orderIndex ?? b.id ?? 0;
    return aNum - bNum;
  });
}

function sortSections(items: Section[]): Section[] {
  return [...items].sort((a, b) => {
    const aNum = a.sectionNumber ?? a.orderIndex ?? a.id ?? 0;
    const bNum = b.sectionNumber ?? b.orderIndex ?? b.id ?? 0;
    return aNum - bNum;
  });
}

function sortLessons(items: Lesson[]): Lesson[] {
  return [...items].sort((a, b) => {
    const aNum = a.lessonNumber ?? a.orderIndex ?? a.id ?? 0;
    const bNum = b.lessonNumber ?? b.orderIndex ?? b.id ?? 0;
    return aNum - bNum;
  });
}

function StageHeader({
  title,
  count,
  icon,
  right,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="text-[#155ca5]">{icon}</div>
        <div className="min-w-0">
          <h2 className="font-bold text-base text-slate-900">
            {title} ({count})
          </h2>
        </div>
      </div>
      {right}
    </div>
  );
}

function CompactStageCard({
  label,
  title,
  onExpand,
}: {
  label: string;
  title: string;
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
          <p className="text-sm font-semibold text-slate-900 truncate">
            {title}
          </p>
          <p className="text-xs text-slate-500">Click to reopen the list</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

export function ContentManagement() {
  const [loading, setLoading] = useState(true);
  const [panelLoading, setPanelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questionsPayload, setQuestionsPayload] = useState<any>(null);

  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [activeStage, setActiveStage] = useState<ActiveStage>("grade");

  const [creatingGrade, setCreatingGrade] = useState(false);
  const [isCreateGradeOpen, setIsCreateGradeOpen] = useState(false);
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeDescription, setNewGradeDescription] = useState("");

  const [creatingUnit, setCreatingUnit] = useState(false);
  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitDescription, setNewUnitDescription] = useState("");
  const [newUnitOrderIndex, setNewUnitOrderIndex] = useState("");

  const [creatingSection, setCreatingSection] = useState(false);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionOrderIndex, setNewSectionOrderIndex] = useState("");
  const [newSectionType, setNewSectionType] =
    useState<SectionType>("GETTING_STARTED");

  const [creatingLesson, setCreatingLesson] = useState(false);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonOrderIndex, setNewLessonOrderIndex] = useState("");
  const [newLessonSkillType, setNewLessonSkillType] =
    useState<SkillType>("VOCABULARY");
  const [newLessonDurationMinutes, setNewLessonDurationMinutes] =
    useState("10");
  const [newLessonIsReview, setNewLessonIsReview] = useState(false);
  const [newLessonIsVipOnly, setNewLessonIsVipOnly] = useState(false);

  const [updatingLesson, setUpdatingLesson] = useState(false);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editLessonName, setEditLessonName] = useState("");
  const [editLessonOrderIndex, setEditLessonOrderIndex] = useState("");
  const [editLessonSkillType, setEditLessonSkillType] =
    useState<SkillType>("VOCABULARY");
  const [editLessonDurationMinutes, setEditLessonDurationMinutes] =
    useState("10");
  const [editLessonIsReview, setEditLessonIsReview] = useState(false);
  const [editLessonIsVipOnly, setEditLessonIsVipOnly] = useState(false);

  const {
    warning,
    error: showError,
    success,
    notification,
    close,
  } = useNotificationPopup();

  useEffect(() => {
    void initializeData();
  }, []);

  const selectedPathLabel = useMemo(() => {
    const parts = [
      selectedGrade?.name,
      selectedUnit?.name,
      selectedSection?.name,
      selectedLesson?.name,
    ].filter(Boolean);

    return parts.join(" / ");
  }, [selectedGrade, selectedUnit, selectedSection, selectedLesson]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getAllGrades();

      if (!response.success) {
        setError(response.error?.message || "Failed to load grades");
        return;
      }

      const loadedGrades = response.data ?? [];
      setGrades(loadedGrades);

      if (loadedGrades.length > 0) {
        const firstGrade = loadedGrades[0];
        setSelectedGrade(firstGrade);
        await loadUnitsByGrade(firstGrade.id, false);
      }
    } catch (err) {
      console.error("Error initializing content:", err);
      setError("Failed to load content data");
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = async () => {
    try {
      const response = await adminApi.getAllGrades();
      if (response.success) {
        setGrades(response.data ?? []);
      }
    } catch (err) {
      console.error("Error loading grades:", err);
    }
  };

  const loadUnitsByGrade = async (gradeId: number, moveStage = true) => {
    try {
      setPanelLoading(true);

      const response = await adminApi.getUnitsByGrade({ gradeId });

      if (response.success) {
        setUnits(sortUnits(response.data ?? []));
        setSections([]);
        setLessons([]);
        setQuestionsPayload(null);
        setSelectedUnit(null);
        setSelectedSection(null);
        setSelectedLesson(null);

        if (moveStage) setActiveStage("unit");
      } else {
        setUnits([]);
        setSections([]);
        setLessons([]);
        setQuestionsPayload(null);
        showError({
          title: "Failed to load units",
          message: response.error?.message || "An error occurred",
          showCancelButton: false,
          confirmText: "Close",
        });
      }
    } catch (err) {
      console.error("Error loading units:", err);
      setUnits([]);
      setSections([]);
      setLessons([]);
      setQuestionsPayload(null);
    } finally {
      setPanelLoading(false);
    }
  };

  const loadSectionsByUnit = async (unitId: number, moveStage = true) => {
    try {
      setPanelLoading(true);

      const response = await adminApi.getSectionsByUnit({ unitId });

      if (response.success) {
        setSections(sortSections(response.data ?? []));
        setLessons([]);
        setQuestionsPayload(null);
        setSelectedSection(null);
        setSelectedLesson(null);

        if (moveStage) setActiveStage("section");
      } else {
        setSections([]);
        setLessons([]);
        setQuestionsPayload(null);
      }
    } catch (err) {
      console.error("Error loading sections:", err);
      setSections([]);
      setLessons([]);
      setQuestionsPayload(null);
    } finally {
      setPanelLoading(false);
    }
  };

  const loadLessonsBySection = async (sectionId: number, moveStage = true) => {
    try {
      setPanelLoading(true);

      const response = await adminApi.getLessonsBySection({ sectionId });

      if (response.success) {
        setLessons(sortLessons(response.data ?? []));
        setQuestionsPayload(null);
        setSelectedLesson(null);

        if (moveStage) setActiveStage("lesson");
      } else {
        setLessons([]);
        setQuestionsPayload(null);
      }
    } catch (err) {
      console.error("Error loading lessons:", err);
      setLessons([]);
      setQuestionsPayload(null);
    } finally {
      setPanelLoading(false);
    }
  };

  const loadQuestionsByLesson = async (lessonId: number, moveStage = true) => {
    try {
      setPanelLoading(true);

      const response = await adminApi.getQuestionsByLesson({ lessonId });

      if (response.success) {
        setQuestionsPayload(response.data ?? null);
        if (moveStage) setActiveStage("question");
      } else {
        setQuestionsPayload(null);
      }
    } catch (err) {
      console.error("Error loading questions:", err);
      setQuestionsPayload(null);
    } finally {
      setPanelLoading(false);
    }
  };

  const handleSelectGrade = async (grade: Grade) => {
    setSelectedGrade(grade);
    await loadUnitsByGrade(grade.id, true);
  };

  const handleSelectUnit = async (unit: Unit) => {
    setSelectedUnit(unit);
    await loadSectionsByUnit(unit.id, true);
  };

  const handleSelectSection = async (section: Section) => {
    setSelectedSection(section);
    await loadLessonsBySection(section.id, true);
  };

  const handleSelectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    await loadQuestionsByLesson(lesson.id, true);
  };

  const handleExpandGrade = () => setActiveStage("grade");
  const handleExpandUnit = () => setActiveStage("unit");
  const handleExpandSection = () => setActiveStage("section");
  const handleExpandLesson = () => setActiveStage("lesson");

  const handleCreateGrade = async () => {
    if (!newGradeName.trim() || !newGradeDescription.trim()) {
      showError({
        title: "Missing information",
        message: "Please enter both grade name and description",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    try {
      setCreatingGrade(true);

      const response = await adminApi.createGrade({
        name: newGradeName.trim(),
        description: newGradeDescription.trim(),
      });

      if (response.success) {
        setIsCreateGradeOpen(false);
        setNewGradeName("");
        setNewGradeDescription("");
        await loadGrades();

        success({
          title: "Success",
          message: "Grade created successfully",
          autoClose: true,
          showCancelButton: false,
        });
      } else {
        showError({
          title: "Failed to create grade",
          message: response.error?.message || "An error occurred",
          showCancelButton: false,
          confirmText: "Close",
        });
      }
    } catch (err) {
      console.error("Error creating grade:", err);
    } finally {
      setCreatingGrade(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!selectedGrade) {
      showError({
        title: "No grade selected",
        message: "Please select a grade before creating a unit",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const unitName = newUnitName.trim();
    const unitDescription = newUnitDescription.trim();

    if (!unitName) {
      showError({
        title: "Missing information",
        message: "Please enter a unit name",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const currentMaxUnitNumber =
      units.length > 0
        ? Math.max(
            ...units.map((unit, index) => getUnitDisplayNumber(unit, index)),
          )
        : 0;

    const parsedOrderIndex = newUnitOrderIndex.trim()
      ? Number(newUnitOrderIndex.trim())
      : NaN;

    const safeOrderIndex =
      Number.isFinite(parsedOrderIndex) && parsedOrderIndex > 0
        ? parsedOrderIndex
        : currentMaxUnitNumber + 1;

    try {
      setCreatingUnit(true);

      const response = await adminApi.createUnit({
        gradeId: selectedGrade.id,
        name: unitName,
        description: unitDescription || undefined,
        unitNumber: safeOrderIndex,
        orderIndex: safeOrderIndex,
      });

      if (response.success) {
        setIsCreateUnitOpen(false);
        setNewUnitName("");
        setNewUnitDescription("");
        setNewUnitOrderIndex("");

        await loadUnitsByGrade(selectedGrade.id, false);
        setActiveStage("unit");

        success({
          title: "Success",
          message: "Unit created successfully",
          autoClose: true,
          showCancelButton: false,
        });
      } else {
        showError({
          title: "Failed to create unit",
          message: response.error?.message || "An error occurred",
          showCancelButton: false,
          confirmText: "Close",
        });
      }
    } catch (err) {
      console.error("Error creating unit:", err);
    } finally {
      setCreatingUnit(false);
    }
  };

  const handleCreateSection = async () => {
    if (!selectedUnit) {
      showError({
        title: "No unit selected",
        message: "Please select a unit before creating a section",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const sectionName = newSectionName.trim();

    if (!sectionName) {
      showError({
        title: "Missing information",
        message: "Please enter a section name",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const currentMaxSectionNumber =
      sections.length > 0
        ? Math.max(
            ...sections.map((section, index) =>
              getSectionDisplayNumber(section, index),
            ),
          )
        : 0;

    const parsedOrderIndex = newSectionOrderIndex.trim()
      ? Number(newSectionOrderIndex.trim())
      : NaN;

    const safeOrderIndex =
      Number.isFinite(parsedOrderIndex) && parsedOrderIndex > 0
        ? parsedOrderIndex
        : currentMaxSectionNumber + 1;

    try {
      setCreatingSection(true);

      const response = await adminApi.createSection({
        unitId: selectedUnit.id,
        name: sectionName,
        sectionType: newSectionType,
        sectionNumber: safeOrderIndex,
        orderIndex: safeOrderIndex,
      });

      if (response.success) {
        setIsCreateSectionOpen(false);
        setNewSectionName("");
        setNewSectionOrderIndex("");
        setNewSectionType("GETTING_STARTED");

        await loadSectionsByUnit(selectedUnit.id, false);
        setActiveStage("section");

        success({
          title: "Success",
          message: "Section created successfully",
          autoClose: true,
          showCancelButton: false,
        });
      } else {
        showError({
          title: "Failed to create section",
          message: response.error?.message || "An error occurred",
          showCancelButton: false,
          confirmText: "Close",
        });
      }
    } catch (err) {
      console.error("Error creating section:", err);
    } finally {
      setCreatingSection(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedSection) {
      showError({
        title: "No section selected",
        message: "Please select a section before creating a lesson",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const lessonName = newLessonName.trim();

    if (!lessonName) {
      showError({
        title: "Missing information",
        message: "Please enter a lesson name",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const parsedDuration = Number(newLessonDurationMinutes);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      showError({
        title: "Missing information",
        message: "Duration minutes must be greater than 0",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const currentMaxLessonNumber =
      lessons.length > 0
        ? Math.max(
            ...lessons.map((lesson, index) =>
              getLessonDisplayNumber(lesson, index),
            ),
          )
        : 0;

    const parsedOrderIndex = newLessonOrderIndex.trim()
      ? Number(newLessonOrderIndex.trim())
      : NaN;

    const safeOrderIndex =
      Number.isFinite(parsedOrderIndex) && parsedOrderIndex > 0
        ? parsedOrderIndex
        : currentMaxLessonNumber + 1;

    try {
      setCreatingLesson(true);

      const response = await adminApi.createLesson({
        sectionId: selectedSection.id,
        name: lessonName,
        lessonNumber: safeOrderIndex,
        orderIndex: safeOrderIndex,
        skillType: newLessonSkillType,
        isReviewLesson: newLessonIsReview,
        durationMinutes: parsedDuration,
        isVipOnly: newLessonIsVipOnly,
      });

      if (response.success) {
        setIsCreateLessonOpen(false);
        setNewLessonName("");
        setNewLessonOrderIndex("");
        setNewLessonSkillType("VOCABULARY");
        setNewLessonDurationMinutes("10");
        setNewLessonIsReview(false);
        setNewLessonIsVipOnly(false);

        await loadLessonsBySection(selectedSection.id, false);
        setActiveStage("lesson");

        success({
          title: "Success",
          message: "Lesson created successfully",
          autoClose: true,
          showCancelButton: false,
        });
      } else {
        showError({
          title: "Failed to create lesson",
          message: response.error?.message || "An error occurred",
          showCancelButton: false,
          confirmText: "Close",
        });
      }
    } catch (err) {
      console.error("Error creating lesson:", err);
    } finally {
      setCreatingLesson(false);
    }
  };

  const openEditLessonDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditLessonName(lesson.name || "");
    setEditLessonOrderIndex(
      String(lesson.lessonNumber ?? lesson.orderIndex ?? ""),
    );
    setEditLessonSkillType(
      (lesson.skillType as SkillType) || "VOCABULARY",
    );
    setEditLessonDurationMinutes(String(lesson.durationMinutes ?? 10));
    setEditLessonIsReview(Boolean(lesson.isReviewLesson));
    setEditLessonIsVipOnly(Boolean(lesson.isVipOnly));
    setIsEditLessonOpen(true);
  };

  const handleUpdateLesson = async () => {
    if (!editingLesson || !selectedSection) return;

    const lessonName = editLessonName.trim();

    if (!lessonName) {
      showError({
        title: "Missing information",
        message: "Please enter a lesson name",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const parsedDuration = Number(editLessonDurationMinutes);
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      showError({
        title: "Missing information",
        message: "Duration minutes must be greater than 0",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    const parsedOrderIndex = editLessonOrderIndex.trim()
      ? Number(editLessonOrderIndex.trim())
      : NaN;

    const safeOrderIndex =
      Number.isFinite(parsedOrderIndex) && parsedOrderIndex > 0
        ? parsedOrderIndex
        : editingLesson.lessonNumber ?? editingLesson.orderIndex ?? 1;

    try {
      setUpdatingLesson(true);

      const response = await adminApi.updateLesson({
        lessonId: editingLesson.id,
        data: {
          sectionId: selectedSection.id,
          name: lessonName,
          lessonNumber: safeOrderIndex,
          orderIndex: safeOrderIndex,
          skillType: editLessonSkillType,
          isReviewLesson: editLessonIsReview,
          durationMinutes: parsedDuration,
          isVipOnly: editLessonIsVipOnly,
        },
      });

      if (response.success) {
        setIsEditLessonOpen(false);
        setEditingLesson(null);
        setEditLessonName("");
        setEditLessonOrderIndex("");
        setEditLessonSkillType("VOCABULARY");
        setEditLessonDurationMinutes("10");
        setEditLessonIsReview(false);
        setEditLessonIsVipOnly(false);

        await loadLessonsBySection(selectedSection.id, false);

        success({
          title: "Success",
          message: "Lesson updated successfully",
          autoClose: true,
          showCancelButton: false,
        });
      } else {
        showError({
          title: "Failed to update lesson",
          message: response.error?.message || "An error occurred",
          showCancelButton: false,
          confirmText: "Close",
        });
      }
    } catch (err) {
      console.error("Error updating lesson:", err);
    } finally {
      setUpdatingLesson(false);
    }
  };

  const handleDeleteGrade = (id: number) => {
    warning({
      title: "Confirm grade deletion",
      message: "Are you sure you want to delete this grade?",
      description: "This action cannot be undone",
      confirmText: "Delete",
      cancelText: "Cancel",
      showCancelButton: true,
      onConfirm: async () => {
        try {
          setDeletingItem(`grade-${id}`);
          const response = await adminApi.deleteGrade({ id });

          if (response.success) {
            if (selectedGrade?.id === id) {
              setSelectedGrade(null);
              setSelectedUnit(null);
              setSelectedSection(null);
              setSelectedLesson(null);
              setUnits([]);
              setSections([]);
              setLessons([]);
              setQuestionsPayload(null);
              setActiveStage("grade");
            }

            await loadGrades();

            success({
              title: "Success",
              message: "Grade deleted successfully",
              autoClose: true,
              showCancelButton: false,
            });
          }
        } finally {
          setDeletingItem(null);
        }
      },
    });
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;

    try {
      setDeletingItem(`unit-${unitId}`);
      const response = await adminApi.deleteUnit({ id: unitId });

      if (response.success) {
        if (selectedGrade) await loadUnitsByGrade(selectedGrade.id, false);

        if (selectedUnit?.id === unitId) {
          setSelectedUnit(null);
          setSelectedSection(null);
          setSelectedLesson(null);
          setSections([]);
          setLessons([]);
          setQuestionsPayload(null);
        }

        setActiveStage("unit");
      }
    } finally {
      setDeletingItem(null);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    try {
      setDeletingItem(`section-${sectionId}`);
      const response = await adminApi.deleteSection({ id: sectionId });

      if (response.success) {
        if (selectedUnit) await loadSectionsByUnit(selectedUnit.id, false);

        if (selectedSection?.id === sectionId) {
          setSelectedSection(null);
          setSelectedLesson(null);
          setLessons([]);
          setQuestionsPayload(null);
        }

        setActiveStage("section");
      }
    } finally {
      setDeletingItem(null);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      setDeletingItem(`lesson-${lessonId}`);
      const response = await adminApi.deleteLesson({ id: lessonId });

      if (response.success) {
        if (selectedSection) await loadLessonsBySection(selectedSection.id, false);

        if (selectedLesson?.id === lessonId) {
          setSelectedLesson(null);
          setQuestionsPayload(null);
        }

        setActiveStage("lesson");
      }
    } finally {
      setDeletingItem(null);
    }
  };

  const isGradeExpanded = activeStage === "grade" || !selectedGrade;
  const isUnitExpanded = activeStage === "unit" || !selectedGrade;
  const isSectionExpanded = activeStage === "section" || !selectedUnit;
  const isLessonExpanded = activeStage === "lesson" || !selectedSection;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={() => void initializeData()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              Content Management
            </h1>
            {selectedPathLabel && (
              <p className="text-xs text-[#155ca5] font-semibold mt-2">
                {selectedPathLabel}
              </p>
            )}
          </div>

          {panelLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 space-y-4">
          {isGradeExpanded ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <StageHeader
                title="Grades"
                count={grades.length}
                icon={<FolderTree className="w-4 h-4" />}
                right={
                  <button
                    onClick={() => setIsCreateGradeOpen(true)}
                    className="px-2.5 py-1.5 bg-[#155ca5] text-white rounded-md text-xs font-bold hover:bg-[#005095] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    Add
                  </button>
                }
              />

              <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-200">
                {grades.map((grade) => (
                  <div
                    key={`grade-${grade.id}`}
                    onClick={() => void handleSelectGrade(grade)}
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
                        <p className="text-sm font-semibold text-slate-900 break-words">
                          {grade.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap break-words">
                          {grade.description || "No description"}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGrade(grade.id);
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
                ))}
              </div>
            </div>
          ) : selectedGrade ? (
            <CompactStageCard
              label="Grade"
              title={selectedGrade.name}
              onExpand={handleExpandGrade}
            />
          ) : null}

          {selectedGrade &&
            (isUnitExpanded ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <StageHeader
                  title="Units"
                  count={units.length}
                  icon={<BookOpen className="w-4 h-4" />}
                  right={
                    <button
                      onClick={() => setIsCreateUnitOpen(true)}
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

                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-200 mt-2">
                  {units.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500 text-center">
                      No units found
                    </div>
                  ) : (
                    units.map((unit, index) => (
                      <div
                        key={`unit-${unit.id}`}
                        onClick={() => void handleSelectUnit(unit)}
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
                              void handleDeleteUnit(unit.id);
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
                onExpand={handleExpandUnit}
              />
            ) : null)}

          {selectedUnit &&
            (isSectionExpanded ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <StageHeader
                  title="Sections"
                  count={sections.length}
                  icon={<Layers3 className="w-4 h-4" />}
                  right={
                    <button
                      onClick={() => setIsCreateSectionOpen(true)}
                      className="px-2.5 py-1.5 bg-[#155ca5] text-white rounded-md text-xs font-bold hover:bg-[#005095] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Add
                    </button>
                  }
                />

                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-200">
                  {sections.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500 text-center">
                      No sections found
                    </div>
                  ) : (
                    sections.map((section, index) => (
                      <div
                        key={`section-${section.id}`}
                        onClick={() => void handleSelectSection(section)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedSection?.id === section.id
                            ? "bg-[#155ca5]/10 border-l-4 border-[#155ca5]"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-[11px] font-bold text-[#155ca5]">
                                SECTION {getSectionDisplayNumber(section, index)}
                              </p>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                ID: {section.id}
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-slate-900 break-words">
                              {section.name || `Section ${getSectionDisplayNumber(section, index)}`}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteSection(section.id);
                            }}
                            disabled={deletingItem === `section-${section.id}`}
                            className="p-1.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          >
                            {deletingItem === `section-${section.id}` ? (
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
            ) : selectedSection ? (
              <CompactStageCard
                label="Section"
                title={selectedSection.name}
                onExpand={handleExpandSection}
              />
            ) : null)}

          {selectedSection &&
            (isLessonExpanded ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <StageHeader
                  title="Lessons"
                  count={lessons.length}
                  icon={<FileText className="w-4 h-4" />}
                  right={
                    <button
                      onClick={() => setIsCreateLessonOpen(true)}
                      className="px-2.5 py-1.5 bg-[#155ca5] text-white rounded-md text-xs font-bold hover:bg-[#005095] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 inline mr-1" />
                      Add
                    </button>
                  }
                />

                <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-200">
                  {lessons.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500 text-center">
                      No lessons found
                    </div>
                  ) : (
                    lessons.map((lesson, index) => (
                      <div
                        key={`lesson-${lesson.id}`}
                        onClick={() => void handleSelectLesson(lesson)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedLesson?.id === lesson.id
                            ? "bg-[#155ca5]/10 border-l-4 border-[#155ca5]"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-[11px] font-bold text-[#155ca5]">
                                LESSON {getLessonDisplayNumber(lesson, index)}
                              </p>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                ID: {lesson.id}
                              </span>
                            </div>

                            <p className="text-sm font-semibold text-slate-900 break-words">
                              {lesson.name || `Lesson ${getLessonDisplayNumber(lesson, index)}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditLessonDialog(lesson);
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteLesson(lesson.id);
                              }}
                              disabled={deletingItem === `lesson-${lesson.id}`}
                              className="p-1.5 hover:bg-red-50 rounded transition-colors"
                            >
                              {deletingItem === `lesson-${lesson.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 text-red-600 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : selectedLesson ? (
              <CompactStageCard
                label="Lesson"
                title={selectedLesson.name}
                onExpand={handleExpandLesson}
              />
            ) : null)}
        </div>

        <div className="col-span-8">
          <QuestionPanel
            selectedLesson={selectedLesson}
            questionsPayload={questionsPayload}
            onReload={async () => {
              if (selectedLesson?.id) {
                await loadQuestionsByLesson(selectedLesson.id, false);
              }
            }}
          />
        </div>
      </div>

      <Dialog
        open={isCreateGradeOpen}
        onOpenChange={(open) => {
          setIsCreateGradeOpen(open);
          if (!open) {
            setNewGradeName("");
            setNewGradeDescription("");
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create New Grade</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade name</label>
              <Input
                value={newGradeName}
                onChange={(e) => setNewGradeName(e.target.value)}
                placeholder="Example: English Elementary (A1-A2)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newGradeDescription}
                onChange={(e) => setNewGradeDescription(e.target.value)}
                placeholder="Enter grade description"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateGradeOpen(false)}
              disabled={creatingGrade}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateGrade()}
              disabled={creatingGrade}
            >
              {creatingGrade ? "Creating..." : "Create grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateUnitOpen}
        onOpenChange={(open) => {
          setIsCreateUnitOpen(open);
          if (!open) {
            setNewUnitName("");
            setNewUnitDescription("");
            setNewUnitOrderIndex("");
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create New Unit</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
              <span className="text-slate-500">Selected grade: </span>
              <span className="font-semibold text-slate-900">
                {selectedGrade?.name || "Not selected"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit name</label>
              <Input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Example: Unit 1 - Greetings"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newUnitDescription}
                onChange={(e) => setNewUnitDescription(e.target.value)}
                placeholder="Enter unit description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit number</label>
              <Input
                value={newUnitOrderIndex}
                onChange={(e) => setNewUnitOrderIndex(e.target.value)}
                placeholder="Example: 7"
                type="number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateUnitOpen(false)}
              disabled={creatingUnit}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateUnit()}
              disabled={creatingUnit}
            >
              {creatingUnit ? "Creating..." : "Create unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateSectionOpen}
        onOpenChange={(open) => {
          setIsCreateSectionOpen(open);
          if (!open) {
            setNewSectionName("");
            setNewSectionOrderIndex("");
            setNewSectionType("GETTING_STARTED");
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
              <span className="text-slate-500">Selected unit: </span>
              <span className="font-semibold text-slate-900">
                {selectedUnit?.name || "Not selected"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section name</label>
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Example: Reading: Introductions"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section number</label>
              <Input
                value={newSectionOrderIndex}
                onChange={(e) => setNewSectionOrderIndex(e.target.value)}
                placeholder="Example: 1"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Section type</label>
              <select
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value as SectionType)}
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="GETTING_STARTED">GETTING_STARTED</option>
                <option value="LANGUAGE">LANGUAGE</option>
                <option value="READING">READING</option>
                <option value="SPEAKING">SPEAKING</option>
                <option value="LISTENING">LISTENING</option>
                <option value="WRITING">WRITING</option>
                <option value="COMMUNICATION_CULTURE_CLIL">
                  COMMUNICATION_CULTURE_CLIL
                </option>
                <option value="LOOKING_BACK">LOOKING_BACK</option>
                <option value="UNIT_REVISION">UNIT_REVISION</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateSectionOpen(false)}
              disabled={creatingSection}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateSection()}
              disabled={creatingSection}
            >
              {creatingSection ? "Creating..." : "Create section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateLessonOpen}
        onOpenChange={(open) => {
          setIsCreateLessonOpen(open);
          if (!open) {
            setNewLessonName("");
            setNewLessonOrderIndex("");
            setNewLessonSkillType("VOCABULARY");
            setNewLessonDurationMinutes("10");
            setNewLessonIsReview(false);
            setNewLessonIsVipOnly(false);
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Create New Lesson</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
              <span className="text-slate-500">Selected section: </span>
              <span className="font-semibold text-slate-900">
                {selectedSection?.name || "Not selected"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lesson name</label>
              <Input
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                placeholder="Example: Vocabulary: Basic Greetings"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lesson number</label>
              <Input
                value={newLessonOrderIndex}
                onChange={(e) => setNewLessonOrderIndex(e.target.value)}
                placeholder="Example: 1"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skill type</label>
              <select
                value={newLessonSkillType}
                onChange={(e) => setNewLessonSkillType(e.target.value as SkillType)}
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="VOCABULARY">VOCABULARY</option>
                <option value="GRAMMAR">GRAMMAR</option>
                <option value="READING">READING</option>
                <option value="LISTENING">LISTENING</option>
                <option value="SPEAKING">SPEAKING</option>
                <option value="WRITING">WRITING</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration minutes</label>
              <Input
                value={newLessonDurationMinutes}
                onChange={(e) => setNewLessonDurationMinutes(e.target.value)}
                placeholder="Example: 10"
                type="number"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newLessonIsReview}
                onChange={(e) => setNewLessonIsReview(e.target.checked)}
              />
              Is review lesson
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newLessonIsVipOnly}
                onChange={(e) => setNewLessonIsVipOnly(e.target.checked)}
              />
              Is VIP only
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateLessonOpen(false)}
              disabled={creatingLesson}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateLesson()}
              disabled={creatingLesson}
            >
              {creatingLesson ? "Creating..." : "Create lesson"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditLessonOpen}
        onOpenChange={(open) => {
          setIsEditLessonOpen(open);
          if (!open) {
            setEditingLesson(null);
            setEditLessonName("");
            setEditLessonOrderIndex("");
            setEditLessonSkillType("VOCABULARY");
            setEditLessonDurationMinutes("10");
            setEditLessonIsReview(false);
            setEditLessonIsVipOnly(false);
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Lesson name</label>
              <Input
                value={editLessonName}
                onChange={(e) => setEditLessonName(e.target.value)}
                placeholder="Enter lesson name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lesson number</label>
              <Input
                value={editLessonOrderIndex}
                onChange={(e) => setEditLessonOrderIndex(e.target.value)}
                placeholder="Example: 2"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skill type</label>
              <select
                value={editLessonSkillType}
                onChange={(e) => setEditLessonSkillType(e.target.value as SkillType)}
                className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
              >
                <option value="VOCABULARY">VOCABULARY</option>
                <option value="GRAMMAR">GRAMMAR</option>
                <option value="READING">READING</option>
                <option value="LISTENING">LISTENING</option>
                <option value="SPEAKING">SPEAKING</option>
                <option value="WRITING">WRITING</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Duration minutes</label>
              <Input
                value={editLessonDurationMinutes}
                onChange={(e) => setEditLessonDurationMinutes(e.target.value)}
                placeholder="Example: 10"
                type="number"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editLessonIsReview}
                onChange={(e) => setEditLessonIsReview(e.target.checked)}
              />
              Is review lesson
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editLessonIsVipOnly}
                onChange={(e) => setEditLessonIsVipOnly(e.target.checked)}
              />
              Is VIP only
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditLessonOpen(false)}
              disabled={updatingLesson}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleUpdateLesson()}
              disabled={updatingLesson}
            >
              {updatingLesson ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationPopup {...notification} onClose={close} />
    </div>
  );
}