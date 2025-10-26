'use client';
import React from 'react';
import { computeSkillMatrix, masteryBuckets } from '@/lib/competence/matrix';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export default function SkillMatrix() {
  const [rows, setRows] = React.useState(() => computeSkillMatrix());

  const refresh = () => setRows(computeSkillMatrix());

  const buckets = masteryBuckets(rows);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Skill-Matrix</div>
        <Button size="sm" onClick={refresh}>Aktualisieren</Button>
      </div>

      <div className="text-sm">
        {([1,2,3,4,5] as const).map(l => (
          <span key={l} className="mr-3">L{l}: <Badge>{buckets[l]}</Badge></span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Skill</th>
              <th>Thema</th>
              <th>Level</th>
              <th>SR (Fenster)</th>
              <th>Reviews</th>
              <th>Zuletzt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="py-2">{r.title}</td>
                <td>{r.topic}</td>
                <td><Badge>{r.level}</Badge></td>
                <td>{Math.round(r.successRate * 100)}%</td>
                <td>{r.reviewCount}</td>
                <td>{r.lastReviewAt ? new Date(r.lastReviewAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
