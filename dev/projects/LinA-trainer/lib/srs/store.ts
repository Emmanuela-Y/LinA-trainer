'use client';

// Phase 2 – Modul 2 : Persistenter SRS- & Kompetenz-Store (Zustand + LocalStorage)
// Speicherstruktur: Reviews, Flow-Events, Kompetenzlevel
// Integration mit Competence Engine (updateCompetence) + Feedback-Generator.

import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { updateSM2 } from './sm2';
import type { Review, FlowEntry } from '@/lib/types';
import type { MasteryLevel } from '@/lib/competence/engine';

export type Outcome = { ok: boolean; at: number };

type SrsState = {
  reviews: Record<string, Review>;
  flow: FlowEntry[];
  // Aktionen
  review: (id: string, q: 0 | 1 | 2 | 3 | 4, skillId?: string) => void;
  setCompetence: (skillId: string, level: MasteryLevel) => void;
  logFlow: (fluency: number, challenge: number) => void;
  // Neu: Zugriff für Competence Engine / Feedback-Flow
  getReviewsBySkill: (skillId: string) => Outcome[];
  appendOutcome: (skillId: string, ok: boolean) => void;
  getLevel: (skillId: string) => MasteryLevel;
};

// ---------- Helper ----------
const now = () => Date.now();

// Speicher-Key-Konventionen
const KEY_REVIEWS = 'srs.reviews';
const KEY_FLOW = 'srs.flow';

// ---------- Store-Definition ----------
export const useSrs = create<SrsState>((set, get) => ({
  reviews: storage.get(KEY_REVIEWS, {} as Record<string, Review>),
  flow: storage.get(KEY_FLOW, [] as FlowEntry[]),

  /** Klassisches SM-2 Review (numerische Bewertung 0–4) */
  review: (id, q, skillId) => {
    const cur = get().reviews[id] ?? {
      id,
      easiness: 2.5,
      interval: 0,
      repetitions: 0,
      due: now(),
      skillId,
    } as Review;

    const nxt = updateSM2(cur, q, now());
    const all = { ...get().reviews, [id]: nxt };
    set({ reviews: all });
    storage.set(KEY_REVIEWS, all);
  },

  /** Kompetenzlevel direkt setzen (z. B. aus Engine) */
  setCompetence: (skillId, level) => {
    const id = `skill:${skillId}`;
    const cur =
      get().reviews[id] ??
      ({
        id,
        easiness: 2.5,
        interval: 0,
        repetitions: 0,
        due: now(),
        skillId,
        competenceLevel: level,
      } as Review);

    const nxt = { ...cur, competenceLevel: level };
    const all = { ...get().reviews, [id]: nxt };
    set({ reviews: all });
    storage.set(KEY_REVIEWS, all);
  },

  /** Flow-Signale loggen (für spätere Modulation) */
  logFlow: (fluency, challenge) => {
    const entry = { at: now(), fluency, challenge };
    const all = [...get().flow, entry];
    set({ flow: all });
    storage.set(KEY_FLOW, all);
  },

  /** Alle Outcomes (ok/at) eines Skills abrufen */
  getReviewsBySkill: (skillId) => {
    const all = Object.values(get().reviews).filter(
      (r) => r.skillId === skillId && r.due
    );
    return all.map((r) => ({ ok: (r.grade ?? 1) >= 3, at: r.due }));
  },

  /** Neues Outcome anhängen – kompatibel zu Engine */
  appendOutcome: (skillId, ok) => {
    const reviews = get().getReviewsBySkill(skillId);
    const outcome = { ok, at: now() };
    const all = [...reviews, outcome];
    // lightweight persist (keine SM2-Struktur nötig)
    const key = `competence:${skillId}`;
    storage.set(key, all);
  },

  /** Aktuelles Kompetenz-Level (Default 1) */
  getLevel: (skillId) => {
    const id = `skill:${skillId}`;
    const review = get().reviews[id];
    return (review?.competenceLevel ?? 1) as MasteryLevel;
  },
}));

