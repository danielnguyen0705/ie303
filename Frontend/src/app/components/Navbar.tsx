import { Link, useLocation } from "react-router";
import { Flame, Coins, User } from "lucide-react";

export function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black italic text-[#155ca5] tracking-tighter">
          UIFIVE
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-sm">
          <Link
            to="/"
            className={`transition-all duration-200 ${
              isActive("/") 
                ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1" 
                : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
            }`}
          >
            Learn
          </Link>
          <Link
            to="/quests"
            className={`transition-all duration-200 ${
              isActive("/quests") 
                ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1" 
                : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
            }`}
          >
            Quests
          </Link>
          <Link
            to="/leaderboard"
            className={`transition-all duration-200 ${
              isActive("/leaderboard") 
                ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1" 
                : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
            }`}
          >
            Leaderboard
          </Link>
          <Link
            to="/shop"
            className={`transition-all duration-200 ${
              isActive("/shop") 
                ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1" 
                : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
            }`}
          >
            Shop
          </Link>
        </div>

        {/* User Stats & Avatar */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="hidden sm:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full hover:scale-105 transition-all cursor-pointer">
            <Flame className="w-4 h-4 text-[#f39c12]" fill="#f39c12" />
            <span className="font-bold text-sm">15 Days</span>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full hover:scale-105 transition-all cursor-pointer">
            <Coins className="w-4 h-4 text-[#f1c40f]" fill="#f1c40f" />
            <span className="font-bold text-sm">1,250</span>
          </div>

          {/* Avatar with VIP Badge */}
          <Link to="/profile" className="relative group cursor-pointer hover:scale-105 transition-transform">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-md">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-slate-400" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
              VIP
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center py-3 z-50">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-[#155ca5]" : "text-slate-400"}`}>
          <span className="text-xs font-bold">Learn</span>
        </Link>
        <Link to="/quests" className={`flex flex-col items-center gap-1 ${isActive("/quests") ? "text-[#155ca5]" : "text-slate-400"}`}>
          <span className="text-xs font-bold">Quests</span>
        </Link>
        <Link to="/leaderboard" className={`flex flex-col items-center gap-1 ${isActive("/leaderboard") ? "text-[#155ca5]" : "text-slate-400"}`}>
          <span className="text-xs font-bold">Ranks</span>
        </Link>
        <Link to="/shop" className={`flex flex-col items-center gap-1 ${isActive("/shop") ? "text-[#155ca5]" : "text-slate-400"}`}>
          <span className="text-xs font-bold">Shop</span>
        </Link>
      </div>
    </nav>
  );
}
