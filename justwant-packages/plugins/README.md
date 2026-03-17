# Plugins @justwant

Un fichier `.md` par plugin pour permettre à une IA de comprendre les outils sans parcourir le code.

## Ordre des plugins (storage)

La chaîne storage exécute les plugins **dans l'ordre du tableau** : le premier plugin traite les params en premier, le dernier juste avant l'adapter.

**Ordre recommandé pour upload :**

1. `imageTransform` — transformer les images (resize, format)
2. `rename` — sanitize et nommage (uuid, hash, slug)
3. `encryption` — chiffrer avant stockage
4. `multiBucket` — router vers le bucket

```ts
plugins: [
  imageTransformPlugin({ maxWidth: 1920, format: "webp" }),
  renamePlugin({ strategy: "uuid" }),
  encryptionPlugin({ key: process.env.KEY }),
  multiBucketPlugin({ routing: {...}, defaultBucket }),
]
```

## Options requises

| Plugin | Options requises |
|--------|------------------|
| cache namespace | prefix |
| cache serialize | serializer |
| cache encrypt | key |
| cache prefetch | keyFn |
| storage multiBucket | routing |
| storage watermark | provider |
| storage encryption | key |
| job lock | lock |
| job audit | audit |
| job alert | notify |
| waitlist audit | audit |
| referral audit | audit |

## Index par package

### Cache (@justwant/cache)

| Plugin | Fichier | Description |
|--------|---------|-------------|
| namespace | [cache-namespace.md](./cache-namespace.md) | Préfixe les clés |
| serialize | [cache-serialize.md](./cache-serialize.md) | Custom serializer (superjson, msgpack) |
| encrypt | [cache-encrypt.md](./cache-encrypt.md) | Chiffrement au repos |
| stats | [cache-stats.md](./cache-stats.md) | Hits, misses, latences |
| stale | [cache-stale.md](./cache-stale.md) | Stale-while-revalidate |
| dedupe | [cache-dedupe.md](./cache-dedupe.md) | Déduplication des gets concurrents |
| prefetch | [cache-prefetch.md](./cache-prefetch.md) | Précharge des clés liées |
| audit | [cache-audit.md](./cache-audit.md) | Hooks onGet, onSet, onDelete |

### Storage (@justwant/storage)

| Plugin | Fichier | Description |
|--------|---------|-------------|
| signedUrl | [storage-signedUrl.md](./storage-signedUrl.md) | Valeurs par défaut pour URLs signées |
| rename | [storage-rename.md](./storage-rename.md) | Sanitize + stratégie (uuid, hash, slug) |
| multiBucket | [storage-multiBucket.md](./storage-multiBucket.md) | Routing par contentType/extension |
| watermark | [storage-watermark.md](./storage-watermark.md) | Transformations Cloudflare/imgproxy |
| encryption | [storage-encryption.md](./storage-encryption.md) | Chiffrement AES-256-GCM |
| imageTransform | [storage-imageTransform.md](./storage-imageTransform.md) | Resize/format via sharp |

### Job (@justwant/job)

| Plugin | Fichier | Description |
|--------|---------|-------------|
| lock | [job-lock.md](./job-lock.md) | Lock distribué anti-double exécution |
| audit | [job-audit.md](./job-audit.md) | Log des exécutions |
| alert | [job-alert.md](./job-alert.md) | Notification sur échec |

### Waitlist (@justwant/waitlist)

| Plugin | Fichier | Description |
|--------|---------|-------------|
| audit | [waitlist-audit.md](./waitlist-audit.md) | Log subscribe/unsubscribe/pop |
| expiration | [waitlist-expiration.md](./waitlist-expiration.md) | **Fonction utilitaire** cleanupExpired (cron) |
| referral | [waitlist-referral.md](./waitlist-referral.md) | **Fonction helper** invite + referral |

### Referral (@justwant/referral)

| Plugin | Fichier | Description |
|--------|---------|-------------|
| audit | [referral-audit.md](./referral-audit.md) | Log des referrals |
