// lib/competence/matrix.ts
import { byId, SKILLS, type Skill } from './skills';
import { localStore as store } from '@/lib/srs/store';
import { updateCompetence, type MasteryLevel, toSnapshot } from './engine';

export type SkillRow = {
  id: string;
  title: string;
  topic: string;
  level: MasteryLevel;
  successRate: number;
  reviewCount: number;
  lastReviewAt: number;
};

export function computeSkillMatrix(): SkillRow[] {
  return SKILLS.map((s: Skill) => {
    const outcomes = store.getReviews(s.id).map(o => ({ ok: o.ok, at: o.at }));
    const level = store.getLevel(s.id);
    const snap = toSnapshot(s.id, level, outcomes);
    return {
      id: s.id,
      title: s.title,
      topic: s.topic,
      level: snap.level,
      successRate: snap.successRate,
      reviewCount: snap.reviewCount,
      lastReviewAt: snap.lastReviewAt,
    };
  });
}

export function masteryBuckets(rows: SkillRow[]) {
  const buckets: Record<MasteryLevel, number> = {1:0,2:0,3:0,4:0,5:0};
  rows.forEach(r => { buckets[r.level]++; });
  return buckets;
}
