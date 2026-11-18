import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CouncilSettingsDoc,
  Language,
  SURVEY_IDS,
  SurveyConfigDoc,
  SurveyId,
  SurveyResponseDoc,
} from '../data/councilData';

// SHA-256 hex digest of initial council admin password (changeable in Admin Panel)
const INITIAL_ADMIN_PASSWORD_HASH =
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

const PARTICIPANT_SESSION_KEY = 'pedkenes4_participant_session_id';
const ADMIN_SESSION_KEY = 'pedkenes4_admin_session_id';

export function getParticipantSessionId(): string {
  try {
    let existing = localStorage.getItem(PARTICIPANT_SESSION_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const rand =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    existing = `ses_${rand.slice(0, 28)}`;
    localStorage.setItem(PARTICIPANT_SESSION_KEY, existing);
    return existing;
  } catch {
    return `ses_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getStoredAdminSessionId(): string | null {
  try {
    const val = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return val && /^[a-zA-Z0-9_-]{8,128}$/.test(val) ? val : null;
  } catch {
    return null;
  }
}

export function setStoredAdminSessionId(sessionId: string | null): void {
  try {
    if (sessionId) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, sessionId);
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toDateOrNull(val: unknown): Date | null {
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

export async function ensureInitialCouncilData(): Promise<void> {
  // Fast-path: if surveys/survey_1 already exists, skip redundant bootstrap reads/writes for 200+ concurrent clients
  try {
    const fastCheck = await getDoc(doc(db, 'surveys', 'survey_1'));
    if (fastCheck.exists()) {
      return;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('permission-denied')) {
      handleFirestoreError(err, OperationType.GET, 'surveys/survey_1');
    }
  }

  // Bootstrap each survey config if missing
  for (const surveyId of SURVEY_IDS) {
    const ref = doc(db, 'surveys', surveyId);
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          surveyId,
          isOpen: true,
          showLiveResults: true,
          showCorrectAnswer: false,
          activeRound: 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('permission-denied')) {
        handleFirestoreError(err, OperationType.WRITE, `surveys/${surveyId}`);
      }
    }
  }

  // Bootstrap council_settings/main if missing
  const settingsRef = doc(db, 'council_settings', 'main');
  try {
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        videoUrl: '',
        videoType: 'none',
        videoTitle: '',
        preventDuplicateVotes: true,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('permission-denied')) {
      handleFirestoreError(err, OperationType.WRITE, 'council_settings/main');
    }
  }

  // Idempotent bootstrap of admin_config/auth (unreadable; create succeeds only if not yet created)
  try {
    await setDoc(doc(db, 'admin_config', 'auth'), {
      passwordHash: INITIAL_ADMIN_PASSWORD_HASH,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Expected permission-denied once admin_config/auth already exists
  }
}

export function subscribeToSurveys(
  onData: (surveys: Record<SurveyId, SurveyConfigDoc>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'surveys';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const map: Partial<Record<SurveyId, SurveyConfigDoc>> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const id = d.id as SurveyId;
        if (SURVEY_IDS.includes(id)) {
          map[id] = {
            surveyId: id,
            isOpen: Boolean(data.isOpen),
            showLiveResults: Boolean(data.showLiveResults),
            showCorrectAnswer: Boolean(data.showCorrectAnswer),
            activeRound: typeof data.activeRound === 'number' ? data.activeRound : 1,
            updatedAt: toDateOrNull(data.updatedAt),
          };
        }
      });

      const complete = {} as Record<SurveyId, SurveyConfigDoc>;
      SURVEY_IDS.forEach((id) => {
        complete[id] = map[id] ?? {
          surveyId: id,
          isOpen: true,
          showLiveResults: true,
          showCorrectAnswer: false,
          activeRound: 1,
          updatedAt: null,
        };
      });
      onData(complete);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToCouncilSettings(
  onData: (settings: CouncilSettingsDoc) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'council_settings/main';
  return onSnapshot(
    doc(db, 'council_settings', 'main'),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onData({
          videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : '',
          videoType: (data.videoType as CouncilSettingsDoc['videoType']) || 'none',
          videoTitle: typeof data.videoTitle === 'string' ? data.videoTitle : '',
          preventDuplicateVotes:
            typeof data.preventDuplicateVotes === 'boolean' ? data.preventDuplicateVotes : true,
          updatedAt: toDateOrNull(data.updatedAt),
        });
      } else {
        onData({
          videoUrl: '',
          videoType: 'none',
          videoTitle: '',
          preventDuplicateVotes: true,
          updatedAt: null,
        });
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToSurveyResponses(
  surveyId: SurveyId,
  activeRound: number,
  onData: (responses: SurveyResponseDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `surveys/${surveyId}/responses`;
  // Query only the active round to stay well below read quotas with 200+ voters across multiple rounds
  const q = query(collection(db, path), where('round', '==', activeRound));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SurveyResponseDoc[] = [];
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const round = typeof data.round === 'number' ? data.round : 1;
        items.push({
          id: d.id,
          surveyId,
          round,
          sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
          selectedOptions: Array.isArray(data.selectedOptions)
            ? data.selectedOptions.filter((x): x is string => typeof x === 'string')
            : [],
          sequence: Array.isArray(data.sequence)
            ? data.sequence.filter((x): x is string => typeof x === 'string')
            : [],
          language: data.language === 'kk' ? 'kk' : 'ru',
          submittedAt: toDateOrNull(data.submittedAt),
        });
      });
      items.sort((a, b) => {
        const ta = a.submittedAt ? a.submittedAt.getTime() : Date.now();
        const tb = b.submittedAt ? b.submittedAt.getTime() : Date.now();
        return tb - ta;
      });
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function hasSessionVotedInRound(
  surveyId: SurveyId,
  activeRound: number,
  sessionId: string
): Promise<boolean> {
  const responseId = `${activeRound}_${sessionId}`;
  const path = `surveys/${surveyId}/responses/${responseId}`;
  try {
    const snap = await getDoc(doc(db, path));
    return snap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function submitSurveyResponse(params: {
  surveyId: SurveyId;
  activeRound: number;
  selectedOptions: string[];
  sequence: string[];
  language: Language;
  preventDuplicateVotes: boolean;
}): Promise<{ status: 'submitted' | 'already_voted' | 'closed' }> {
  const sessionId = getParticipantSessionId();
  const responseId = params.preventDuplicateVotes
    ? `${params.activeRound}_${sessionId}`
    : `${params.activeRound}_${sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const path = `surveys/${params.surveyId}/responses/${responseId}`;
  const docRef = doc(db, path);

  const attemptWrite = async (): Promise<void> => {
    await setDoc(docRef, {
      surveyId: params.surveyId,
      round: params.activeRound,
      sessionId,
      selectedOptions: params.selectedOptions,
      sequence: params.sequence,
      language: params.language,
      submittedAt: serverTimestamp(),
    });
  };

  try {
    if (params.preventDuplicateVotes) {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        return { status: 'already_voted' };
      }
    }

    // Retry transient network / contention errors for up to 200 simultaneous submissions
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await attemptWrite();
        return { status: 'submitted' };
      } catch (writeErr) {
        const wMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
        const isTransient =
          wMsg.includes('unavailable') ||
          wMsg.includes('deadline-exceeded') ||
          wMsg.includes('aborted') ||
          wMsg.includes('resource-exhausted');
        if (isTransient && attempt < 2) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1) + Math.random() * 250));
          continue;
        }
        throw writeErr;
      }
    }

    return { status: 'submitted' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      // Check if survey was closed by admin
      const surveySnap = await getDoc(doc(db, 'surveys', params.surveyId));
      if (surveySnap.exists() && surveySnap.data().isOpen === false) {
        return { status: 'closed' };
      }
      if (params.preventDuplicateVotes) {
        const retryCheck = await getDoc(docRef);
        if (retryCheck.exists()) {
          return { status: 'already_voted' };
        }
      }
    }
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function verifyAdminPassword(
  password: string
): Promise<{ ok: true; sessionId: string } | { ok: false; reason: 'wrong_password' | 'error' }> {
  const hash = await sha256Hex(password);
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  const sessionId = `adm_${rand}`;

  try {
    // Ensure admin_config/auth exists if this is the very first boot
    try {
      await setDoc(doc(db, 'admin_config', 'auth'), {
        passwordHash: INITIAL_ADMIN_PASSWORD_HASH,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // already exists
    }

    await setDoc(doc(db, 'admin_sessions', sessionId), {
      sessionId,
      passwordHash: hash,
      createdAt: serverTimestamp(),
    });
    setStoredAdminSessionId(sessionId);
    return { ok: true, sessionId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return { ok: false, reason: 'wrong_password' };
    }
    console.error('Admin verification error:', err);
    return { ok: false, reason: 'error' };
  }
}

export async function updateSurveyConfig(
  surveyId: SurveyId,
  adminSessionId: string,
  patch: Partial<Pick<SurveyConfigDoc, 'isOpen' | 'showLiveResults' | 'showCorrectAnswer'>>
): Promise<void> {
  const path = `surveys/${surveyId}`;
  try {
    await updateDoc(doc(db, path), {
      ...patch,
      adminSessionId,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function resetSurveyResponses(
  surveyId: SurveyId,
  currentRound: number,
  adminSessionId: string
): Promise<void> {
  const path = `surveys/${surveyId}`;
  try {
    await updateDoc(doc(db, path), {
      activeRound: currentRound + 1,
      adminSessionId,
      updatedAt: serverTimestamp(),
    });

    // Clean up prior-round responses in chunks of 50 (supports 200+ response resets reliably)
    const responsesSnap = await getDocs(collection(db, `surveys/${surveyId}/responses`));
    const staleRefs = responsesSnap.docs
      .filter((d) => {
        const r = d.data().round;
        return typeof r === 'number' && r < currentRound + 1;
      })
      .map((d) => d.ref);

    for (let i = 0; i < staleRefs.length; i += 50) {
      const chunk = staleRefs.slice(i, i + 50);
      await Promise.all(chunk.map((ref) => deleteDoc(ref)));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateCouncilSettings(
  adminSessionId: string,
  patch: Partial<Pick<CouncilSettingsDoc, 'videoUrl' | 'videoType' | 'videoTitle' | 'preventDuplicateVotes'>>
): Promise<void> {
  const path = 'council_settings/main';
  try {
    await updateDoc(doc(db, path), {
      ...patch,
      adminSessionId,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateAdminPassword(
  adminSessionId: string,
  newPassword: string
): Promise<void> {
  const newHash = await sha256Hex(newPassword);
  const path = 'admin_config/auth';
  try {
    await updateDoc(doc(db, path), {
      passwordHash: newHash,
      adminSessionId,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
