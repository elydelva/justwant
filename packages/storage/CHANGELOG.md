# @justwant/storage

## 0.2.0

### Minor Changes

- **E2E Vercel Blob local** : support de vercel-blob-server (Docker) pour tests E2E sans token cloud
- **E2E Supabase local** : script `ensure-supabase.sh` + `supabase start` pour tests E2E autonomes
- Adapter vercel-blob : support de `VERCEL_BLOB_API_URL` pour endpoint personnalisé
- Adapter vercel-blob : fallback `head` + `fetch` pour versions sans `get()`
- E2E : création automatique du bucket Supabase avant les tests
