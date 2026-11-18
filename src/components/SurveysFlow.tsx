import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  CouncilSettingsDoc,
  Language,
  SURVEYS,
  SurveyConfigDoc,
  SurveyId,
  UI_TEXT,
} from '../data/councilData';
import {
  getParticipantSessionId,
  hasSessionVotedInRound,
  submitSurveyResponse,
} from '../services/councilService';

interface SurveysFlowProps {
  lang: Language;
  activeSurveyId: SurveyId;
  onSelectSurvey: (id: SurveyId) => void;
  surveys: Record<SurveyId, SurveyConfigDoc>;
  councilSettings: CouncilSettingsDoc;
}

const FLOW_STEPS: SurveyId[] = ['survey_1', 'case_1', 'case_2', 'case_3'];

export const SurveysFlow: React.FC<SurveysFlowProps> = ({
  lang,
  activeSurveyId,
  onSelectSurvey,
  surveys,
  councilSettings,
}) => {
  const def = SURVEYS[activeSurveyId];
  const cfg = surveys[activeSurveyId];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRound, setSubmittedRound] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  // Reset local form & check duplicate vote status whenever survey or round changes
  useEffect(() => {
    setSelectedOption(null);
    setErrorMsg(null);
    setSubmittedRound(null);

    let active = true;
    const round = cfg?.activeRound ?? 1;
    if (councilSettings.preventDuplicateVotes) {
      const sesId = getParticipantSessionId();
      hasSessionVotedInRound(activeSurveyId, round, sesId)
        .then((voted) => {
          if (active) setAlreadyVoted(voted);
        })
        .catch(() => {
          if (active) setAlreadyVoted(false);
        });
    } else {
      setAlreadyVoted(false);
    }

    return () => {
      active = false;
    };
  }, [activeSurveyId, cfg?.activeRound, councilSettings.preventDuplicateVotes]);

  const handleSelectOption = (optionId: string) => {
    if (!cfg?.isOpen || alreadyVoted || submittedRound === cfg?.activeRound) return;
    setErrorMsg(null);
    setSelectedOption(optionId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg?.isOpen) {
      setErrorMsg(UI_TEXT.surveyActions.closedNotice[lang]);
      return;
    }

    if (!selectedOption) {
      setErrorMsg(UI_TEXT.surveyActions.selectRequired[lang]);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await submitSurveyResponse({
        surveyId: activeSurveyId,
        activeRound: cfg.activeRound,
        selectedOptions: [selectedOption],
        sequence: [],
        language: lang,
        preventDuplicateVotes: councilSettings.preventDuplicateVotes,
      });

      if (res.status === 'submitted') {
        setSubmittedRound(cfg.activeRound);
        if (councilSettings.preventDuplicateVotes) {
          setAlreadyVoted(true);
        }
      } else if (res.status === 'already_voted') {
        setAlreadyVoted(true);
      } else if (res.status === 'closed') {
        setErrorMsg(UI_TEXT.surveyActions.closedNotice[lang]);
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setErrorMsg(
        lang === 'kk'
          ? 'Серверге жіберу кезінде қате шықты. Қайта байқап көріңіз.'
          : 'Не удалось сохранить ответ на сервере. Проверьте подключение и повторите.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const currentFlowIndex = FLOW_STEPS.indexOf(activeSurveyId);
  const prevStep = currentFlowIndex > 0 ? FLOW_STEPS[currentFlowIndex - 1] : null;
  const nextStep =
    currentFlowIndex >= 0 && currentFlowIndex < FLOW_STEPS.length - 1
      ? FLOW_STEPS[currentFlowIndex + 1]
      : null;

  const isCompleted =
    (submittedRound !== null && submittedRound === cfg?.activeRound) || alreadyVoted;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Stepper Tabs */}
      <div
        role="tablist"
        aria-label="Council surveys"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-white border border-slate-200 rounded-2xl p-2"
      >
        {FLOW_STEPS.map((id, idx) => {
          const s = SURVEYS[id];
          const active = id === activeSurveyId;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectSurvey(id)}
              className={`min-h-[52px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer text-left flex items-center gap-2.5 ${
                active
                  ? 'bg-[#0b1f3a] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0 ${
                  active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-[#0b1f3a]'
                }`}
              >
                {idx + 1}
              </span>
              <span className="leading-snug">{s.shortTitle[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6"
      >
        {/* Question Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono-tabular font-bold text-[#0284c7]">
              {def.title[lang]}
            </span>
            <span
              className={`font-bold ${
                cfg?.isOpen ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {cfg?.isOpen
                ? UI_TEXT.landing.statusOpen[lang]
                : UI_TEXT.landing.statusClosed[lang]}
            </span>
          </div>

          {def.context && (
            <div className="bg-[#f4f7fb] border border-slate-200 rounded-xl p-4 sm:p-5 text-sm sm:text-base text-slate-800 leading-relaxed">
              {def.context[lang]}
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b1f3a] leading-snug text-balance">
            {def.question[lang]}
          </h1>

          {def.instruction && (
            <p className="text-xs sm:text-sm text-slate-600">{def.instruction[lang]}</p>
          )}
        </div>

        {/* Closed Banner */}
        {!cfg?.isOpen && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm font-semibold">
            <Lock className="w-5 h-5 shrink-0 text-amber-700" />
            <span>{UI_TEXT.surveyActions.closedNotice[lang]}</span>
          </div>
        )}

        {/* Submitted Confirmation Banner */}
        {isCompleted && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700 mt-0.5" />
            <div>
              <p className="text-sm font-bold">
                {submittedRound === cfg?.activeRound
                  ? UI_TEXT.surveyActions.submittedTitle[lang]
                  : UI_TEXT.surveyActions.alreadyVoted[lang]}
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {UI_TEXT.surveyActions.submittedNote[lang]}
              </p>
            </div>
          </div>
        )}

        {/* Single-Choice Options Area */}
        <div role="radiogroup" aria-label={def.question[lang]} className="space-y-3">
          {def.options.map((opt) => {
            const checked = selectedOption === opt.id;
            const disabled = !cfg?.isOpen || isCompleted;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full min-h-[56px] text-left p-4 rounded-xl border transition-colors flex items-center gap-3.5 ${
                  disabled ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  checked
                    ? 'bg-sky-50 border-[#0284c7] text-[#0b1f3a]'
                    : 'bg-white border-slate-200 hover:border-sky-300 text-slate-800'
                }`}
              >
                <span
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border text-xs font-bold ${
                    checked
                      ? 'bg-[#0284c7] border-[#0284c7] text-white'
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}
                >
                  {checked ? '✓' : opt.code ?? ''}
                </span>
                <span className="text-sm sm:text-base font-semibold leading-snug">
                  {opt.code && (
                    <span className="font-mono-tabular text-[#0284c7] mr-2">
                      {opt.code}.
                    </span>
                  )}
                  {opt.label[lang]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Validation / Server Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-sm font-semibold"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit & Step Navigation Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {!isCompleted && cfg?.isOpen ? (
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-60 text-white font-bold text-base transition-colors cursor-pointer"
            >
              {submitting
                ? UI_TEXT.surveyActions.submitting[lang]
                : UI_TEXT.surveyActions.submit[lang]}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {prevStep && (
              <button
                type="button"
                onClick={() => onSelectSurvey(prevStep)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f4f7fb] hover:bg-slate-200/70 text-[#0b1f3a] border border-slate-200 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{UI_TEXT.surveyActions.prevStep[lang]}</span>
              </button>
            )}
            {nextStep && (
              <button
                type="button"
                onClick={() => onSelectSurvey(nextStep)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0b1f3a] hover:bg-[#14335c] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{UI_TEXT.surveyActions.nextStep[lang]}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
