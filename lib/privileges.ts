export type Privilege = {
  key: string;
  name: string;
  desc: string;
  costVotes: number;     // ✔ prijs in stemmen
  incomePerHour: number; // ✔ € per uur
};

export const PRIVILEGE_CATALOG: Privilege[] = [
  { key: "adhesie-donateurs", name: "Adhesie van donateurs", desc: "Kleine donateurs…", costVotes: 50,  incomePerHour: 50 },
  { key: "bedrijvennetwerk",  name: "Bedrijvennetwerk",      desc: "Zakelijke vrienden…", costVotes: 250, incomePerHour: 300 },
  { key: "schimmig-fonds",    name: "Schimmig fonds",        desc: "Niet te veel vragen…", costVotes: 1200, incomePerHour: 1500 },
];
