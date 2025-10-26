'use client';

import React, { useEffect, useState } from 'react';
import { Problem } from '@/lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

import {
  parseNumber,
  parseVector,
  parseMatrix,
  approxEqual,
  vectorsApproxEqual,
  matricesApproxEqual,
} from '@/lib/eval/numeric';

import 'katex/dist/katex.min.css';
import katex from 'katex';

// Dein bestehender SRS-Store (behalten)
import { useSrs } from '@/lib/srs/store';

// 🔗 Neu: Review-Flow (Engine + Feedback)
import { handleReviewFinished, seedSkillTitle } from '@/lib/trainer/review';

function Latex({ expr }: { expr: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(expr, { throwOnError: false }),
      }}
    />
  );
}

type UIFeedback = {
  headline: string;
  message: string;
  tips: string[];
  reminders: string[];
};

type UICompetence = {
  level: number;
  rule: 'promote' | 'demote-streak' | 'demote-inactivity' | 'stable';
  successRate: number;
};

export function ProblemView({ make }: { make: () => Problem }) {
  const [p, setP] = useState<Problem>(make());
  const [input, setInput] = useState('');
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);

  // bisheriger SRS-Review-Call bleibt bestehen
  const review = useSrs((s) => s.review);

  // 📌 Neu: lokaler UI-State für Competence + Feedback
  const [feedback, setFeedback] = useState<UIFeedback | null>(null);
  const [competenceInfo, setCompetenceInfo] = useState<UICompetence | null>(null);

  // stabile Skill-ID ableiten (aus meta oder fallback auf Problem-ID)
  const skillId = (p.meta as any)?.skillId ?? p.id;
  const skillTitle = (p.meta as any)?.title ?? `Problem ${p.id}`;

  // optional: Titel einmal registrieren (für personalisierte Texte)
  useEffect(() => {
    seedSkillTitle(skillId, skillTitle);
  }, [skillId, skillTitle]);

  const check = () => {
    let ok = false;

    if (p.answerKind === 'number') {
      const v = parseNumber(input);
      if (v == null) return setResult({ ok: false, msg: 'Bitte Zahl eingeben.' });
      ok = approxEqual(v, p.solution as number, 1e-4);
    } else if (p.answerKind === 'vector') {
      const v = parseVector(input);
      if (!v) return setResult({ ok: false, msg: 'Bitte Vektor eingeben (z.B. 1,2).' });
      ok = vectorsApproxEqual(v, p.solution as number[], 1e-3);
    } else {
      const m = parseMatrix(input);
      if (!m)
        return setResult({
          ok: false,
          msg: "Bitte Matrix eingeben (Zeilen mit ';').",
        });
      ok = matricesApproxEqual(m, p.solution as number[][], 1e-3);
    }

    // UI-Ergebnis (so wie bisher)
    setResult({ ok, msg: ok ? 'Korrekt!' : "Nicht ganz. Versuch's erneut." });

    // ✅ Dein bisheriger SRS-Call (beibehalten)
    review(p.id, ok ? 4 : 1, (p.meta as any)?.skillId);

    // ✅ Neu: Competence Engine + Feedback-Generator aufrufen
    const { competence, feedback } = handleReviewFinished(skillId, ok);

    setCompetenceInfo({
      level: competence.level,
      rule: competence.rule,
      successRate: competence.successRate,
    });

    setFeedback({
      headline: feedback.headline,
      message: feedback.message,
      tips: feedback.tips,
      reminders: feedback.reminders,
    });
  };

  const resetProblem = () => {
    setP(make());
    setInput('');
    setResult(null);
    // Feedback nicht hart löschen, damit Verlauf sichtbar bleibt – wenn du willst:
    // setFeedback(null);
    // setCompetenceInfo(null);
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-subtle">
          ID: <Badge>{p.id.slice(0, 10)}</Badge>
        </div>
        <Button onClick={resetProblem}>Neu</Button>
      </div>

      <div className="text-lg">
        <Latex expr={p.promptLatex} />
      </div>

      <div className="space-y-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Antwort hier eingeben"
        />
        <Button onClick={check}>Prüfen</Button>

        {result && (
          <div className={result.ok ? 'text-green-500' : 'text-red-500'}>
            {result.msg}
          </div>
        )}
      </div>

      {/* 🔎 Competence-Badge/Info */}
      {competenceInfo && (
        <div className="mt-3 rounded-lg border p-3">
          <div className="text-sm font-semibold">Kompetenz-Status</div>
          <div className="text-sm mt-1">
            Level: <Badge>{competenceInfo.level}</Badge>{' '}
            | Regel: <span className="font-mono">{competenceInfo.rule}</span>{' '}
            | Trefferquote (Fenster): {Math.round(competenceInfo.successRate * 100)}%
          </div>
        </div>
      )}

      {/* 📝 Feedback-Panel */}
      {feedback && (
        <div className="mt-3 rounded-xl border p-4">
          <div className="text-base font-semibold">{feedback.headline}</div>
          <div
            className="mt-1 text-sm leading-relaxed"
            // message enthält **fetten** Text → als HTML einsetzen
            dangerouslySetInnerHTML={{ __html: feedback.message }}
          />
          {feedback.tips?.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium">Tipps</div>
              <ul className="list-disc pl-5 text-sm">
                {feedback.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.reminders?.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium">Methoden-Reminders</div>
              <ul className="list-disc pl-5 text-sm">
                {feedback.reminders.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
