#!/usr/bin/env node
/**
 * Sandbox : chaîne complète matching étudiants ↔ missions
 * - Moteur : @xenova/transformers (all-MiniLM-L6-v2, 384 dim)
 * - Stockage : sqlite-vec (better-sqlite3) ou memory (fallback)
 * - Assertions : valide le fonctionnement correct
 *
 * Exécuter : cd packages/embedding && bun run sandbox
 */

import { runSandbox } from "./core.js";
import { validateSandboxResult } from "./validate.js";

console.log("Sandbox matching étudiants ↔ missions\n");

const result = await runSandbox(true);

console.log("\n4. Résultats :");
console.log(
  "  Missions pour p1 (dev):",
  result.missionsForP1.map((m) => `${m.id}:${m.score.toFixed(2)}`).join(", ")
);
console.log(
  "  Profils pour m1 (full-stack):",
  result.profilesForM1.map((p) => `${p.id}:${p.score.toFixed(2)}`).join(", ")
);
console.log(
  "  Recherche dev web:",
  result.searchWebReact.map((m) => `${m.id}:${m.score.toFixed(2)}`).join(", ")
);
console.log(
  "  Recherche stage dev:",
  result.searchStageDev.map((m) => `${m.id}:${m.score.toFixed(2)}`).join(", ")
);

console.log("\n5. Validation des assertions...");
validateSandboxResult(result);

result.close?.();
console.log("\n✓ Sandbox terminé — toutes les assertions passent.");
