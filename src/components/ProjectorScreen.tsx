import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  EyeOff,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Users,
} from 'lucide-react';
import {
  computeSurveyAnalytics,
  formatTeachersCount,
  Language,
  SURVEY_IDS,
  SURVEYS,
  SurveyConfigDoc,
  SurveyId,
  SurveyResponseDoc,
  UI_TEXT,
} from '../data/councilData';
import { ResultChartCard } from './ResultChartCard';

interface ProjectorScreenProps {
  lang: Language;
  surveys: Record<SurveyId, SurveyConfigDoc>;
  responsesBySurvey: Record<SurveyId, SurveyResponseDoc[]>;
}

export const ProjectorScreen: React.FC<ProjectorScreenProps> = ({
  lang,
  surveys,
  responsesBySurvey,
}) => {
  // Default to 'all' so all 4 questions are shown separately with their individual diagrams
  const [selectedView, setSelectedView] = useState<'all' | SurveyId>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayedSurveyIds = useMemo(
    () => (selectedView === 'all' ? SURVEY_IDS : [selectedView]),
    [selectedView]
  );

  const handleNextQuestion = () => {
    if (selectedView === 'all') {
      setSelectedView(SURVEY_IDS[0]);
      return;
    }
    const idx = SURVEY_IDS.indexOf(selectedView);
    if (idx === SURVEY_IDS.length - 1) {
      setSelectedView('all');
    } else {
      setSelectedView(SURVEY_IDS[idx + 1]);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // fullscreen blocked by browser policy
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? 'min-h-screen bg-[#f4f7fb] p-6 sm:p-10 overflow-y-auto'
          : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'
      } space-y-6`}
    >
      {/* Projector Top Control Bar */}
      <div className="bg-[#0b1f3a] text-white rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white p-1 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/assets/aistudio/unnamed_d306d59c.jpg"
              alt="Эмблема колледжа"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-sky-300 tracking-wide">
              {UI_TEXT.collegeLine1} · {UI_TEXT.collegeLine2}
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-1">
              {UI_TEXT.projector.modeTitle[lang]}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleNextQuestion}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{UI_TEXT.projector.nextQuestion[lang]}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>{UI_TEXT.projector.exitFullscreen[lang]}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>{UI_TEXT.projector.fullscreen[lang]}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Survey / Case Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedView('all')}
          className={`min-h-[68px] p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
            selectedView === 'all'
              ? 'bg-[#0b1f3a] border-[#0b1f3a] text-white'
              : 'bg-white border-slate-200 hover:border-sky-300 text-[#0b1f3a]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold">
            <LayoutGrid className="w-4 h-4 shrink-0 text-[#38bdf8]" />
            <span>
              {lang === 'kk' ? 'Барлық 4 сұрақ' : 'Все 4 вопроса'}
            </span>
          </div>
          <p
            className={`text-[11px] ${
              selectedView === 'all' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {lang === 'kk' ? 'Жеке диаграммалар' : 'Отдельные диаграммы'}
          </p>
        </button>

        {SURVEY_IDS.map((id, idx) => {
          const item = SURVEYS[id];
          const itemCfg = surveys[id];
          const count = responsesBySurvey[id]?.length ?? 0;
          const active = selectedView === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedView(id)}
              className={`min-h-[68px] p-3.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                active
                  ? 'bg-[#0b1f3a] border-[#0b1f3a] text-white'
                  : 'bg-white border-slate-200 hover:border-sky-300 text-[#0b1f3a]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 text-xs">
                <span className="font-bold leading-snug">
                  {idx + 1}. {item.shortTitle[lang]}
                </span>
                <span
                  className={`font-mono-tabular font-bold shrink-0 ${
                    active ? 'text-sky-300' : 'text-[#0284c7]'
                  }`}
                >
                  {count}
                </span>
              </div>
              <p
                className={`text-[11px] ${
                  active ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {itemCfg?.isOpen
                  ? UI_TEXT.landing.statusOpen[lang]
                  : UI_TEXT.landing.statusClosed[lang]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Individual Question Analytics Cards */}
      <div
        className={
          selectedView === 'all'
            ? 'grid grid-cols-1 xl:grid-cols-2 gap-6'
            : 'space-y-6'
        }
      >
        {displayedSurveyIds.map((surveyId) => {
          const def = SURVEYS[surveyId];
          const cfg = surveys[surveyId];
          const responses = responsesBySurvey[surveyId] ?? [];
          const analytics = computeSurveyAnalytics(surveyId, responses);

          const canShowDistribution = !cfg?.isOpen || Boolean(cfg?.showLiveResults);
          const canShowCorrectAnswer = Boolean(cfg?.showCorrectAnswer);

          return (
            <section
              key={surveyId}
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="font-bold text-[#0284c7]">{def.title[lang]}</span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`font-bold ${
                          cfg?.isOpen ? 'text-emerald-700' : 'text-slate-600'
                        }`}
                      >
                        {cfg?.isOpen
                          ? UI_TEXT.landing.statusOpen[lang]
                          : UI_TEXT.landing.statusClosed[lang]}
                      </span>
                    </div>
                    {def.context && (
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {def.context[lang]}
                      </p>
                    )}
                    <h2
                      className={`font-extrabold text-[#0b1f3a] leading-tight text-balance ${
                        selectedView === 'all' ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
                      }`}
                    >
                      {def.question[lang]}
                    </h2>
                  </div>

                  <div className="bg-[#f4f7fb] border border-slate-200 rounded-2xl px-5 py-3.5 shrink-0 text-center sm:text-right">
                    <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[11px] font-bold text-slate-500">
                      <Users className="w-3.5 h-3.5 text-[#0284c7]" />
                      <span>
                        {lang === 'kk' ? 'Қатысқандар' : 'Проголосовало'}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-[#0b1f3a] font-mono-tabular mt-0.5">
                      {analytics.totalRespondents}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {formatTeachersCount(analytics.totalRespondents, lang)}
                    </p>
                  </div>
                </div>

                {/* Individual Chart + Option Counts OR Hidden-Until-Closed Notice */}
                {canShowDistribution ? (
                  <ResultChartCard
                    def={def}
                    analytics={analytics}
                    lang={lang}
                    showCorrectAnswer={canShowCorrectAnswer}
                    projectorMode
                  />
                ) : (
                  <div className="bg-[#f4f7fb] border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <EyeOff className="w-9 h-9 text-[#0284c7] mx-auto" />
                    <h3 className="text-lg font-extrabold text-[#0b1f3a]">
                      {UI_TEXT.projector.votingInProgressTitle[lang]}
                    </h3>
                    <p className="text-sm text-slate-600 max-w-xl mx-auto">
                      {UI_TEXT.projector.votingInProgressDesc[lang]}
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
