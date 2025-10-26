// lib/reminders/engine.ts
import { computeSkillMatrix } from '@/lib/competence/matrix';

export type Reminder = { kind: 'revive'|'warmup'|'promote'; skillId: string; text: string };

export function generateReminders(): Reminder[] {
  const rows = computeSkillMatrix();
  const out: Reminder[] = [];

  // a) Inaktiv (letztes Review > 3 Tage) → revive
  const threeDays = 3*24*60*60*1000;
  rows.filter(r => r.lastReviewAt && Date.now() - r.lastReviewAt > threeDays)
      .slice(0,3)
      .forEach(r => out.push({ kind:'revive', skillId: r.id, text:`Kurz reaktivieren: ${r.title} (3′ Micro-Session)` }));

  // b) Level 1–2 mit niedriger SR → warmup
  rows.filter(r => r.level <= 2 && r.successRate < 0.75)
      .slice(0,3)
      .forEach(r => out.push({ kind:'warmup', skillId: r.id, text:`Warm-up: 1 Worked Example zu ${r.title}` }));

  // c) Level 3–4 mit hoher SR → promote Kandidaten
  rows.filter(r => r.level >= 3 && r.level <= 4 && r.successRate >= 0.85)
      .slice(0,3)
      .forEach(r => out.push({ kind:'promote', skillId: r.id, text:`Kurz festigen: ${r.title} (2 Aufgaben) — dann Level-Check` }));

  return out;
}
