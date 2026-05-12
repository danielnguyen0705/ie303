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
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#155ca5] to-[#0a3d6b]">
                <Globe className="h-5 w-5 text-white" />
              </div>

              <span className="text-2xl font-black text-[#155ca5]">UIFIVE</span>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-slate-600">
              Learn English through gamified lessons, interactive exercises, and
              daily practice.
            </p>

            <div className="flex items-center gap-2">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#155ca5]/10 text-[#155ca5] transition-all hover:bg-[#155ca5] hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>

              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#155ca5]/10 text-[#155ca5] transition-all hover:bg-[#155ca5] hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>

              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#155ca5]/10 text-[#155ca5] transition-all hover:bg-[#155ca5] hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#155ca5]/10 text-[#155ca5] transition-all hover:bg-[#155ca5] hover:text-white"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Learning */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Learning
            </h3>

            <ul className="space-y-2.5">
              <li>
                <a
                  href="/units"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Browse Units
                </a>
              </li>

              <li>
                <a
                  href="/test/revision"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Practice Tests
                </a>
              </li>

              <li>
                <a
                  href="/leaderboard"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Resources
            </h3>

            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Help Center
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Learning Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900">
              Company
            </h3>

            <ul className="space-y-2.5">
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  About
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Privacy
                </a>
              </li>

              <li>
                <a
                  href="#"
                  className="text-sm text-slate-600 transition-colors hover:text-[#155ca5]"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
            <span>© {currentYear} UIFIVE</span>

            <span className="hidden md:inline">•</span>

            <span className="flex items-center gap-1">
              Made with
              <Heart className="h-4 w-4 fill-current text-red-500" />
              for learners
            </span>
          </div>

          <a
            href="mailto:support@uifive.com"
            className="flex items-center gap-2 text-xs text-slate-500 transition-colors hover:text-[#155ca5] sm:text-sm"
          >
            <Mail className="h-4 w-4" />
            support@uifive.com
          </a>
        </div>
      </div>
    </footer>
  );
}
