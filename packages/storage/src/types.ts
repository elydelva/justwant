/**
 * @justwant/storage - Types and interfaces.
 */

export type StorageSourceType = "local" | "s3" | "r2" | "vercel-blob" | "supabase" | "uploadthing";

/** Interface commune retournée par defineXxxSource */
export interface StorageSource {
  readonly _type: StorageSourceType;
  readonly _adapter: StorageSourceAdapter;
}

/** Params pour upload */
export interface UploadParams {
  bucket?: StorageBucket;
  path: string;
  data: Buffer | Blob | ReadableStream<Uint8Array> | string;
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
  };
}

/** Résultat d'un upload */
export interface UploadResult {
  path: string;
  url?: string;
  size?: number;
  etag?: string;
}

/** Params pour download */
export interface DownloadParams {
  bucket?: StorageBucket;
  path: string;
}

/** Params pour delete */
export interface DeleteParams {
  bucket?: StorageBucket;
  path: string;
}

/** Params pour getUrl */
export interface GetUrlParams {
  bucket?: StorageBucket;
  path: string;
}

/** Params pour getSignedUrl */
export interface GetSignedUrlParams {
  bucket?: StorageBucket;
  path: string;
  options?: {
    expiresIn?: number;
    method?: "GET" | "PUT";
  };
}

/** Params pour exists */
export interface ExistsParams {
  bucket?: StorageBucket;
  path: string;
}

/** Params internes (bucket toujours présent) */
export type AdapterUploadParams = UploadParams & { bucket: StorageBucket };
export type AdapterDownloadParams = DownloadParams & { bucket: StorageBucket };
export type AdapterDeleteParams = DeleteParams & { bucket: StorageBucket };
export type AdapterGetUrlParams = GetUrlParams & { bucket: StorageBucket };
export type AdapterGetSignedUrlParams = GetSignedUrlParams & { bucket: StorageBucket };
export type AdapterExistsParams = ExistsParams & { bucket: StorageBucket };

/** Interface interne utilisée par defineBucket + createStorageService */
export interface StorageSourceAdapter {
  upload(params: AdapterUploadParams): Promise<UploadResult>;
  download(params: AdapterDownloadParams): Promise<Buffer>;
  delete(params: AdapterDeleteParams): Promise<void>;
  getUrl(params: AdapterGetUrlParams): Promise<string>;
  getSignedUrl(params: AdapterGetSignedUrlParams): Promise<string>;
  exists?(params: AdapterExistsParams): Promise<boolean>;
}

/** Bucket logique : source + nom */
export interface StorageBucket {
  readonly source: StorageSource;
  readonly name: string;
  readonly _adapter: StorageSourceAdapter;
}

/** Next functions pour les plugins */
export type StorageUploadNext = (params: UploadParams) => Promise<UploadResult>;
export type StorageDownloadNext = (params: DownloadParams) => Promise<Buffer>;
export type StorageDeleteNext = (params: DeleteParams) => Promise<void>;
export type StorageGetUrlNext = (params: GetUrlParams) => Promise<string>;
export type StorageGetSignedUrlNext = (params: GetSignedUrlParams) => Promise<string>;

/** Contexte d'initialisation des plugins */
export interface StoragePluginContext {
  setContext?: (key: string, value: unknown) => void;
}

/** Plugin de storage */
export interface StoragePlugin {
  name: string;
  init?(ctx: StoragePluginContext): void | Promise<void>;
  upload?(params: UploadParams, next: StorageUploadNext): Promise<UploadResult>;
  download?(params: DownloadParams, next: StorageDownloadNext): Promise<Buffer>;
  delete?(params: DeleteParams, next: StorageDeleteNext): Promise<void>;
  getUrl?(params: GetUrlParams, next: StorageGetUrlNext): Promise<string>;
  getSignedUrl?(params: GetSignedUrlParams, next: StorageGetSignedUrlNext): Promise<string>;
}

/** Options pour createStorageService */
export interface CreateStorageServiceOptions {
  buckets: StorageBucket[];
  defaultBucket?: StorageBucket;
  plugins?: StoragePlugin[];
  onError?: "throw" | "silent";
}

/** Service de storage exposé à l'utilisateur */
export interface StorageService {
  upload(params: UploadParams): Promise<UploadResult>;
  download(params: DownloadParams): Promise<Buffer>;
  delete(params: DeleteParams): Promise<void>;
  getUrl(params: GetUrlParams): Promise<string>;
  getSignedUrl(params: GetSignedUrlParams): Promise<string>;
  exists(params: ExistsParams): Promise<boolean>;
}
