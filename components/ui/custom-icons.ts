import { createLucideIcon } from 'lucide-react';

export const MusicFilled = createLucideIcon("MusicFilled", [
  ["path", { d: "M9 18V5l12-2v13", key: "1" }],
  ["circle", { cx: "6", cy: "18", r: "3", key: "2" }],
  ["circle", { cx: "18", cy: "16", r: "3", key: "3" }]
]);

export const BookOpenFilled = createLucideIcon("BookOpenFilled", [
  ["path", { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", key: "1", fill: "currentColor" }],
  ["path", { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z", key: "2", fill: "currentColor" }]
]);

export const StarFilled = createLucideIcon("StarFilled", [
  ["polygon", { points: "12 2 15 8.5 22 9.5 17 14.5 18.5 21.5 12 17.5 5.5 21.5 7 14.5 2 9.5 9 8.5 12 2", key: "1", fill: "currentColor" }]
]);