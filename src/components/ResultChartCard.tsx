import React from 'react';
import { Award, CheckCircle2, Users } from 'lucide-react';
import {
  formatTeachersCount,
  Language,
  SurveyAnalytics,
  SurveyDefinition,
  UI_TEXT,
} from '../data/councilData';

interface ResultChartCardProps {
  def: SurveyDefinition;
  analytics: SurveyAnalytics;
  lang: Language;
  showCorrectAnswer: boolean;
  projectorMode?: boolean;
}

export const ResultChartCard: React.FC<ResultChartCardProps> = ({
  def,
  analytics,
  lang,
  showCorrectAnswer,
  projectorMode = false,
}) => {
  const { totalRespondents, optionStats } = analytics;

  // Individual SVG Column Diagram dimensions
  const chartW = 680;
  const chartH = 240;
  const padLeft = 46;
  const padRight = 20;
  const padTop = 36;
  const padBottom = 42;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;
  const countCols = optionStats.length;
  const slotW = plotW / Math.max(countCols, 1);
  const barW = Math.min(72, slotW * 0.56);

  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-5">
      {/* Total Voting Participants Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#f4f7fb] border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0b1f3a]">
          <Users className="w-4 h-4 text-[#0284c7] shrink-0" />
          <span>{UI_TEXT.stats.respondents[lang]}:</span>
        </div>
        <span className="font-mono-tabular text-base sm:text-lg font-extrabold text-[#0b1f3a]">
          {formatTeachersCount(totalRespondents, lang)}
        </span>
      </div>

      {/* Individual Question Column Diagram (SVG) */}
      <div className="bg-[#f8fafd] border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-xs font-bold text-[#0b1f3a]">
            {lang === 'kk'
              ? 'Жауап нұсқалары бойынша дауыс беру диаграммасы'
              : 'Индивидуальная диаграмма голосования по вариантам'}
          </p>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {lang === 'kk'
              ? `Барлығы: ${totalRespondents}`
              : `Всего проголосовало: ${totalRespondents}`}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={def.question[lang]}
        >
          {/* Y-Axis Gridlines */}
          {gridTicks.map((tick) => {
            const y = padTop + plotH - (tick / 100) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartW - padRight}
                  y2={y}
                  stroke={tick === 0 ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Option Columns */}
          {optionStats.map((opt, i) => {
            const isMostPopular =
              totalRespondents > 0 && analytics.mostPopularOptionIds.includes(opt.optionId);
            const highlightCorrect = showCorrectAnswer && def.correctOptionId === opt.optionId;

            const fill =
              opt.count === 0
                ? '#cbd5e1'
                : highlightCorrect
                  ? '#059669'
                  : isMostPopular
                    ? '#0284c7'
                    : '#1e3a5f';

            const cx = padLeft + i * slotW + slotW / 2;
            const barX = cx - barW / 2;
            const rawBarH = totalRespondents > 0 ? (opt.percentage / 100) * plotH : 0;
            const barH = opt.count > 0 ? Math.max(6, rawBarH) : 3;
            const barY = padTop + plotH - barH;
            const shortCode = opt.code ?? String(i + 1);

            return (
              <g key={opt.optionId}>
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill={fill}
                />
                {/* Count & Percentage Label Above Column */}
                <text
                  x={cx}
                  y={Math.max(14, barY - 16)}
                  textAnchor="middle"
                  fill="#0b1f3a"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {opt.count} {lang === 'kk' ? 'пед.' : 'пед.'}
                </text>
                <text
                  x={cx}
                  y={Math.max(26, barY - 4)}
                  textAnchor="middle"
                  fill="#0284c7"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {opt.percentage.toFixed(1)}%
                </text>

                {/* X-Axis Option Code Label */}
                <text
                  x={cx}
                  y={padTop + plotH + 22}
                  textAnchor="middle"
                  fill="#0b1f3a"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="Manrope, sans-serif"
                >
                  {lang === 'kk' ? `Нұсқа ${shortCode}` : `Вариант ${shortCode}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Per-Option Breakdown List */}
      <div className="space-y-2.5">
        {optionStats.map((opt) => {
          const isMostPopular =
            totalRespondents > 0 && analytics.mostPopularOptionIds.includes(opt.optionId);
          const highlightCorrect = showCorrectAnswer && def.correctOptionId === opt.optionId;

          return (
            <div
              key={opt.optionId}
              className={`border rounded-xl p-3.5 transition-colors ${
                highlightCorrect
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : isMostPopular
                    ? 'bg-sky-50/60 border-sky-300'
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {opt.code && (
                    <span className="font-mono-tabular text-xs font-bold px-2 py-0.5 rounded bg-[#0b1f3a] text-white shrink-0 mt-0.5">
                      {opt.code}
                    </span>
                  )}
                  <span
                    className={`font-semibold text-[#0b1f3a] leading-snug ${
                      projectorMode ? 'text-base' : 'text-sm'
                    }`}
                  >
                    {opt.label[lang]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0 sm:pl-4 tabular-nums">
                  {highlightCorrect && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      {UI_TEXT.stats.correctAnswerLabel[lang]}
                    </span>
                  )}
                  {!highlightCorrect && isMostPopular && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700">
                      <Award className="w-4 h-4" />
                      {UI_TEXT.stats.mostPopular[lang]}
                    </span>
                  )}
                  <span className="font-bold text-[#0284c7] font-mono-tabular text-sm">
                    {formatTeachersCount(opt.count, lang)}
                  </span>
                  <span className="font-extrabold text-[#0b1f3a] font-mono-tabular text-base">
                    {opt.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg transition-all duration-300 ${
                    highlightCorrect
                      ? 'bg-emerald-600'
                      : isMostPopular
                        ? 'bg-[#0284c7]'
                        : 'bg-[#1e3a5f]'
                  }`}
                  style={{
                    width: `${Math.min(100, opt.count > 0 ? Math.max(opt.percentage, 2) : 0)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Exact Data Table (Admin & Detailed Breakdown) */}
      {!projectorMode && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
                <th className="py-2.5 px-4">
                  {lang === 'kk' ? 'Жауап нұсқасы' : 'Вариант ответа'}
                </th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">
                  {UI_TEXT.stats.votedTeachersCol[lang]}
                </th>
                <th className="py-2.5 px-4 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {optionStats.map((opt) => (
                <tr key={opt.optionId} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-medium text-[#0b1f3a]">
                    {opt.code ? `${opt.code}. ` : ''}
                    {opt.label[lang]}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-tabular font-semibold text-slate-800 whitespace-nowrap">
                    {formatTeachersCount(opt.count, lang)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-tabular font-bold text-[#0b1f3a]">
                    {opt.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f4f7fb] border-t border-slate-200 font-bold text-[#0b1f3a]">
                <td className="py-2.5 px-4">{UI_TEXT.stats.respondents[lang]}</td>
                <td className="py-2.5 px-4 text-right font-mono-tabular whitespace-nowrap">
                  {formatTeachersCount(totalRespondents, lang)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono-tabular">
                  {totalRespondents > 0 ? '100.0%' : '0.0%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Explicit Denominator & Percentage Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <span>{UI_TEXT.stats.singleChoiceNote[lang]}</span>
        <span className="font-bold text-[#0b1f3a] whitespace-nowrap tabular-nums">
          {UI_TEXT.stats.respondents[lang]}: {totalRespondents}
        </span>
      </div>

      {/* Case explanation when revealed */}
      {showCorrectAnswer && def.correctExplanation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-950">
          <span className="font-bold">{UI_TEXT.stats.correctAnswerLabel[lang]}: </span>
          {def.correctExplanation[lang]}
        </div>
      )}
    </div>
  );
};
