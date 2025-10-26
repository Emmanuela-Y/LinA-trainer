// lib/competence/skills.ts
export type Topic = 'Mengen' | 'Zahlentheorie' | 'Vektoren' | 'Ebenen' | 'Fibonacci';
export type Skill = {
  id: string;           // stabile ID in deinen Aufgaben (p.meta.skillId)
  title: string;        // UI-Name
  topic: Topic;
  syllabus?: string;    // optional: Verweis auf Modul-/Skript-Stelle
};

export const SKILLS: Skill[] = [
  { id: 'ueb01-a2-mengenalgebra', title: 'Mengenalgebra – A2', topic: 'Mengen', syllabus: 'ÜB 01 / A2' },
  { id: 'ueb01-b3-fibonacci',     title: 'Fibonacci – B3', topic: 'Zahlentheorie', syllabus: 'ÜB 01 / B3' },
  { id: 'ueb02-a-ebene',          title: 'Ebenen in ℝ³ – A', topic: 'Ebenen', syllabus: 'ÜB 02 / A' },
  // … ergänzen
];

export const byId = Object.fromEntries(SKILLS.map(s => [s.id, s]));
