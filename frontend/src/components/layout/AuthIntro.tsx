import React from 'react';

const POINTS = [
  {
    title: 'Fill from a posting',
    text: 'Paste a job posting URL or its text and the company, role, location and skills are extracted. The AI runs on free models, so it can be slow or hit a daily limit.',
  },
  {
    title: 'Match against your resume',
    text: 'Save your master resume once. Each posting then gets a match score, the skills you are missing and suggested edits.',
  },
  {
    title: 'Five stages, drag and drop',
    text: 'Applied, Phone Screen, Interview, Offer, Rejected. Add notes and follow-up dates, search, filter by match, export to CSV.',
  },
  {
    title: 'Analytics',
    text: 'Your funnel, the spread of match scores, the last 28 days of activity, and the skills missing most often.',
  },
];

/** Left half of the sign-in and sign-up pages: what the tool does, in plain words. */
export const AuthIntro: React.FC<{ heading: string }> = ({ heading }) => (
  <section className="auth-intro">
    <span className="wordmark">JobTrackr</span>
    <h1>{heading}</h1>
    <ul className="auth-list">
      {POINTS.map((p) => (
        <li key={p.title}>
          <strong>{p.title}</strong>
          <span>{p.text}</span>
        </li>
      ))}
    </ul>
  </section>
);
