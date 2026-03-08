/**
 * @justwant/storage - Unified file storage abstraction.
 */

export { defineBucket } from "./defineBucket.js";
export type { DefineBucketConfig } from "./defineBucket.js";
export { createStorageService } from "./createStorageService.js";
export { StorageError, StorageAdapterError, parseStorageError } from "./errors.js";
export type {
  StorageSource,
  StorageSourceType,
  StorageBucket,
  StorageSourceAdapter,
  StoragePlugin,
  StoragePluginContext,
  StorageService,
  CreateStorageServiceOptions,
  UploadParams,
  UploadResult,
  DownloadParams,
  DeleteParams,
  GetUrlParams,
  GetSignedUrlParams,
  ExistsParams,
  AdapterUploadParams,
  AdapterDownloadParams,
  AdapterDeleteParams,
  AdapterGetUrlParams,
  AdapterGetSignedUrlParams,
  AdapterExistsParams,
} from "./types.js";
