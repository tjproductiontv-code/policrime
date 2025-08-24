// lib/levels.ts
export type LevelInfo = { title: string; description: string };

export const LEVELS: Record<number, LevelInfo> = {
  1: { title: "Beginnend Raadslid", description: "Net binnen, nog te gretig en onervaren." },
  2: { title: "Vergunningsfluisteraar", description: "Regelt kleine gunsten tegen fooi." },
  3: { title: "Subsidieslurper", description: "Jij weet waar het gratis geld verstopt zit." },
  4: { title: "Lobbyvriend", description: "Bedrijven zien jou als hun mannetje in de politiek." },
  5: { title: "Bureaucratiebaas", description: "Je kent elk achterdeurtje in de regels." },
  6: { title: "Belastingontduiker", description: "Je geld stroomt inmiddels via schimmige constructies." },
  7: { title: "Budgetplunderaar", description: "Je laat miljoenen verdwijnen zonder dat iemand het merkt." },
  8: { title: "Marionettenmeester", description: "Jij trekt de touwtjes achter schermen, anderen voeren uit." },
  9: { title: "Olie- & Wapenhandelaar", description: "Je hebt internationale contacten en stinkend veel geld." },
  10:{ title: "De Onschendbare", description: "Jij bent de macht, niemand durft je nog aan te raken." },
};

// Max level expliciet exporteren (en dynamische fallback helper)
export const MAX_LEVEL = 10 as const;

export function getMaxLevel(): number {
  // Fallback als iemand MAX_LEVEL ooit vergeet bij te werken
  const dyn = Math.max(1, ...Object.keys(LEVELS).map(n => Number(n)));
  return Number.isFinite(MAX_LEVEL) ? MAX_LEVEL : dyn;
}
