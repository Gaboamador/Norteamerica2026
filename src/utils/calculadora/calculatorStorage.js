const STORAGE_VERSION = "v1";

const SANDBOX_RESULTS_KEY = `worldCupCalculator:${STORAGE_VERSION}:sandboxResults`;
const MANUAL_TIEBREAKERS_KEY = `worldCupCalculator:${STORAGE_VERSION}:manualTiebreakers`;
const KNOCKOUT_PICKS_KEY = `worldCupCalculator:${STORAGE_VERSION}:knockoutPicks`;

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // No bloqueamos la calculadora si localStorage falla.
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // No bloqueamos la calculadora si localStorage falla.
  }
}

export function readCalculatorSandboxResults() {
  return safeReadJson(SANDBOX_RESULTS_KEY, {});
}

export function readCalculatorManualTiebreakers() {
  return safeReadJson(MANUAL_TIEBREAKERS_KEY, {});
}

export function readCalculatorKnockoutPicks() {
  return safeReadJson(KNOCKOUT_PICKS_KEY, {});
}

export function saveCalculatorSandboxResults(sandboxResults) {
  safeWriteJson(SANDBOX_RESULTS_KEY, sandboxResults);
}

export function saveCalculatorManualTiebreakers(manualTiebreakers) {
  safeWriteJson(MANUAL_TIEBREAKERS_KEY, manualTiebreakers);
}

export function saveCalculatorKnockoutPicks(knockoutPicks) {
  safeWriteJson(KNOCKOUT_PICKS_KEY, knockoutPicks);
}

export function clearCalculatorSandboxResults() {
  safeRemove(SANDBOX_RESULTS_KEY);
}

export function clearCalculatorManualTiebreakers() {
  safeRemove(MANUAL_TIEBREAKERS_KEY);
}

export function clearCalculatorKnockoutPicks() {
  safeRemove(KNOCKOUT_PICKS_KEY);
}

export function clearCalculatorStorage() {
  clearCalculatorSandboxResults();
  clearCalculatorManualTiebreakers();
  clearCalculatorKnockoutPicks();
}