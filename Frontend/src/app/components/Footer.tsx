import {
  Heart,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t-2 border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#155ca5] to-[#0a3d6b] rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-[#155ca5]">UIFIVE</span>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:mb-4">
              Learn English the fun way with gamification, interactive
              exercises, and personalized learning paths.
            </p>
            <div className="flex flex-wrap items-center gap-2">
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
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-900 sm:mb-4">
              Learning
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a
                  href="/units"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Browse Units
                </a>
              </li>
              <li>
                <a
                  href="/"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/test/revision"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Practice Tests
                </a>
              </li>
              <li>
                <a
                  href="/quests"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Daily Quests
                </a>
              </li>
              <li>
                <a
                  href="/leaderboard"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-900 sm:mb-4">
              Resources
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Learning Guide
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Community Forum
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-900 sm:mb-4">
              Company
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Press Kit
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 hover:text-[#155ca5] transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-slate-200 pt-6 sm:mt-12 sm:pt-8">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 sm:text-sm">
              <span>© {currentYear} UIFIVE.</span>
              <span className="hidden md:inline">All rights reserved.</span>
              <span className="flex flex-wrap items-center gap-1">
                Made with{" "}
                <Heart className="w-4 h-4 text-red-500 fill-current" /> for
                learners worldwide
              </span>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 md:w-auto">
              <a
                href="mailto:support@uifive.com"
                className="flex min-w-0 items-center gap-2 text-xs text-slate-600 transition-colors hover:text-[#155ca5] sm:text-sm"
              >
                <Mail className="w-4 h-4" />
                <span className="break-all sm:break-normal">
                  support@uifive.com
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
