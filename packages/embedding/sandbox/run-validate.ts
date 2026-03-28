#!/usr/bin/env node
/**
 * Sandbox en mode validation : exécute et valide sans affichage verbeux.
 * Utilisable en CI. Exit 0 si OK, 1 si échec.
 *
 * Exécuter : cd packages/embedding && bun run sandbox:validate
 */

import { runSandbox } from "./core.js";
import { validateSandboxResult } from "./validate.js";

const result = await runSandbox(false);
validateSandboxResult(result);
result.close?.();
console.log(`OK (storage: ${result.storageBackend})`);
