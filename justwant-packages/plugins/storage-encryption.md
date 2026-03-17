# storage encryptionPlugin

**Package:** @justwant/storage  
**Import:** `@justwant/storage/plugins/encryption`

Chiffre les données à l'upload, déchiffre au download. AES-256-GCM.

## Cas d'usage

- Données sensibles (documents, backups)
- Conformité RGPD / chiffrement au repos
- Stockage partagé (S3 multi-tenant)

## Options

| Option | Type | Default | Requis | Description |
|--------|------|---------|--------|-------------|
| key | string \| Buffer | — | **oui** | Clé secrète (string → dérivée via scrypt) |
| algorithm | string | "aes-256-gcm" | non | Algorithme de chiffrement |

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { encryptionPlugin } from "@justwant/storage/plugins/encryption";

const bucket = defineBucket({ source: mySource, name: "media" });
const storage = createStorageService({
  buckets: [bucket],
  defaultBucket: bucket,
  plugins: [
    encryptionPlugin({
      key: process.env.STORAGE_ENCRYPTION_KEY!,
    }),
  ],
});
```

## Comportement

- upload: chiffre le buffer (salt + iv + ciphertext + authTag), passe le buffer chiffré à next
- download: récupère le buffer chiffré, déchiffre, retourne le plaintext
- Format stocké: salt (32) + iv (16) + ciphertext + authTag (16)
- Si key est string: scryptSync(key, salt, 32) pour dériver la clé

## Ordre des plugins (storage)

Placer encryption après imageTransform et rename (chiffrer les données déjà transformées). Voir [README.md](./README.md#ordre-des-plugins-storage).
