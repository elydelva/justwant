/**
 * Plugin watermark - add transformation params to image URLs (Cloudflare Images, imgproxy).
 */

import type { GetUrlParams, StorageGetUrlNext, StoragePlugin } from "../types.js";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".bmp",
  ".ico",
]);

function isImagePath(path: string): boolean {
  const ext = path.includes(".") ? path.slice(path.lastIndexOf(".")).toLowerCase() : "";
  return IMAGE_EXTENSIONS.has(ext);
}

function buildCloudflareParams(opts: Record<string, unknown>): string {
  const params = new URLSearchParams();
  if (opts.fit) params.set("fit", String(opts.fit));
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.quality) params.set("quality", String(opts.quality));
  const s = params.toString();
  return s ? `?${s}` : "";
}

function buildImgproxyParams(opts: Record<string, unknown>): string {
  const parts: string[] = [];
  if (opts.w) parts.push(`w:${String(opts.w)}`);
  if (opts.h) parts.push(`h:${String(opts.h)}`);
  if (opts.resize) parts.push(`rs:${String(opts.resize)}`);
  if (opts.wm) parts.push(`wm:${String(opts.wm)}`);
  const s = parts.join("/");
  return s ? `/${s}` : "";
}

export interface WatermarkPluginOptions {
  provider: "cloudflare" | "imgproxy";
  cloudflare?: { fit?: string; width?: number; height?: number; quality?: number };
  imgproxy?: { w?: number; h?: number; resize?: string; wm?: string };
}

export function watermarkPlugin(options: WatermarkPluginOptions): StoragePlugin {
  const { provider, cloudflare = {}, imgproxy = {} } = options;

  return {
    name: "watermark",

    getUrl(params: GetUrlParams, next: StorageGetUrlNext): Promise<string> {
      if (!isImagePath(params.path)) {
        return next(params);
      }

      return next(params).then((url) => {
        try {
          const parsed = new URL(url);
          if (provider === "cloudflare") {
            const suffix = buildCloudflareParams(cloudflare as Record<string, unknown>);
            parsed.search = parsed.search ? `${parsed.search}&${suffix.slice(1)}` : suffix;
          } else if (provider === "imgproxy") {
            const pathSuffix = buildImgproxyParams(imgproxy as Record<string, unknown>);
            if (pathSuffix) {
              parsed.pathname = parsed.pathname.replace(/\/?$/, pathSuffix);
            }
          }
          return parsed.toString();
        } catch {
          return url;
        }
      });
    },
  };
}
