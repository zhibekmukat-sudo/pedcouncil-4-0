import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  computeSurveyAnalytics,
  formatTeachersCount,
  Language,
  SURVEY_IDS,
  SURVEYS,
  SurveyId,
  SurveyResponseDoc,
  UI_TEXT,
} from '../data/councilData';

function formatTimestamp(date: Date, lang: Language): string {
  return date.toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getFileStamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours()
  )}-${pad(now.getMinutes())}`;
}

export function exportReportCsv(
  responsesBySurvey: Record<SurveyId, SurveyResponseDoc[]>,
  lang: Language
): void {
  const generatedAt = formatTimestamp(new Date(), lang);
  const rows: string[][] = [
    [UI_TEXT.collegeLine1, UI_TEXT.collegeLine2],
    [UI_TEXT.councilTitle[lang]],
    [lang === 'kk' ? 'Есеп қалыптастырылған уақыт' : 'Время формирования отчёта', generatedAt],
    [],
    [
      lang === 'kk' ? 'Бөлім ID' : 'ID опроса/кейса',
      lang === 'kk' ? 'Сұрақ мәтіні' : 'Полный текст вопроса',
      lang === 'kk' ? 'Жауап нұсқасы' : 'Вариант ответа',
      UI_TEXT.stats.votedTeachersCol[lang],
      lang === 'kk' ? 'Пайыз (%)' : 'Процент (%)',
      UI_TEXT.stats.respondents[lang],
      lang === 'kk' ? 'Дұрыс жауап / реттілік' : 'Правильный ответ / последовательность',
    ],
  ];

  SURVEY_IDS.forEach((surveyId) => {
    const def = SURVEYS[surveyId];
    const analytics = computeSurveyAnalytics(surveyId, responsesBySurvey[surveyId] ?? []);
    const fullQuestion = def.context
      ? `${def.context[lang]} ${def.question[lang]}`
      : def.question[lang];

    let correctNote = '';
    if (def.correctOptionId) {
      const opt = def.options.find((o) => o.id === def.correctOptionId);
      correctNote = opt ? `${opt.code ?? opt.id}: ${opt.label[lang]}` : def.correctOptionId;
    } else if (def.correctSequence) {
      correctNote = def.correctSequence
        .map((id, i) => {
          const opt = def.options.find((o) => o.id === id);
          return `${i + 1}) ${opt ? opt.label[lang] : id}`;
        })
        .join(' → ');
    }

    if (def.kind === 'sequence') {
      analytics.optionStats.forEach((opt, optIdx) => {
        const pos = opt.positionCounts ?? [0, 0, 0, 0];
        const posSummary = pos
          .map((c, i) => {
            const p = analytics.totalRespondents > 0 ? (c / analytics.totalRespondents) * 100 : 0;
            return `${lang === 'kk' ? `${i + 1}-қадам` : `Шаг ${i + 1}`}: ${c} (${p.toFixed(1)}%)`;
          })
          .join(', ');
        rows.push([
          surveyId,
          fullQuestion,
          `${optIdx + 1}. ${opt.label[lang]} [${posSummary}]`,
          String(opt.count),
          `${opt.percentage.toFixed(1)}%`,
          String(analytics.totalRespondents),
          correctNote,
        ]);
      });

      if (analytics.sequencePatterns.length === 0) {
        rows.push([
          surveyId,
          fullQuestion,
          lang === 'kk' ? 'Жауаптар жоқ' : 'Нет ответов',
          '0',
          '0.0%',
          String(analytics.totalRespondents),
          correctNote,
        ]);
      } else {
        analytics.sequencePatterns.forEach((pat) => {
          rows.push([
            surveyId,
            fullQuestion,
            `${lang === 'kk' ? 'Реттілік' : 'Последовательность'}: ${pat.label}${
              pat.isCorrect ? (lang === 'kk' ? ' (Дұрыс)' : ' (Верно)') : ''
            }`,
            String(pat.count),
            `${pat.percentage.toFixed(1)}%`,
            String(analytics.totalRespondents),
            correctNote,
          ]);
        });
      }
    } else {
      analytics.optionStats.forEach((opt) => {
        rows.push([
          surveyId,
          fullQuestion,
          `${opt.code ? `${opt.code}. ` : ''}${opt.label[lang]}`,
          String(opt.count),
          `${opt.percentage.toFixed(1)}%`,
          String(analytics.totalRespondents),
          correctNote,
        ]);
      });
    }
  });

  const escapeCsv = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const csvContent =
    '\uFEFF' + rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pedkenes_4_0_report_${getFileStamp()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportReportExcel(
  responsesBySurvey: Record<SurveyId, SurveyResponseDoc[]>,
  lang: Language
): void {
  const wb = XLSX.utils.book_new();
  const generatedAt = formatTimestamp(new Date(), lang);

  const summaryRows: Array<Array<string | number>> = [
    [UI_TEXT.collegeLine1],
    [UI_TEXT.collegeLine2],
    [UI_TEXT.councilTitle[lang]],
    [lang === 'kk' ? 'Есеп қалыптастырылған уақыт' : 'Время формирования отчёта', generatedAt],
    [],
    [
      lang === 'kk' ? 'Сұрақ / Кейс' : 'Опрос / Кейс',
      lang === 'kk' ? 'Сұрақтың толық мәтіні' : 'Полный текст вопроса',
      lang === 'kk' ? 'Нұсқа / Реттілік' : 'Вариант ответа',
      UI_TEXT.stats.votedTeachersCol[lang],
      lang === 'kk' ? 'Пайызы (%)' : 'Процент (%)',
      UI_TEXT.stats.respondents[lang],
      lang === 'kk' ? 'Дұрыс жауап / реттілік' : 'Правильный ответ / последовательность',
    ],
  ];

  SURVEY_IDS.forEach((surveyId) => {
    const def = SURVEYS[surveyId];
    const analytics = computeSurveyAnalytics(surveyId, responsesBySurvey[surveyId] ?? []);
    const fullQuestion = def.context
      ? `${def.context[lang]} ${def.question[lang]}`
      : def.question[lang];

    let correctNote = '—';
    if (def.correctOptionId) {
      const opt = def.options.find((o) => o.id === def.correctOptionId);
      correctNote = opt ? `${opt.code ?? opt.id}. ${opt.label[lang]}` : def.correctOptionId;
    } else if (def.correctSequence) {
      correctNote = def.correctSequence
        .map((id, i) => {
          const opt = def.options.find((o) => o.id === id);
          return `${i + 1}) ${opt ? opt.label[lang] : id}`;
        })
        .join(' → ');
    }

    if (def.kind === 'sequence') {
      analytics.optionStats.forEach((opt, optIdx) => {
        const pos = opt.positionCounts ?? [0, 0, 0, 0];
        const posSummary = pos
          .map((c, i) => {
            const p = analytics.totalRespondents > 0 ? (c / analytics.totalRespondents) * 100 : 0;
            return `${lang === 'kk' ? `${i + 1}-қадам` : `Шаг ${i + 1}`}: ${c} (${p.toFixed(1)}%)`;
          })
          .join(', ');
        summaryRows.push([
          def.title[lang],
          fullQuestion,
          `${optIdx + 1}. ${opt.label[lang]} [${posSummary}]`,
          opt.count,
          Number(opt.percentage.toFixed(1)),
          analytics.totalRespondents,
          correctNote,
        ]);
      });

      if (analytics.sequencePatterns.length === 0) {
        summaryRows.push([
          def.title[lang],
          fullQuestion,
          lang === 'kk' ? 'Жауаптар жоқ' : 'Нет ответов',
          0,
          0,
          analytics.totalRespondents,
          correctNote,
        ]);
      } else {
        analytics.sequencePatterns.forEach((pat) => {
          summaryRows.push([
            def.title[lang],
            fullQuestion,
            `${lang === 'kk' ? 'Реттілік' : 'Последовательность'}: ${pat.label}${
              pat.isCorrect ? (lang === 'kk' ? ' [ДҰРЫС]' : ' [ВЕРНО]') : ''
            }`,
            pat.count,
            Number(pat.percentage.toFixed(1)),
            analytics.totalRespondents,
            correctNote,
          ]);
        });
      }
    } else {
      analytics.optionStats.forEach((opt) => {
        summaryRows.push([
          def.title[lang],
          fullQuestion,
          `${opt.code ? `${opt.code}. ` : ''}${opt.label[lang]}`,
          opt.count,
          Number(opt.percentage.toFixed(1)),
          analytics.totalRespondents,
          correctNote,
        ]);
      });
    }
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 32 },
    { wch: 52 },
    { wch: 46 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 44 },
  ];
  XLSX.utils.book_append_sheet(
    wb,
    wsSummary,
    lang === 'kk' ? 'Қорытынды есеп' : 'Итоговый отчёт'
  );

  // Raw timestamped responses sheet
  const rawRows: Array<Array<string | number>> = [
    [
      'ID',
      lang === 'kk' ? 'Сауалнама' : 'Опрос / Кейс',
      lang === 'kk' ? 'Раунд' : 'Раунд',
      lang === 'kk' ? 'Таңдалған жауап' : 'Ответ / Последовательность',
      lang === 'kk' ? 'Тіл' : 'Язык',
      lang === 'kk' ? 'Жіберілген уақыты' : 'Дата и время',
      lang === 'kk' ? 'Сессия ID' : 'ID сессии',
    ],
  ];

  SURVEY_IDS.forEach((surveyId) => {
    const def = SURVEYS[surveyId];
    (responsesBySurvey[surveyId] ?? []).forEach((r) => {
      const answerStr =
        def.kind === 'sequence'
          ? r.sequence.join(' → ')
          : r.selectedOptions
              .map((id) => {
                const o = def.options.find((opt) => opt.id === id);
                return o ? `${o.code ? `${o.code}. ` : ''}${o.label[lang]}` : id;
              })
              .join('; ');
      rawRows.push([
        r.id,
        def.shortTitle[lang],
        r.round,
        answerStr,
        r.language.toUpperCase(),
        r.submittedAt ? formatTimestamp(r.submittedAt, lang) : '—',
        r.sessionId,
      ]);
    });
  });

  const wsRaw = XLSX.utils.aoa_to_sheet(rawRows);
  wsRaw['!cols'] = [
    { wch: 24 },
    { wch: 22 },
    { wch: 8 },
    { wch: 48 },
    { wch: 8 },
    { wch: 22 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(
    wb,
    wsRaw,
    lang === 'kk' ? 'Жауаптар журналы' : 'Журнал ответов'
  );

  XLSX.writeFile(wb, `pedkenes_4_0_report_${getFileStamp()}.xlsx`);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

export function exportReportPdf(
  responsesBySurvey: Record<SurveyId, SurveyResponseDoc[]>,
  lang: Language
): void {
  const generatedAt = formatTimestamp(new Date(), lang);
  // High-DPI A4 canvas pages (1240 x 1754 at 150 DPI) ensure 100% crisp Cyrillic & Kazakh Unicode glyphs
  const PAGE_W = 1240;
  const PAGE_H = 1754;
  const MARGIN = 72;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const pages: HTMLCanvasElement[] = [];

  const createPage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    pages.push(canvas);
    return ctx;
  };

  let ctx = createPage();
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      ctx = createPage();
      y = MARGIN;
    }
  };

  // Header Banner
  ctx.fillStyle = '#0B1F3A';
  ctx.fillRect(MARGIN, y, CONTENT_W, 138);
  ctx.fillStyle = '#93C5FD';
  ctx.font = '700 16px Manrope, sans-serif';
  ctx.fillText(UI_TEXT.collegeLine1, MARGIN + 28, y + 36);
  ctx.font = '700 17px Manrope, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(UI_TEXT.collegeLine2, MARGIN + 28, y + 66);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 23px Manrope, sans-serif';
  ctx.fillText(UI_TEXT.councilTitle[lang], MARGIN + 28, y + 106);
  y += 160;

  ctx.fillStyle = '#475569';
  ctx.font = '500 17px Manrope, sans-serif';
  ctx.fillText(
    `${lang === 'kk' ? 'Есеп қалыптастырылған уақыт' : 'Время формирования отчёта'}: ${generatedAt}`,
    MARGIN,
    y
  );
  y += 42;

  SURVEY_IDS.forEach((surveyId) => {
    const def = SURVEYS[surveyId];
    const analytics = computeSurveyAnalytics(surveyId, responsesBySurvey[surveyId] ?? []);
    const fullQuestion = def.context
      ? `${def.context[lang]} ${def.question[lang]}`
      : def.question[lang];

    ctx.font = '500 18px Manrope, sans-serif';
    const qLines = wrapText(ctx, fullQuestion, CONTENT_W - 32);
    const estHeight = 120 + qLines.length * 26 + def.options.length * 52 + 80;
    ensureSpace(Math.min(estHeight, 520));

    // Section Title
    ctx.fillStyle = '#0B1F3A';
    ctx.font = '700 22px Manrope, sans-serif';
    ctx.fillText(def.title[lang], MARGIN, y);
    y += 30;

    // Respondent Count
    ctx.fillStyle = '#0284C7';
    ctx.font = '700 17px Manrope, sans-serif';
    ctx.fillText(
      `${UI_TEXT.stats.respondents[lang]}: ${analytics.totalRespondents}`,
      MARGIN,
      y
    );
    y += 28;

    // Question Box
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    const qBoxH = qLines.length * 26 + 24;
    ctx.fillRect(MARGIN, y, CONTENT_W, qBoxH);
    ctx.strokeRect(MARGIN, y, CONTENT_W, qBoxH);
    ctx.fillStyle = '#1E293B';
    ctx.font = '500 18px Manrope, sans-serif';
    qLines.forEach((line, i) => {
      ctx.fillText(line, MARGIN + 16, y + 30 + i * 26);
    });
    y += qBoxH + 18;

    if (def.kind === 'sequence') {
      ensureSpace(160);
      ctx.fillStyle = '#0F172A';
      ctx.font = '700 18px Manrope, sans-serif';
      ctx.fillText(
        `${UI_TEXT.stats.correctMatchRate[lang]}: ${analytics.correctSequenceCount} / ${analytics.totalRespondents} (${analytics.correctSequencePercentage.toFixed(1)}%)`,
        MARGIN,
        y
      );
      y += 28;

      // Per-option positional breakdown in PDF
      analytics.optionStats.forEach((opt, optIdx) => {
        const pos = opt.positionCounts ?? [0, 0, 0, 0];
        const posSummary = pos
          .map((c, i) => {
            const p = analytics.totalRespondents > 0 ? (c / analytics.totalRespondents) * 100 : 0;
            return `${lang === 'kk' ? `№${i + 1}` : `Шаг ${i + 1}`}: ${c} (${p.toFixed(0)}%)`;
          })
          .join('  |  ');
        ctx.font = '600 16px Manrope, sans-serif';
        const optLines = wrapText(ctx, `${optIdx + 1}. ${opt.label[lang]}`, CONTENT_W - 24);
        const boxH = optLines.length * 22 + 38;
        ensureSpace(boxH + 8);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(MARGIN, y, CONTENT_W, boxH);
        ctx.strokeStyle = '#E2E8F0';
        ctx.strokeRect(MARGIN, y, CONTENT_W, boxH);
        ctx.fillStyle = '#0B1F3A';
        optLines.forEach((line, li) => {
          ctx.fillText(line, MARGIN + 12, y + 24 + li * 22);
        });
        ctx.fillStyle = '#0284C7';
        ctx.font = '600 15px Manrope, sans-serif';
        ctx.fillText(posSummary, MARGIN + 12, y + 24 + optLines.length * 22 + 4);
        y += boxH + 8;
      });

      y += 8;
      if (analytics.sequencePatterns.length === 0) {
        ctx.fillStyle = '#64748B';
        ctx.font = '500 17px Manrope, sans-serif';
        ctx.fillText(UI_TEXT.stats.noData[lang], MARGIN, y);
        y += 32;
      } else {
        analytics.sequencePatterns.slice(0, 8).forEach((pat) => {
          ensureSpace(44);
          ctx.fillStyle = pat.isCorrect ? '#ECFDF5' : '#F8FAFC';
          ctx.fillRect(MARGIN, y, CONTENT_W, 38);
          ctx.strokeStyle = '#E2E8F0';
          ctx.strokeRect(MARGIN, y, CONTENT_W, 38);
          ctx.fillStyle = pat.isCorrect ? '#065F46' : '#0F172A';
          ctx.font = '600 17px Manrope, sans-serif';
          ctx.fillText(
            `${pat.label}${pat.isCorrect ? (lang === 'kk' ? ' (Дұрыс)' : ' (Правильно)') : ''}`,
            MARGIN + 14,
            y + 25
          );
          ctx.textAlign = 'right';
          ctx.fillText(
            `${pat.count} (${pat.percentage.toFixed(1)}%)`,
            MARGIN + CONTENT_W - 14,
            y + 25
          );
          ctx.textAlign = 'left';
          y += 44;
        });
      }
    } else {
      analytics.optionStats.forEach((opt) => {
        ctx.font = '500 17px Manrope, sans-serif';
        const optLines = wrapText(
          ctx,
          `${opt.code ? `${opt.code}. ` : ''}${opt.label[lang]}`,
          CONTENT_W - 220
        );
        const rowH = Math.max(44, optLines.length * 24 + 20);
        ensureSpace(rowH + 8);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(MARGIN, y, CONTENT_W, rowH);
        ctx.strokeStyle = '#E2E8F0';
        ctx.strokeRect(MARGIN, y, CONTENT_W, rowH);

        // Progress bar tint
        const barW = Math.min(1, opt.percentage / 100) * (CONTENT_W - 200);
        ctx.fillStyle = opt.isCorrect && def.correctOptionId ? '#DCFCE7' : '#E0F2FE';
        ctx.fillRect(MARGIN + 1, y + 1, barW, rowH - 2);

        ctx.fillStyle = '#0F172A';
        ctx.font = '600 17px Manrope, sans-serif';
        optLines.forEach((line, li) => {
          ctx.fillText(line, MARGIN + 14, y + 26 + li * 24);
        });

        ctx.textAlign = 'right';
        ctx.fillStyle = '#0B1F3A';
        ctx.font = '700 18px Manrope, sans-serif';
        ctx.fillText(
          `${formatTeachersCount(opt.count, lang)}  ·  ${opt.percentage.toFixed(1)}%`,
          MARGIN + CONTENT_W - 14,
          y + 28
        );
        ctx.textAlign = 'left';
        y += rowH + 8;
      });
    }

    if (def.correctOptionId || def.correctSequence) {
      const correctStr = def.correctOptionId
        ? (() => {
            const o = def.options.find((opt) => opt.id === def.correctOptionId);
            return `${UI_TEXT.stats.correctAnswerLabel[lang]}: ${o ? `${o.code}. ${o.label[lang]}` : def.correctOptionId}`;
          })()
        : `${UI_TEXT.stats.correctSequenceLabel[lang]}: ${(def.correctSequence ?? [])
            .map((id, i) => {
              const o = def.options.find((opt) => opt.id === id);
              return `${i + 1}) ${o ? o.label[lang] : id}`;
            })
            .join(' → ')}`;
      ctx.font = '600 16px Manrope, sans-serif';
      const cLines = wrapText(ctx, correctStr, CONTENT_W - 24);
      ensureSpace(cLines.length * 24 + 24);
      ctx.fillStyle = '#065F46';
      cLines.forEach((line, i) => {
        ctx.fillText(line, MARGIN + 6, y + 20 + i * 24);
      });
      y += cLines.length * 24 + 16;
    }

    y += 26;
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  pages.forEach((canvas, idx) => {
    if (idx > 0) pdf.addPage();
    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
  });

  pdf.save(`pedkenes_4_0_report_${getFileStamp()}.pdf`);
}
