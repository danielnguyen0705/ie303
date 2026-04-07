import { Timer, CheckCircle, Zap, Coins, Eye, RotateCcw, ArrowRight } from 'lucide-react';

export function TestResults() {
  const skills = [
    { name: 'Listening', percentage: 90, color: '#155ca5' },
    { name: 'Reading', percentage: 75, color: '#155ca5' },
    { name: 'Grammar', percentage: 85, color: '#155ca5' },
    { name: 'Vocabulary', percentage: 100, color: '#006a35' },
  ];

  return (
    <div className="min-h-screen bg-[#f6f6ff] pb-20">
      {/* Main Content */}
      <main className="pt-8 pb-12 px-6 max-w-5xl mx-auto">
        {/* Result Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Score Circle Card */}
          <div className="lg:col-span-5 bg-white rounded-lg p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.01] transition-transform">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-[#fed023] text-[#594700] px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                <span>⭐</span> Excellent!
              </span>
            </div>
            <div className="relative w-56 h-56 flex items-center justify-center">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-[#dae2ff]"
                  cx="112"
                  cy="112"
                  fill="transparent"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="14"
                />
                <circle
                  className="text-[#155ca5] transition-all duration-1000 ease-out"
                  cx="112"
                  cy="112"
                  fill="transparent"
                  r="100"
                  stroke="currentColor"
                  strokeDasharray="628"
                  strokeDashoffset="94"
                  strokeLinecap="round"
                  strokeWidth="14"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-6xl font-['Nunito'] font-black text-[#1e2e51] tracking-tighter">85</span>
                <span className="text-xl font-['Lexend'] font-bold text-[#4c5b81] opacity-50">/ 100</span>
              </div>
            </div>
            <h2 className="mt-6 font-['Nunito'] font-extrabold text-2xl text-[#1e2e51]">Test Kết Thúc!</h2>
            <p className="text-[#4c5b81] font-medium mt-1">Học phần: Unit 8 - Global Warming</p>
          </div>

          {/* Stats Summary Bento */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="bg-[#eef0ff] rounded-lg p-6 flex flex-col justify-between hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#73aaf9]/30 flex items-center justify-center text-[#155ca5]">
                  <Timer size={20} />
                </div>
                <span className="font-['Lexend'] font-bold text-[#4c5b81]">Time</span>
              </div>
              <p className="text-2xl font-['Nunito'] font-black text-[#1e2e51]">
                12:45 <span className="text-sm font-medium opacity-50 uppercase">min</span>
              </p>
            </div>

            <div className="bg-[#eef0ff] rounded-lg p-6 flex flex-col justify-between hover:bg-white transition-colors">
              <div className="flex items-center gap-3 text-[#006a35]">
                <div className="w-10 h-10 rounded-full bg-[#75f39c]/30 flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <span className="font-['Lexend'] font-bold">Accuracy</span>
              </div>
              <p className="text-2xl font-['Nunito'] font-black text-[#1e2e51]">
                92<span className="text-sm font-medium opacity-50">%</span>
              </p>
            </div>

            <div className="bg-[#eef0ff] rounded-lg p-6 flex flex-col justify-between hover:bg-white transition-colors border-l-4 border-[#155ca5]">
              <div className="flex items-center gap-3 text-[#155ca5]">
                <div className="w-10 h-10 rounded-full bg-[#73aaf9]/30 flex items-center justify-center">
                  <Zap size={20} fill="currentColor" />
                </div>
                <span className="font-['Lexend'] font-bold">XP Gained</span>
              </div>
              <p className="text-3xl font-['Nunito'] font-black text-[#1e2e51]">+50⚡</p>
            </div>

            <div className="bg-[#eef0ff] rounded-lg p-6 flex flex-col justify-between hover:bg-white transition-colors border-l-4 border-[#6f5900]">
              <div className="flex items-center gap-3 text-[#6f5900]">
                <div className="w-10 h-10 rounded-full bg-[#fed023]/30 flex items-center justify-center">
                  <Coins size={20} />
                </div>
                <span className="font-['Lexend'] font-bold">Coins</span>
              </div>
              <p className="text-3xl font-['Nunito'] font-black text-[#1e2e51]">+25💰</p>
            </div>
          </div>
        </div>

        {/* Skill Breakdown Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#eef0ff] rounded-lg p-8 mb-8">
          <div>
            <h3 className="font-['Nunito'] font-extrabold text-2xl text-[#1e2e51] mb-6">Skill Breakdown</h3>
            <div className="space-y-6">
              {skills.map((skill) => (
                <div key={skill.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-[#1e2e51]">{skill.name}</span>
                    <span className="text-[#4c5b81] font-mono">{skill.percentage}%</span>
                  </div>
                  <div className="h-3 w-full bg-[#d1dcff] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${skill.percentage}%`, backgroundColor: skill.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center relative">
            {/* Radar Chart Visualization */}
            <div className="w-64 h-64 bg-white rounded-full shadow-xl flex items-center justify-center p-4 relative">
              <div className="w-full h-full relative">
                {/* Pentagon shapes */}
                <div className="absolute inset-0 border-2 border-[#155ca5]/20" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
                <div className="absolute inset-0 border-2 border-[#155ca5]/20 scale-[0.8]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
                <div className="absolute inset-0 border-2 border-[#155ca5]/20 scale-[0.6]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
                <div className="absolute inset-0 border-2 border-[#155ca5]/20 scale-[0.4]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
                <div className="absolute inset-0 bg-[#155ca5]/40 scale-[0.85]" style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="font-mono text-xs text-[#155ca5] font-bold">PROFILE</p>
                  <p className="font-['Nunito'] font-black text-[#1e2e51]">BALANCED</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Table */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#dae2ff]">
                <th className="pb-4 font-['Lexend'] font-bold text-[#4c5b81] text-sm">SKILL AREA</th>
                <th className="pb-4 font-['Lexend'] font-bold text-[#4c5b81] text-sm">SCORE</th>
                <th className="pb-4 font-['Lexend'] font-bold text-[#4c5b81] text-sm">SPEED</th>
                <th className="pb-4 font-['Lexend'] font-bold text-[#4c5b81] text-sm text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2ff]/50">
              <tr>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[#73aaf9]">📝</span>
                    <span className="font-['Nunito'] font-bold">Writing</span>
                  </div>
                </td>
                <td className="py-4 font-mono">18/20</td>
                <td className="py-4 text-[#4c5b81] text-sm">Fast</td>
                <td className="py-4 text-right">
                  <span className="bg-[#75f39c]/10 text-[#006a35] px-3 py-1 rounded-full text-xs font-bold">Mastered</span>
                </td>
              </tr>
              <tr>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[#73aaf9]">🎤</span>
                    <span className="font-['Nunito'] font-bold">Speaking</span>
                  </div>
                </td>
                <td className="py-4 font-mono">14/20</td>
                <td className="py-4 text-[#4c5b81] text-sm">Average</td>
                <td className="py-4 text-right">
                  <span className="bg-[#155ca5]/10 text-[#155ca5] px-3 py-1 rounded-full text-xs font-bold">Improving</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="flex-1 max-w-xs group flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 border-[#155ca5] text-[#155ca5] font-bold hover:bg-[#155ca5] hover:text-white transition-all">
            <Eye size={20} />
            Xem lại bài
          </button>
          <button className="flex-1 max-w-xs group flex items-center justify-center gap-3 py-4 px-6 rounded-lg border-2 border-[#9eacd7]/20 text-[#4c5b81] font-bold hover:bg-[#eef0ff] transition-all">
            <RotateCcw size={20} />
            Làm lại
          </button>
          <button className="flex-[1.5] max-w-sm flex items-center justify-center gap-3 py-4 px-10 rounded-lg bg-gradient-to-r from-[#155ca5] to-[#73aaf9] text-white font-['Nunito'] font-black text-lg shadow-xl shadow-[#155ca5]/30 hover:scale-105 transition-all">
            Tiếp tục
            <ArrowRight size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}
