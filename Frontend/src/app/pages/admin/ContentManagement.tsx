import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen, FileText, Loader2, Search } from 'lucide-react';
import { adminApi } from '@/api';
import type { Unit, Lesson } from '@/data/mockData';

export function ContentManagement() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      loadLessons(selectedUnit.id);
    }
  }, [selectedUnit]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getAllUnits();

      if (response.success) {
        setUnits(response.data);
        if (response.data.length > 0 && !selectedUnit) {
          setSelectedUnit(response.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading units:', err);
      setError('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (unitId: number) => {
    try {
      const response = await adminApi.getLessonsByUnit({ unitId });

      if (response.success) {
        setLessons(response.data);
      }
    } catch (err) {
      console.error('Error loading lessons:', err);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('Are you sure you want to delete this unit? All lessons will be deleted.')) {
      return;
    }

    try {
      setDeletingItem(`unit-${unitId}`);
      const response = await adminApi.deleteUnit({ unitId });

      if (response.success) {
        alert('Unit deleted successfully');
        loadUnits();
        setSelectedUnit(null);
      }
    } catch (err) {
      console.error('Error deleting unit:', err);
      alert('Failed to delete unit');
    } finally {
      setDeletingItem(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      setDeletingItem(`lesson-${lessonId}`);
      const response = await adminApi.deleteLesson({ lessonId });

      if (response.success) {
        alert('Lesson deleted successfully');
        if (selectedUnit) {
          loadLessons(selectedUnit.id);
        }
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
      alert('Failed to delete lesson');
    } finally {
      setDeletingItem(null);
    }
  };

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
          onClick={loadUnits}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Content Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage curriculum units and lessons
          </p>
        </div>
        <button className="px-6 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Unit
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Units List */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-lg">Units ({units.length})</h2>
          </div>
          <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
            {units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedUnit?.id === unit.id
                    ? 'bg-[#155ca5]/10 border-l-4 border-[#155ca5]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-[#155ca5]" />
                      <span className="text-xs font-bold text-slate-500">
                        UNIT {String(unit.id).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1">{unit.title}</h3>
                    <p className="text-xs text-slate-500">
                      {unit.totalLessons} lessons • {unit.progress}% complete
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUnit(unit.id);
                    }}
                    disabled={deletingItem === `unit-${unit.id}`}
                    className="p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    {deletingItem === `unit-${unit.id}` ? (
                      <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons List */}
        <div className="col-span-8 bg-white rounded-lg shadow-sm">
          {selectedUnit ? (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{selectedUnit.title}</h2>
                  <p className="text-sm text-slate-500">{lessons.length} lessons</p>
                </div>
                <button className="px-4 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Lesson
                </button>
              </div>
              <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                {lessons.length > 0 ? (
                  lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-[#155ca5]" />
                            <span className="text-xs font-bold text-slate-500">
                              LESSON {lesson.lessonNumber}
                            </span>
                            {lesson.isCompleted && (
                              <span className="text-xs bg-[#27ae60]/10 text-[#27ae60] px-2 py-0.5 rounded-full font-bold">
                                Completed
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold mb-1">{lesson.title}</h3>
                          <p className="text-sm text-slate-600 mb-2">
                            {lesson.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Type: {lesson.type}</span>
                            <span>XP: {lesson.xpReward}</span>
                            <span>Coins: {lesson.coinsReward}</span>
                            {lesson.duration && <span>Duration: {lesson.duration} min</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-slate-100 rounded transition-colors">
                            <Edit className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            disabled={deletingItem === `lesson-${lesson.id}`}
                            className="p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            {deletingItem === `lesson-${lesson.id}` ? (
                              <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No lessons in this unit yet</p>
                    <button className="mt-4 px-4 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors">
                      Add First Lesson
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Select a unit to view lessons</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
