import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Language, PageRoute, UI_TEXT } from '../data/councilData';

interface HeaderProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  route: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onChangeLang,
  route,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageRoute; label: string }[] = [
    { id: 'home', label: UI_TEXT.nav.home[lang] },
    { id: 'surveys', label: UI_TEXT.nav.surveys[lang] },
    { id: 'projector', label: UI_TEXT.nav.projector[lang] },
    { id: 'admin', label: UI_TEXT.nav.admin[lang] },
  ];

  const handleNav = (id: PageRoute) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print bg-[#0b1f3a] text-white border-b border-white/10">
      {/* Official Institutional Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3.5 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 rounded-lg"
          >
            {/* Official College Emblem */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white p-1 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/assets/aistudio/unnamed_d306d59c.jpg"
                alt="Эмблема ГКП на ПХВ «Профессионально-технический колледж» акимата г. Астаны"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold tracking-wide text-sky-200 leading-tight">
                {UI_TEXT.collegeLine1}
              </p>
              <p className="text-[11px] sm:text-xs font-bold tracking-wide text-white leading-tight mt-0.5">
                {UI_TEXT.collegeLine2}
              </p>
            </div>
          </button>

          {/* Language Switcher ҚАЗ | РУС + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex items-center p-1 rounded-xl bg-white/10 border border-white/15"
            >
              <button
                type="button"
                onClick={() => onChangeLang('kk')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                  lang === 'kk'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                ҚАЗ
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('ru')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                  lang === 'ru'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                РУС
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Row */}
      <div className="hidden lg:block bg-[#102a4c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6 h-12">
          <span className="text-xs font-semibold text-sky-200 whitespace-nowrap truncate">
            {UI_TEXT.councilTitle[lang]}
          </span>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-sky-500 text-white'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Collapsible Navigation */}
      {mobileMenuOpen && (
        <nav className="lg:hidden bg-[#102a4c] border-t border-white/10 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-4 min-h-[44px] rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                  active
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-100 hover:bg-white/10'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
