import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Loader2, HelpCircle } from 'lucide-react';
import { adminApi } from '@/api';
import type { Question } from '@/data/mockData';

export function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    loadQuestions();
  }, [currentPage, filterType, filterDifficulty]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getAllQuestions({
        page: currentPage,
        pageSize,
        type: filterType === 'all' ? undefined : filterType as any,
        difficulty: filterDifficulty === 'all' ? undefined : filterDifficulty as any,
        search: searchTerm || undefined,
      });

      if (response.success) {
        setQuestions(response.data.data);
        setTotalPages(Math.ceil(response.data.total / pageSize));
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadQuestions();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      setDeletingQuestion(questionId);
      const response = await adminApi.deleteQuestion({ questionId });

      if (response.success) {
        alert('Question deleted successfully');
        loadQuestions();
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question');
    } finally {
      setDeletingQuestion(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-[#27ae60]/10 text-[#27ae60]';
      case 'medium':
        return 'bg-[#f39c12]/10 text-[#f39c12]';
      case 'hard':
        return 'bg-[#e74c3c]/10 text-[#e74c3c]';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getTypeIcon = (type: string) => {
    return <HelpCircle className="w-4 h-4" />;
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-bold">{error}</p>
        <button
          onClick={loadQuestions}
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
          <h1 className="text-2xl font-black text-slate-900">Question Bank</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all exercise and test questions
          </p>
        </div>
        <button className="px-6 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5] focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-[#155ca5] text-white rounded-md font-bold hover:bg-[#005095] transition-colors"
        >
          Search
        </button>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5] focus:border-transparent font-medium"
          >
            <option value="all">All Types</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
            <option value="fill-blank">Fill in Blank</option>
            <option value="matching">Matching</option>
          </select>
        </div>

        <select
          value={filterDifficulty}
          onChange={(e) => {
            setFilterDifficulty(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5] focus:border-transparent font-medium"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200">
          {questions.map((question) => (
            <div
              key={question.id}
              className="p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getTypeIcon(question.type)}
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {question.type.replace('-', ' ')}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getDifficultyColor(
                        question.difficulty
                      )}`}
                    >
                      {question.difficulty}
                    </span>
                    <span className="text-xs text-slate-500">
                      ID: {question.id}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-bold text-slate-900 mb-2">
                      {question.question}
                    </p>
                    {question.options && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`text-sm p-2 rounded ${
                              option === question.correctAnswer
                                ? 'bg-[#27ae60]/10 text-[#27ae60] font-bold'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}. {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {question.lessonId && (
                      <span>Lesson: {question.lessonId}</span>
                    )}
                    {question.tags && question.tags.length > 0 && (
                      <span>Tags: {question.tags.join(', ')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 hover:bg-slate-100 rounded transition-colors">
                    <Edit className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={deletingQuestion === question.id}
                    className="p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    {deletingQuestion === question.id ? (
                      <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="p-12 text-center">
            <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No questions found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-md font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-[#155ca5] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
