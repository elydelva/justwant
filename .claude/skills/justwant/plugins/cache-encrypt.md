# cache encryptPlugin

**Package:** @justwant/cache  
**Import:** `@justwant/cache/plugins/encrypt`

Chiffre les valeurs au repos via @justwant/crypto. Requiert une clé 32 bytes.

## Cas d'usage

- Données sensibles en cache (Redis partagé)
- Conformité RGPD / chiffrement au repos

## Dépendances

- `@justwant/crypto` — `deriveKey` pour dériver une clé 32 bytes depuis un secret

## Options

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| key | Uint8Array | oui | Clé de chiffrement 32 bytes |

## Usage

```ts
import { createCache } from "@justwant/cache";
import { memoryAdapter } from "@justwant/cache/adapters/memory";
import { encryptPlugin } from "@justwant/cache/plugins/encrypt";
import { deriveKey } from "@justwant/crypto/derive-key";

const key = deriveKey("master-secret", "salt", "cache", 32);

const cache = createCache({
  adapter: memoryAdapter(),
  plugins: [encryptPlugin({ key })],
});
```

## Comportement

- init: charge dynamiquement @justwant/crypto/encrypt
- Remplace le serializer par un qui encrypt/decrypt via JSON.stringify/parse
- Les valeurs stockées sont chiffrées (AES)

## Notes

- Placer après serializePlugin si les deux sont utilisés (serialize → encrypt)
