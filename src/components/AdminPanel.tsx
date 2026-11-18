import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Lock,
  LockOpen,
  LogOut,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  computeSurveyAnalytics,
  CouncilSettingsDoc,
  formatTeachersCount,
  Language,
  MAX_COUNCIL_CAPACITY,
  SURVEY_IDS,
  SURVEYS,
  SurveyConfigDoc,
  SurveyId,
  SurveyResponseDoc,
  UI_TEXT,
} from '../data/councilData';
import {
  resetSurveyResponses,
  setStoredAdminSessionId,
  updateAdminPassword,
  updateCouncilSettings,
  updateSurveyConfig,
  verifyAdminPassword,
} from '../services/councilService';
import {
  exportReportCsv,
  exportReportExcel,
  exportReportPdf,
} from '../utils/exportReports';
import { ResultChartCard } from './ResultChartCard';

interface AdminPanelProps {
  lang: Language;
  surveys: Record<SurveyId, SurveyConfigDoc>;
  councilSettings: CouncilSettingsDoc;
  responsesBySurvey: Record<SurveyId, SurveyResponseDoc[]>;
  adminSessionId: string | null;
  onAdminSessionChange: (sessionId: string | null) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  lang,
  surveys,
  councilSettings,
  responsesBySurvey,
  adminSessionId,
  onAdminSessionChange,
}) => {
  // Password-only auth gate state
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard filters & UI state
  const [activeTab, setActiveTab] = useState<SurveyId | 'all'>('all');
  const [logFilter, setLogFilter] = useState<SurveyId | 'all'>('all');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [resetTarget, setResetTarget] = useState<SurveyId | 'all' | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Settings controls
  const [newPasswordDraft, setNewPasswordDraft] = useState('');
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setAuthLoading(true);
    setAuthError(null);
    const res = await verifyAdminPassword(passwordInput);
    setAuthLoading(false);

    if (res.ok) {
      setPasswordInput('');
      onAdminSessionChange(res.sessionId);
    } else {
      setAuthError(
        res.reason === 'wrong_password'
          ? UI_TEXT.admin.wrongPassword[lang]
          : lang === 'kk'
            ? 'Серверге қосылу қатесі. Қайта байқап көріңіз.'
            : 'Ошибка подключения к серверу. Попробуйте снова.'
      );
    }
  };

  const handleLogout = () => {
    setStoredAdminSessionId(null);
    onAdminSessionChange(null);
  };

  // Compute global KPIs
  const { totalSubmissions, uniqueParticipantsCount, openCount, allLogs } = useMemo(() => {
    const sessionSet = new Set<string>();
    let total = 0;
    const logs: SurveyResponseDoc[] = [];

    SURVEY_IDS.forEach((id) => {
      const list = responsesBySurvey[id] ?? [];
      total += list.length;
      list.forEach((r) => {
        if (r.sessionId) sessionSet.add(r.sessionId);
        logs.push(r);
      });
    });

    logs.sort((a, b) => {
      const ta = a.submittedAt ? a.submittedAt.getTime() : 0;
      const tb = b.submittedAt ? b.submittedAt.getTime() : 0;
      return tb - ta;
    });

    const open = SURVEY_IDS.filter((id) => surveys[id]?.isOpen).length;

    return {
      totalSubmissions: total,
      uniqueParticipantsCount: sessionSet.size,
      openCount: open,
      allLogs: logs,
    };
  }, [responsesBySurvey, surveys]);

  const handleToggleSurveyFlag = async (
    surveyId: SurveyId,
    field: 'isOpen' | 'showLiveResults' | 'showCorrectAnswer',
    value: boolean
  ) => {
    if (!adminSessionId) return;
    setBusyAction(`${surveyId}_${field}`);
    try {
      await updateSurveyConfig(surveyId, adminSessionId, { [field]: value });
    } catch (err) {
      console.error('Failed to update survey flag:', err);
      // Session might be expired or invalid if password was changed elsewhere
      setAuthError(
        lang === 'kk'
          ? 'Әкімші сессиясы жарамсыз. Қайта кіріңіз.'
          : 'Сессия администратора недействительна. Войдите снова.'
      );
      handleLogout();
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmReset = async () => {
    if (!adminSessionId || !resetTarget) return;
    setResetLoading(true);
    try {
      const targets = resetTarget === 'all' ? SURVEY_IDS : [resetTarget];
      for (const id of targets) {
        await resetSurveyResponses(id, surveys[id]?.activeRound ?? 1, adminSessionId);
      }
      setResetTarget(null);
    } catch (err) {
      console.error('Reset failed:', err);
      handleLogout();
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleDuplicateProtection = async () => {
    if (!adminSessionId) return;
    setBusyAction('dup_toggle');
    setSettingsNotice(null);
    try {
      await updateCouncilSettings(adminSessionId, {
        preventDuplicateVotes: !councilSettings.preventDuplicateVotes,
      });
      setSettingsNotice(
        lang === 'kk' ? 'Баптаулар сақталды.' : 'Настройки сохранены в облачной базе.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSessionId || newPasswordDraft.trim().length < 6) return;
    setBusyAction('password');
    setSettingsNotice(null);
    try {
      await updateAdminPassword(adminSessionId, newPasswordDraft.trim());
      setNewPasswordDraft('');
      setSettingsNotice(
        lang === 'kk' ? 'Әкімші құпия сөзі жаңартылды.' : 'Пароль администратора обновлён.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  // Password-only login screen (NO login/username field)
  if (!adminSessionId) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
        <form
          onSubmit={handleLogin}
          className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="w-12 h-12 rounded-xl bg-[#0b1f3a] text-sky-300 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0b1f3a]">
              {UI_TEXT.admin.title[lang]}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {UI_TEXT.admin.passwordPrompt[lang]}
            </p>
          </div>

          <div>
            <label htmlFor="admin-password-input" className="sr-only">
              {UI_TEXT.admin.passwordPlaceholder[lang]}
            </label>
            <input
              id="admin-password-input"
              type="password"
              required
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={UI_TEXT.admin.passwordPlaceholder[lang]}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-300 text-base text-[#0b1f3a] focus:outline-none focus:border-[#0284c7]"
            />
          </div>

          {authError && (
            <div
              role="alert"
              className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5"
            >
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0b1f3a] hover:bg-[#14335c] disabled:opacity-60 text-white font-bold text-base transition-colors cursor-pointer"
          >
            {authLoading
              ? lang === 'kk'
                ? 'Тексерілуде...'
                : 'Проверка...'
              : UI_TEXT.admin.unlockBtn[lang]}
          </button>
        </form>
      </div>
    );
  }

  const displayedSurveyIds = activeTab === 'all' ? SURVEY_IDS : [activeTab];
  const allFilteredLogs =
    logFilter === 'all' ? allLogs : allLogs.filter((l) => l.surveyId === logFilter);
  const filteredLogs = showAllLogs ? allFilteredLogs : allFilteredLogs.slice(0, 200);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Admin Top Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0b1f3a] text-sky-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f3a]">
              {UI_TEXT.admin.title[lang]}
            </h1>
            <p className="text-xs text-slate-500">
              {UI_TEXT.councilTitle[lang]}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportReportExcel(responsesBySurvey, lang)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => exportReportCsv(responsesBySurvey, lang)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={() => exportReportPdf(responsesBySurvey, lang)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0b1f3a] hover:bg-[#14335c] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setResetTarget('all')}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{UI_TEXT.admin.resetAll[lang]}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{UI_TEXT.admin.logout[lang]}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500">
            {UI_TEXT.stats.respondents[lang]}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-[#0b1f3a] font-mono-tabular">
              {uniqueParticipantsCount}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono-tabular">
              / {MAX_COUNCIL_CAPACITY}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {UI_TEXT.stats.capacityLabel[lang]}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500">
            {UI_TEXT.admin.totalSubmissions[lang]}
          </p>
          <p className="text-3xl font-extrabold text-[#0284c7] font-mono-tabular mt-1">
            {totalSubmissions}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500">
            {UI_TEXT.admin.openPolls[lang]}
          </p>
          <p className="text-3xl font-extrabold text-emerald-700 font-mono-tabular mt-1">
            {openCount} / {SURVEY_IDS.length}
          </p>
        </div>
      </div>

      {/* Filter Tabs for Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 bg-white border border-slate-200 rounded-2xl p-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors text-left flex items-center justify-between gap-2 ${
            activeTab === 'all'
              ? 'bg-[#0b1f3a] text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>{lang === 'kk' ? 'Барлық бөлімдер' : 'Все опросы и кейсы'}</span>
        </button>
        {SURVEY_IDS.map((id, idx) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors text-left flex items-center justify-between gap-2 ${
              activeTab === id
                ? 'bg-[#0b1f3a] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="leading-snug">
              {idx + 1}. {SURVEYS[id].shortTitle[lang]}
            </span>
            <span className="font-mono-tabular shrink-0 opacity-80">
              ({responsesBySurvey[id]?.length ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Per-Survey / Per-Case Control & Analytics Cards */}
      <div className="space-y-6">
        {displayedSurveyIds.map((surveyId) => {
          const def = SURVEYS[surveyId];
          const cfg = surveys[surveyId];
          const responses = responsesBySurvey[surveyId] ?? [];
          const analytics = computeSurveyAnalytics(surveyId, responses);

          return (
            <section
              key={surveyId}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5"
            >
              {/* Header + Controls */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono-tabular font-bold text-[#0284c7]">
                      {surveyId}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono-tabular text-slate-500">
                      {lang === 'kk' ? `Раунд ${cfg?.activeRound ?? 1}` : `Раунд ${cfg?.activeRound ?? 1}`}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={`font-bold ${
                        cfg?.isOpen ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {cfg?.isOpen
                        ? UI_TEXT.landing.statusOpen[lang]
                        : UI_TEXT.landing.statusClosed[lang]}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-bold text-[#0b1f3a] tabular-nums">
                      {UI_TEXT.stats.respondents[lang]}: {formatTeachersCount(analytics.totalRespondents, lang)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0b1f3a]">
                    {def.title[lang]}
                  </h2>
                  <p className="text-sm text-slate-600">{def.question[lang]}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyAction === `${surveyId}_isOpen`}
                    onClick={() =>
                      handleToggleSurveyFlag(surveyId, 'isOpen', !cfg?.isOpen)
                    }
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                      cfg?.isOpen
                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {cfg?.isOpen ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{UI_TEXT.admin.closePollBtn[lang]}</span>
                      </>
                    ) : (
                      <>
                        <LockOpen className="w-3.5 h-3.5" />
                        <span>{UI_TEXT.admin.openPollBtn[lang]}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={busyAction === `${surveyId}_showLiveResults`}
                    onClick={() =>
                      handleToggleSurveyFlag(
                        surveyId,
                        'showLiveResults',
                        !cfg?.showLiveResults
                      )
                    }
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                      cfg?.showLiveResults
                        ? 'bg-sky-50 border-sky-200 text-sky-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {cfg?.showLiveResults ? (
                      <Eye className="w-3.5 h-3.5 text-[#0284c7]" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                    <span>{UI_TEXT.admin.liveResultsToggle[lang]}</span>
                  </button>

                  {(def.correctOptionId || def.correctSequence) && (
                    <button
                      type="button"
                      disabled={busyAction === `${surveyId}_showCorrectAnswer`}
                      onClick={() =>
                        handleToggleSurveyFlag(
                          surveyId,
                          'showCorrectAnswer',
                          !cfg?.showCorrectAnswer
                        )
                      }
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                        cfg?.showCorrectAnswer
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{UI_TEXT.admin.correctAnswerToggle[lang]}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setResetTarget(surveyId)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs font-bold text-red-700 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{UI_TEXT.admin.resetSingle[lang]}</span>
                  </button>
                </div>
              </div>

              {/* Analytics Chart & Table (Admin always sees full analytics + correct answers) */}
              <ResultChartCard
                def={def}
                analytics={analytics}
                lang={lang}
                showCorrectAnswer={Boolean(def.correctOptionId || def.correctSequence)}
              />
            </section>
          );
        })}
      </div>

      {/* Live Response Timestamp Log */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#0b1f3a]">
              {UI_TEXT.admin.responseLogTitle[lang]}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {lang === 'kk'
                ? `Көрсетілді: ${filteredLogs.length} / ${allFilteredLogs.length}`
                : `Показано записей: ${filteredLogs.length} из ${allFilteredLogs.length}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {allFilteredLogs.length > 200 && (
              <button
                type="button"
                onClick={() => setShowAllLogs((v) => !v)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-[#f4f7fb] text-xs font-bold text-[#0b1f3a] cursor-pointer"
              >
                {showAllLogs
                  ? lang === 'kk'
                    ? 'Алғашқы 200-ді көрсету'
                    : 'Показать первые 200'
                  : lang === 'kk'
                    ? `Барлығын көрсету (${allFilteredLogs.length})`
                    : `Показать все (${allFilteredLogs.length})`}
              </button>
            )}
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as SurveyId | 'all')}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0b1f3a] bg-white"
            >
              <option value="all">
                {lang === 'kk' ? 'Барлық сауалнамалар' : 'Все опросы и кейсы'}
              </option>
              {SURVEY_IDS.map((id) => (
                <option key={id} value={id}>
                  {SURVEYS[id].shortTitle[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">{UI_TEXT.stats.noData[lang]}</p>
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3.5">
                    {lang === 'kk' ? 'Уақыты' : 'Дата и время'}
                  </th>
                  <th className="py-2.5 px-3.5">
                    {lang === 'kk' ? 'Бөлім' : 'Опрос / Кейс'}
                  </th>
                  <th className="py-2.5 px-3.5">
                    {lang === 'kk' ? 'Жауап' : 'Выбранный ответ'}
                  </th>
                  <th className="py-2.5 px-3.5">
                    {lang === 'kk' ? 'Тіл' : 'Язык'}
                  </th>
                  <th className="py-2.5 px-3.5">
                    {lang === 'kk' ? 'Сессия' : 'ID сессии'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((row) => {
                  const def = SURVEYS[row.surveyId];
                  const answerText =
                    def.kind === 'sequence'
                      ? row.sequence
                          .map((stepId, posIdx) => {
                            const o = def.options.find((x) => x.id === stepId);
                            const num = stepId.replace('step_', '');
                            return o
                              ? `${posIdx + 1}) [${num}] ${o.label[lang]}`
                              : `${posIdx + 1}) ${stepId}`;
                          })
                          .join(' → ')
                      : row.selectedOptions
                          .map((optId) => {
                            const o = def.options.find((x) => x.id === optId);
                            return o ? `${o.code ? `${o.code}. ` : ''}${o.label[lang]}` : optId;
                          })
                          .join('; ');

                  return (
                    <tr key={`${row.surveyId}_${row.id}`} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3.5 font-mono-tabular text-slate-600 whitespace-nowrap">
                        {row.submittedAt
                          ? row.submittedAt.toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU')
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#0b1f3a] whitespace-nowrap">
                        {def.shortTitle[lang]}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-800">{answerText}</td>
                      <td className="py-2.5 px-3.5 font-mono-tabular uppercase text-slate-500">
                        {row.language}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono-tabular text-slate-500">
                        {row.sessionId.slice(0, 14)}…
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Council Global Settings & Security */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-extrabold text-[#0b1f3a]">
            {lang === 'kk'
              ? 'Кеңес баптаулары (дауыс беруді қорғау)'
              : 'Настройки педсовета (защита голосования)'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {lang === 'kk'
              ? 'Бір құрылғыдан немесе браузер сессиясынан қайта дауыс беруді шектеу параметрі.'
              : 'Ограничивает повторную отправку ответа с одного устройства в рамках активного раунда.'}
          </p>

          <div className="flex items-center justify-between gap-3 bg-[#f4f7fb] border border-slate-200 rounded-xl p-3.5">
            <div>
              <p className="text-sm font-bold text-[#0b1f3a]">
                {lang === 'kk'
                  ? 'Қайта дауыс беруден қорғау'
                  : 'Защита от повторного голосования (1 сессия = 1 ответ)'}
              </p>
            </div>
            <button
              type="button"
              disabled={busyAction === 'dup_toggle'}
              onClick={handleToggleDuplicateProtection}
              className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                councilSettings.preventDuplicateVotes
                  ? 'bg-[#0284c7] text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {councilSettings.preventDuplicateVotes
                ? lang === 'kk'
                  ? 'Қосулы'
                  : 'Включена'
                : lang === 'kk'
                  ? 'Өшірулі'
                  : 'Выключена'}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleChangePassword}
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <h2 className="text-base font-extrabold text-[#0b1f3a]">
            {lang === 'kk'
              ? 'Әкімші құпия сөзін өзгерту'
              : 'Смена пароля администратора'}
          </h2>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {lang === 'kk'
                ? 'Жаңа құпия сөз (кемінде 4 таңба)'
                : 'Новый пароль (минимум 4 символа)'}
            </label>
            <input
              type="password"
              minLength={4}
              required
              value={newPasswordDraft}
              onChange={(e) => setNewPasswordDraft(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#0b1f3a]"
            />
          </div>
          <button
            type="submit"
            disabled={busyAction === 'password' || newPasswordDraft.trim().length < 4}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            {lang === 'kk' ? 'Құпия сөзді жаңарту' : 'Обновить пароль'}
          </button>
          {settingsNotice && (
            <p className="text-xs font-bold text-emerald-700">{settingsNotice}</p>
          )}
        </form>
      </section>

      {/* Mandatory Reset Confirmation Modal */}
      {resetTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0b1f3a]">
                {UI_TEXT.admin.resetConfirmTitle[lang]}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {UI_TEXT.admin.resetConfirmBody[lang]}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={resetLoading}
                onClick={() => setResetTarget(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
              >
                {UI_TEXT.admin.cancel[lang]}
              </button>
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleConfirmReset}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
              >
                {resetLoading
                  ? lang === 'kk'
                    ? 'Нөлденуде...'
                    : 'Сброс...'
                  : UI_TEXT.admin.confirmReset[lang]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
