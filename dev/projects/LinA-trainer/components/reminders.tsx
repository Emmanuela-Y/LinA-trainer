// components/reminders.tsx
'use client';
import React from 'react';
import { generateReminders } from '@/lib/reminders/engine';

export default function Reminders() {
  const [items, setItems] = React.useState(generateReminders());
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="text-sm font-semibold">Methoden-Reminders</div>
      <ul className="list-disc pl-5 text-sm">
        {items.map((r,i) => <li key={i}>{r.text}</li>)}
      </ul>
    </div>
  );
}
