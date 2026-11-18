import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  MonitorPlay,
  Printer,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import {
  Language,
  PageRoute,
  SURVEY_IDS,
  SURVEYS,
  SurveyConfigDoc,
  SurveyId,
  SurveyResponseDoc,
  UI_TEXT,
} from '../data/councilData';

const PUBLISHED_FALLBACK_HTTPS_URL =
  'https://ais-pre-rabyhdj5suljo2xgczuqvn-883466040389.asia-northeast1.run.app';

export function getPublicSiteUrl(): string {
  if (typeof window === 'undefined') {
    return PUBLISHED_FALLBACK_HTTPS_URL;
  }
  const { protocol, hostname, origin } = window.location;
  if (
    protocol === 'https:' &&
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.endsWith('.local')
  ) {
    return origin;
  }
  return PUBLISHED_FALLBACK_HTTPS_URL;
}

interface LandingPageProps {
  lang: Language;
  surveys: Record<SurveyId, SurveyConfigDoc>;
  responsesBySurvey: Record<SurveyId, SurveyResponseDoc[]>;
  onStartSurveys: (surveyId?: SurveyId) => void;
  onNavigate: (route: PageRoute) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  surveys,
  responsesBySurvey,
  onStartSurveys,
  onNavigate,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const targetUrl = getPublicSiteUrl();

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: 640,
      margin: 2,
      color: {
        dark: '#0b1f3a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });
    return () => {
      active = false;
    };
  }, [targetUrl]);

  const handleDownloadPng = async () => {
    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, targetUrl, {
        width: 720,
        margin: 2,
        color: { dark: '#0b1f3a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });

      // Branded printable PNG poster (1000 x 1220)
      const poster = document.createElement('canvas');
      poster.width = 1000;
      poster.height = 1220;
      const ctx = poster.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, poster.width, poster.height);

      // Navy Header
      ctx.fillStyle = '#0b1f3a';
      ctx.fillRect(0, 0, poster.width, 220);

      // Draw original college emblem on the left side of the header
      try {
        const emblemImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = '/assets/aistudio/unnamed_d306d59c.jpg';
        });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(42, 42, 136, 136);
        ctx.drawImage(emblemImg, 48, 48, 124, 124);
      } catch {
        // Proceed without emblem if image loading fails
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#93c5fd';
      ctx.font = '700 18px Manrope, sans-serif';
      ctx.fillText(UI_TEXT.collegeLine1, 575, 76, 760);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px Manrope, sans-serif';
      ctx.fillText(UI_TEXT.collegeLine2, 575, 112, 760);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 25px Manrope, sans-serif';
      ctx.fillText(UI_TEXT.councilTitle[lang], 575, 168, 760);

      // QR Code centered
      ctx.drawImage(qrCanvas, 140, 260, 720, 720);

      // Footer Scan Prompt
      ctx.fillStyle = '#0b1f3a';
      ctx.font = '700 28px Manrope, sans-serif';
      ctx.fillText(UI_TEXT.landing.qrTitle[lang], 500, 1045);

      ctx.fillStyle = '#475569';
      ctx.font = '500 20px Manrope, sans-serif';
      ctx.fillText(UI_TEXT.landing.qrSubtitle[lang], 500, 1090);

      ctx.fillStyle = '#0284c7';
      ctx.font = '600 17px monospace';
      ctx.fillText(targetUrl, 500, 1148);

      const pngUrl = poster.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'pedkenes_4_0_qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('QR PNG export failed:', err);
    }
  };

  const handlePrintQr = () => {
    window.print();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard restriction
    }
  };

  const totalVotesAll = SURVEY_IDS.reduce(
    (sum, id) => sum + (responsesBySurvey[id]?.length ?? 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Main 2-Column Hero: Institutional Focus + Unified QR Poster */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column: College & Council Intro + Primary CTA + Instructions */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold tracking-wide text-[#0284c7] mb-3">
              {UI_TEXT.collegeLine1} · {UI_TEXT.collegeLine2}
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0b1f3a] leading-tight tracking-tight text-balance">
              {UI_TEXT.councilTitle[lang]}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-2xl leading-relaxed">
              {UI_TEXT.councilSubtitle[lang]}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => onStartSurveys('survey_1')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-base inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{UI_TEXT.landing.ctaStart[lang]}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('projector')}
                className="min-h-[48px] px-5 py-3 rounded-xl bg-[#f4f7fb] hover:bg-slate-200/70 text-[#0b1f3a] border border-slate-200 font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <MonitorPlay className="w-4 h-4 text-[#0284c7]" />
                <span>{UI_TEXT.landing.ctaProjector[lang]}</span>
              </button>
            </div>
          </div>

          {/* Bilingual Participation Instructions */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h2 className="text-sm font-bold text-[#0b1f3a] mb-3">
              {UI_TEXT.landing.instructionsTitle[lang]}
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
              {UI_TEXT.landing.instructions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span>{item[lang]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Unified QR Card (Also used as Printable Sheet) */}
        <div
          id="qr-print-sheet"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between text-center"
        >
          <div className="w-full">
            <div className="hidden print:block mb-4 text-center">
              <img
                src="/assets/aistudio/unnamed_d306d59c.jpg"
                alt="Эмблема колледжа"
                referrerPolicy="no-referrer"
                className="w-20 h-20 object-contain mx-auto mb-2"
              />
              <p className="text-xs font-bold text-[#0b1f3a]">
                {UI_TEXT.collegeLine1}
              </p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {UI_TEXT.collegeLine2}
              </p>
              <h2 className="text-2xl font-extrabold text-[#0b1f3a] mt-2">
                {UI_TEXT.councilTitle[lang]}
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0284c7] mb-2">
              <QrCode className="w-4 h-4" />
              <span>{UI_TEXT.landing.qrTitle[lang]}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              {UI_TEXT.landing.qrSubtitle[lang]}
            </p>
          </div>

          {/* Crisp QR Code Image */}
          <div className="my-5 p-4 bg-white border border-slate-200 rounded-2xl inline-flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={UI_TEXT.landing.qrTitle[lang]}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
              />
            ) : (
              <div className="w-52 h-52 sm:w-60 sm:h-60 bg-slate-100 rounded-xl animate-pulse" />
            )}
          </div>

          {/* Live Clickable HTTPS URL + PNG/Print Actions */}
          <div className="w-full space-y-3">
            <div className="bg-[#f4f7fb] border border-slate-200 rounded-xl p-3 text-left space-y-2">
              <p className="text-[11px] font-bold text-slate-500">
                {UI_TEXT.landing.qrLinkLabel[lang]}
              </p>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono-tabular text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] underline underline-offset-2 break-all inline-flex items-start gap-1.5"
              >
                <span>{targetUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 no-print" />
              </a>
              <div className="no-print flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0b1f3a] hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{UI_TEXT.landing.copied[lang]}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{UI_TEXT.landing.copyLink[lang]}</span>
                    </>
                  )}
                </button>
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0284c7] hover:bg-sky-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{UI_TEXT.landing.openLink[lang]}</span>
                </a>
              </div>
            </div>

            <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0b1f3a] hover:bg-[#14335c] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{UI_TEXT.landing.downloadPng[lang]}</span>
              </button>
              <button
                type="button"
                onClick={handlePrintQr}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0b1f3a] border border-slate-200 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{UI_TEXT.landing.printQr[lang]}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Council Modules Quick Access */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-[#0b1f3a]">
            {UI_TEXT.landing.modulesTitle[lang]}
          </h2>
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {totalVotesAll > 0
              ? `${UI_TEXT.admin.totalSubmissions[lang]}: ${totalVotesAll}`
              : UI_TEXT.stats.capacityLabel[lang]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SURVEY_IDS.map((id) => {
            const def = SURVEYS[id];
            const cfg = surveys[id];
            const count = responsesBySurvey[id]?.length ?? 0;

            const handleOpen = () => {
              onStartSurveys(id);
            };

            return (
              <div
                key={id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-sky-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 text-xs mb-2">
                    <span className="font-mono-tabular font-bold text-slate-500 leading-snug">
                      0{def.order} · {def.shortTitle[lang]}
                    </span>
                    <span
                      className={`font-bold shrink-0 whitespace-nowrap ${
                        cfg?.isOpen ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {cfg?.isOpen
                        ? UI_TEXT.landing.statusOpen[lang]
                        : UI_TEXT.landing.statusClosed[lang]}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0b1f3a] leading-snug">
                    {def.title[lang]}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {def.question[lang]}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-600 tabular-nums">
                    {count > 0
                      ? `${count} ${UI_TEXT.landing.responsesLabel[lang]}`
                      : `${lang === 'kk' ? 'Раунд' : 'Раунд'} ${cfg?.activeRound ?? 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleOpen}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#f4f7fb] hover:bg-[#0284c7] hover:text-white text-[#0b1f3a] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{UI_TEXT.landing.openModule[lang]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Admin Quick Card */}
          <div className="bg-[#0b1f3a] text-white rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{UI_TEXT.nav.admin[lang]}</span>
              </div>
              <h3 className="text-base font-bold leading-snug">
                {lang === 'kk'
                  ? 'Басқару, статистика және есептерді экспорттау'
                  : 'Управление опросами, аналитика и экспорт'}
              </h3>
              <p className="text-sm text-slate-300 mt-2">
                {lang === 'kk'
                  ? 'Сауалнамаларды ашу/жабу, жауаптарды нөлдеу, Excel/CSV/PDF жүктеу.'
                  : 'Открытие и закрытие опросов, сброс раундов, экспорт в Excel, CSV и PDF.'}
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{UI_TEXT.nav.admin[lang]}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
