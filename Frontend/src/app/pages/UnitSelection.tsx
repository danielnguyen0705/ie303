import { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  Music, 
  Brain, 
  Handshake, 
  Lightbulb, 
  TreePine, 
  Globe, 
  Sparkles, 
  Leaf, 
  Plane, 
  Lock,
  CheckCircle,
  Award,
  Timer,
  Trophy,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router';
import { getAllUnits, getCurriculumOverview } from '@/api';
import type { Unit } from '@/data/mockData';

interface UnitCardProps {
  unit: Unit;
  icon: React.ReactNode;
  colorScheme?: 'primary' | 'secondary' | 'tertiary';
}

function UnitCard({ unit, icon, colorScheme = 'primary' }: UnitCardProps) {
  const colors = {
    primary: 'bg-[#73aaf9]/30 text-[#155ca5]',
    secondary: 'bg-[#fed023]/30 text-[#6f5900]',
    tertiary: 'bg-[#75f39c]/30 text-[#006a35]',
  };

  const isLocked = unit.status === 'locked';
  const isUpcoming = unit.status === 'upcoming';

  return (
    <Link to={isLocked ? '#' : `/unit/${unit.id}`}>
      <div className={`group cursor-pointer ${isLocked ? 'opacity-60' : ''}`}>
        <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-transparent hover:border-[#73aaf9]/20 transition-all duration-300 hover:scale-[1.02] relative">
          {isLocked && (
            <div className="absolute top-4 right-4">
              <Lock className="text-[#67769e]" size={20} />
            </div>
          )}
          
          <div className={`w-16 h-16 ${colors[colorScheme]} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          
          <span className="font-['Lexend'] text-xs uppercase tracking-widest text-[#67769e] mb-2 block">
            Unit {unit.id}
          </span>
          
          <h3 className="text-xl font-bold font-['Nunito'] mb-4 text-[#1e2e51]">{unit.title}</h3>
          
          {unit.description && (
            <p className="text-sm text-[#4c5b81] mb-4">{unit.description}</p>
          )}
          
          {!isLocked && (
            <>
              <div className="h-2 w-full bg-[#dae2ff] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#155ca5] rounded-full transition-all"
                  style={{ width: `${unit.progress}%` }}
                />
              </div>
              {unit.status === 'completed' ? (
                <p className="mt-4 text-sm text-[#006a35] font-bold flex items-center gap-1">
                  <CheckCircle size={16} /> Mastery Achieved
                </p>
              ) : (
                <p className="mt-4 text-sm text-[#4c5b81] font-medium">
                  {isUpcoming ? 'Coming Up Next' : `${unit.progress}% Progress`}
                </p>
              )}
              <p className="text-xs text-[#67769e] mt-1">
                {unit.completedLessons}/{unit.totalLessons} lessons completed
              </p>
            </>
          )}
          
          {isLocked && (
            <p className="mt-4 text-sm text-[#67769e] font-medium">
              Complete previous units to unlock
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function UnitSelection() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [overview, setOverview] = useState({
    totalUnits: 0,
    completedUnits: 0,
    inProgressUnits: 0,
    overallProgress: 0,
    semester1Progress: 0,
    semester2Progress: 0,
  });
  const [selectedSemester, setSelectedSemester] = useState<1 | 2 | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);

      const [unitsResponse, overviewResponse] = await Promise.all([
        getAllUnits(),
        getCurriculumOverview(),
      ]);

      if (unitsResponse.success && overviewResponse.success) {
        setUnits(unitsResponse.data);
        setOverview(overviewResponse.data);
      } else {
        setError('Failed to load units');
      }
    } catch (err) {
      console.error('Error loading units:', err);
      setError('An error occurred while loading units');
    } finally {
      setLoading(false);
    }
  };

  // Icon mapping for units
  const getUnitIcon = (unitId: number) => {
    const icons = [
      <Heart size={32} />,
      <Users size={32} />,
      <Brain size={32} />,
      <Globe size={32} />,
      <Music size={32} />,
      <TreePine size={32} />,
      <Lightbulb size={32} />,
      <Handshake size={32} />,
      <Sparkles size={32} />,
      <Leaf size={32} />,
    ];
    return icons[(unitId - 1) % icons.length];
  };

  // Filter units by semester
  const filteredUnits = selectedSemester === 'all'
    ? units
    : units.filter(u => u.semester === selectedSemester);

  // Color scheme based on semester
  const getColorScheme = (semester: number): 'primary' | 'secondary' | 'tertiary' => {
    return semester === 1 ? 'primary' : 'secondary';
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading curriculum...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={loadUnits}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 pb-24 md:pb-12">
      {/* Header */}
      <section className="space-y-6">
        <div>
          <h1 className="text-5xl font-black text-[#155ca5] tracking-tight mb-2">
            Course Curriculum
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Global Success 11 - English Language Learning
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-[#155ca5]" />
              <div>
                <div className="text-2xl font-black">{overview.completedUnits}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Completed Units
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-8 h-8 text-[#f39c12]" />
              <div>
                <div className="text-2xl font-black">{overview.inProgressUnits}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  In Progress
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-[#27ae60]" />
              <div>
                <div className="text-2xl font-black">{overview.overallProgress}%</div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Overall Progress
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-[#9b59b6]" />
              <div>
                <div className="text-2xl font-black">{overview.totalUnits}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Total Units
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Semester Filter */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm w-fit">
          <button
            onClick={() => setSelectedSemester('all')}
            className={`px-6 py-2 rounded-md font-bold transition-all ${
              selectedSemester === 'all'
                ? 'bg-[#155ca5] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Units
          </button>
          <button
            onClick={() => setSelectedSemester(1)}
            className={`px-6 py-2 rounded-md font-bold transition-all ${
              selectedSemester === 1
                ? 'bg-[#155ca5] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semester 1 ({overview.semester1Progress}%)
          </button>
          <button
            onClick={() => setSelectedSemester(2)}
            className={`px-6 py-2 rounded-md font-bold transition-all ${
              selectedSemester === 2
                ? 'bg-[#155ca5] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semester 2 ({overview.semester2Progress}%)
          </button>
        </div>
      </section>

      {/* Units Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUnits.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            icon={getUnitIcon(unit.id)}
            colorScheme={getColorScheme(unit.semester)}
          />
        ))}
      </section>

      {filteredUnits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No units found for this semester</p>
        </div>
      )}
    </main>
  );
}
