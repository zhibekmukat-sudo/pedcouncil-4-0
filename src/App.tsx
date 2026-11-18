import { useEffect, useState } from 'react';
import {
  CouncilSettingsDoc,
  Language,
  PageRoute,
  SURVEY_IDS,
  SurveyConfigDoc,
  SurveyId,
  SurveyResponseDoc,
  UI_TEXT,
} from './data/councilData';
import { testConnection } from './firebase';
import {
  ensureInitialCouncilData,
  getStoredAdminSessionId,
  subscribeToCouncilSettings,
  subscribeToSurveyResponses,
  subscribeToSurveys,
} from './services/councilService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { SurveysFlow } from './components/SurveysFlow';
import { ProjectorScreen } from './components/ProjectorScreen';
import { AdminPanel } from './components/AdminPanel';

const DEFAULT_SURVEYS = SURVEY_IDS.reduce((acc, id) => {
  acc[id] = {
    surveyId: id,
    isOpen: true,
    showLiveResults: true,
    showCorrectAnswer: false,
    activeRound: 1,
    updatedAt: null,
  };
  return acc;
}, {} as Record<SurveyId, SurveyConfigDoc>);

const DEFAULT_RESPONSES: Record<SurveyId, SurveyResponseDoc[]> = {
  survey_1: [],
  case_1: [],
  case_2: [],
  case_3: [],
};

function CouncilAppInner() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pedkenes4_lang');
      return saved === 'kk' || saved === 'ru' ? saved : 'ru';
    } catch {
      return 'ru';
    }
  });

  const [route, setRoute] = useState<PageRoute>('home');
  const [activeSurveyId, setActiveSurveyId] = useState<SurveyId>('survey_1');

  const [surveys, setSurveys] = useState<Record<SurveyId, SurveyConfigDoc>>(DEFAULT_SURVEYS);
  const [councilSettings, setCouncilSettings] = useState<CouncilSettingsDoc>({
    videoUrl: '',
    videoType: 'none',
    videoTitle: '',
    preventDuplicateVotes: true,
    updatedAt: null,
  });
  const [responsesBySurvey, setResponsesBySurvey] =
    useState<Record<SurveyId, SurveyResponseDoc[]>>(DEFAULT_RESPONSES);

  const [adminSessionId, setAdminSessionId] = useState<string | null>(() =>
    getStoredAdminSessionId()
  );
  const [connectionWarning, setConnectionWarning] = useState(false);

  const handleLanguageChange = (next: Language) => {
    setLang(next);
    document.documentElement.lang = next === 'kk' ? 'kk' : 'ru';
    try {
      localStorage.setItem('pedkenes4_lang', next);
    } catch {
      // ignore storage errors
    }
  };

  // Startup connection check + bootstrap + live subscriptions for survey configs & council settings
  useEffect(() => {
    let unsubSurveys: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    (async () => {
      const online = await testConnection();
      if (!online) {
        setConnectionWarning(true);
      }
      await ensureInitialCouncilData();
      unsubSurveys = subscribeToSurveys((data) => setSurveys(data));
      unsubSettings = subscribeToCouncilSettings((settings) => setCouncilSettings(settings));
    })();

    return () => {
      if (unsubSurveys) unsubSurveys();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // Subscribe in real-time to response collections only when viewing Projector or Admin analytics
  // This prevents 200 concurrent participant phones from each subscribing to 1000+ response documents
  useEffect(() => {
    if (route !== 'projector' && route !== 'admin') {
      return;
    }

    const unsubs = SURVEY_IDS.map((id) => {
      const round = surveys[id]?.activeRound ?? 1;
      return subscribeToSurveyResponses(id, round, (items) => {
        setResponsesBySurvey((prev) => ({
          ...prev,
          [id]: items,
        }));
      });
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [
    route,
    surveys.survey_1?.activeRound,
    surveys.case_1?.activeRound,
    surveys.case_2?.activeRound,
    surveys.case_3?.activeRound,
  ]);

  const handleStartSurveys = (surveyId?: SurveyId) => {
    setActiveSurveyId(surveyId ?? 'survey_1');
    setRoute('surveys');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (nextRoute: PageRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-[#0b1f3a]">
      <Header
        lang={lang}
        onChangeLang={handleLanguageChange}
        route={route}
        onNavigate={handleNavigate}
      />

      {connectionWarning && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm font-semibold px-4 py-2.5 text-center">
          {lang === 'kk'
            ? 'Дерекқорға қосылу кідірісі байқалды. Интернет байланысын тексеріңіз.'
            : 'Обнаружена проблема подключения к базе Firestore. Проверьте интернет-соединение.'}
        </div>
      )}

      <main className="flex-1">
        {route === 'home' && (
          <LandingPage
            lang={lang}
            surveys={surveys}
            responsesBySurvey={responsesBySurvey}
            onStartSurveys={handleStartSurveys}
            onNavigate={handleNavigate}
          />
        )}

        {route === 'surveys' && (
          <SurveysFlow
            lang={lang}
            activeSurveyId={activeSurveyId}
            onSelectSurvey={setActiveSurveyId}
            surveys={surveys}
            councilSettings={councilSettings}
          />
        )}

        {route === 'projector' && (
          <ProjectorScreen
            lang={lang}
            surveys={surveys}
            responsesBySurvey={responsesBySurvey}
          />
        )}

        {route === 'admin' && (
          <AdminPanel
            lang={lang}
            surveys={surveys}
            councilSettings={councilSettings}
            responsesBySurvey={responsesBySurvey}
            adminSessionId={adminSessionId}
            onAdminSessionChange={setAdminSessionId}
          />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-5 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span className="font-semibold text-[#0b1f3a] text-center sm:text-left">
            {UI_TEXT.collegeLine1} · {UI_TEXT.collegeLine2}
          </span>
          <span>{UI_TEXT.councilTitle[lang]}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CouncilAppInner />
    </ErrorBoundary>
  );
}
