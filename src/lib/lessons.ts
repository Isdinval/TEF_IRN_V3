/**
 * Splits a lesson title into a main title and a subtitle based on common separators.
 */
export function splitTitle(title: string): { main: string; subtitle: string | null } {
  const separators = [' | ', ' — ', ' : ', ' - '];
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      return { main: parts[0].trim(), subtitle: parts.slice(1).join(sep).trim() };
    }
  }
  return { main: title, subtitle: null };
}

/**
 * Parses a lesson objective into a description and a list of skills.
 * Look for the anchor "À la fin, vous serez capable de :" (case-insensitive).
 */
export function parseObjective(objective: string): { description: string; skills: string[] } {
  if (!objective) return { description: "", skills: [] };

  // Case-insensitive search for the anchor
  const anchor = "À la fin, vous serez capable de :";
  const lowerObjective = objective.toLowerCase();
  const lowerAnchor = anchor.toLowerCase();

  const anchorIndex = lowerObjective.indexOf(lowerAnchor);

  if (anchorIndex === -1) {
    return { description: objective.trim(), skills: [] };
  }

  const description = objective.substring(0, anchorIndex).trim();
  const skillsPart = objective.substring(anchorIndex + anchor.length).trim();

  // Split by lines, trim, and filter out empty strings
  const skills = skillsPart
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  return { description, skills };
}
