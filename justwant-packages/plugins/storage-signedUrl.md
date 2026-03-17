# storage signedUrlPlugin

**Package:** @justwant/storage  
**Import:** `@justwant/storage/plugins/signedUrl`

Applique des valeurs par défaut pour `getSignedUrl` (expiration, méthode HTTP).

## Cas d'usage

- URLs de téléchargement temporaires (GET)
- Upload pré-signé (PUT) pour client direct S3/R2

## Options

| Option | Type | Default | Requis | Description |
|--------|------|---------|--------|-------------|
| defaultExpiresIn | number | 3600 | non | Durée de validité en secondes |
| defaultMethod | "GET" \| "PUT" | "GET" | non | Méthode HTTP par défaut |

## Usage

```ts
import { createStorageService, defineBucket } from "@justwant/storage";
import { signedUrlPlugin } from "@justwant/storage/plugins/signedUrl";

const bucket = defineBucket({ source: mySource, name: "media" });
const storage = createStorageService({
  buckets: [bucket],
  defaultBucket: bucket,
  plugins: [
    signedUrlPlugin({
      defaultExpiresIn: 7200,
      defaultMethod: "GET",
    }),
  ],
});

// Les appels getSignedUrl sans options utilisent ces valeurs par défaut
const url = await storage.getSignedUrl("path/file.pdf");
```

## Comportement

- getSignedUrl: merge les options avec les valeurs par défaut avant d'appeler next
- Les options explicites passées à getSignedUrl l'emportent sur les défauts

## Notes

- Aucune dépendance externe
