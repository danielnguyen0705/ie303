import { Heart, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function FooterSimple() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-xl font-black text-[#155ca5]">UIFIVE</span>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>© {currentYear}</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-3 h-3 text-red-500 fill-current" /> for English learners
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-[#155ca5] transition-colors">
              About
            </a>
            <a href="#" className="hover:text-[#155ca5] transition-colors">
              Help
            </a>
            <a href="#" className="hover:text-[#155ca5] transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-[#155ca5] transition-colors">
              Terms
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="w-8 h-8 bg-slate-100 hover:bg-[#155ca5] text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-slate-100 hover:bg-[#155ca5] text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-slate-100 hover:bg-[#155ca5] text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-8 h-8 bg-slate-100 hover:bg-[#155ca5] text-slate-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
