/**
 * Validation des résultats du sandbox.
 * Assertions pour garantir le fonctionnement correct du système.
 */

import type { SandboxResult } from "./core.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Valide les résultats du sandbox.
 * @throws Error si une assertion échoue
 */
export function validateSandboxResult(result: SandboxResult): void {
  const { missionsForP1, profilesForM1, searchWebReact, searchStageDev } = result;

  // p1 (dev full-stack) doit avoir m1 (stage full-stack) dans le top 3
  const p1TopIds = missionsForP1.map((m) => m.id);
  assert(
    p1TopIds.includes("m1"),
    `p1 (dev) doit avoir m1 (stage full-stack) dans le top 3, got: ${p1TopIds.join(", ")}`
  );

  // m1 doit avoir p1 dans le top 3
  const m1TopIds = profilesForM1.map((p) => p.id);
  assert(
    m1TopIds.includes("p1"),
    `m1 (stage full-stack) doit avoir p1 (dev) dans le top 3, got: ${m1TopIds.join(", ")}`
  );

  // Recherche "développement web React TypeScript Lyon" : m1 ou m5 (dev) dans le top 2
  const webTopIds = searchWebReact.map((m) => m.id);
  assert(
    webTopIds.includes("m1") || webTopIds.includes("m5"),
    `Recherche dev web doit retourner m1 ou m5 dans le top 3, got: ${webTopIds.join(", ")}`
  );

  // Recherche "stage développement informatique" : m1 dans le top 3
  const stageTopIds = searchStageDev.map((m) => m.id);
  assert(
    stageTopIds.includes("m1"),
    `Recherche stage dev doit retourner m1 dans le top 5, got: ${stageTopIds.join(", ")}`
  );

  // Scores dans [0, 1]
  for (const r of [...missionsForP1, ...profilesForM1, ...searchWebReact, ...searchStageDev]) {
    assert(r.score >= 0 && r.score <= 1, `Score hors plage [0,1]: ${r.id} = ${r.score}`);
  }

  // Résultats non vides
  assert(missionsForP1.length > 0, "missionsForP1 ne doit pas être vide");
  assert(profilesForM1.length > 0, "profilesForM1 ne doit pas être vide");
  assert(searchWebReact.length > 0, "searchWebReact ne doit pas être vide");
  assert(searchStageDev.length > 0, "searchStageDev ne doit pas être vide");
}
