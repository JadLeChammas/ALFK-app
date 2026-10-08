/** The current school year, « 2026-2027 »: it starts in August (the LFK's rentrée is late August). */
export function schoolYear(now = new Date()) {
  const y = now.getFullYear();
  return now.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
