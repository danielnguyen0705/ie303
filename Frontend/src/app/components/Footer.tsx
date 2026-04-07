import { Heart, Mail, Facebook, Twitter, Instagram, Youtube, Globe } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t-2 border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#155ca5] to-[#0a3d6b] rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-[#155ca5]">UIFIVE</span>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Learn English the fun way with gamification, interactive exercises, and personalized learning paths.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="#"
                className="w-9 h-9 bg-[#155ca5]/10 hover:bg-[#155ca5] text-[#155ca5] hover:text-white rounded-lg flex items-center justify-center transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-[#155ca5]/10 hover:bg-[#155ca5] text-[#155ca5] hover:text-white rounded-lg flex items-center justify-center transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-[#155ca5]/10 hover:bg-[#155ca5] text-[#155ca5] hover:text-white rounded-lg flex items-center justify-center transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-[#155ca5]/10 hover:bg-[#155ca5] text-[#155ca5] hover:text-white rounded-lg flex items-center justify-center transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Learning Section */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
              Learning
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="/units" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Browse Units
                </a>
              </li>
              <li>
                <a href="/" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/test/revision" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Practice Tests
                </a>
              </li>
              <li>
                <a href="/quests" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Daily Quests
                </a>
              </li>
              <li>
                <a href="/leaderboard" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Learning Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Community Forum
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Press Kit
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>© {currentYear} UIFIVE.</span>
              <span className="hidden md:inline">All rights reserved.</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for learners worldwide
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="mailto:support@uifive.com"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@uifive.com
              </a>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <a href="#" className="hover:text-[#155ca5] transition-colors">
                  Privacy
                </a>
                <span>•</span>
                <a href="#" className="hover:text-[#155ca5] transition-colors">
                  Terms
                </a>
                <span>•</span>
                <a href="#" className="hover:text-[#155ca5] transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar (Optional) */}
      <div className="bg-gradient-to-r from-[#155ca5] to-[#0a3d6b] py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-white">10K+</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">Active Learners</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">50+</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">Units</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">500+</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">95%</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
