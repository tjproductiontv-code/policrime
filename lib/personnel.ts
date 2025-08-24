// lib/personnel.ts
export const EMPLOYEE_HOURLY_COST = 50;                 // € per uur per ambtenaar
export const DOSSIERS_PER_EMPLOYEE = 100;               // capaciteit (geen gratis dossiers)
export const WORKSPACE_UNIT_PRICE = 250;                // € per 2 m²-unit
export const WORKSPACE_UNITS_PER_EMPLOYEE = 5;          // units nodig per ambtenaar

export function dossierCapacity(civilServants: number) {
  return Math.max(0, (civilServants ?? 0) * DOSSIERS_PER_EMPLOYEE);
}

export function maxEmployeesByWorkspace(units: number) {
  return Math.floor(Math.max(0, units ?? 0) / WORKSPACE_UNITS_PER_EMPLOYEE);
}
