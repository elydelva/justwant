/**
 * @justwant/notify — Memory NotifyRepository
 * In-memory implementation for tests and simple use. No persistence.
 */

import type { NotifyRepository, Template, TemplateVersions } from "../types.js";

export function createMemoryNotifyRepository(): NotifyRepository {
  const templates = new Map<string, Template>();

  return {
    async listTemplates(): Promise<Template[]> {
      return [...templates.values()];
    },

    async getTemplate(options: { id: string }): Promise<Template | null> {
      return templates.get(options.id) ?? null;
    },

    async createTemplate(template: Template): Promise<void> {
      if (templates.has(template.id)) {
        throw new Error(`Template already exists: ${template.id}`);
      }
      templates.set(template.id, template);
    },

    async updateTemplate(options: {
      id: string;
      versions: TemplateVersions;
    }): Promise<void> {
      const existing = templates.get(options.id);
      if (!existing) {
        throw new Error(`Template not found: ${options.id}`);
      }
      templates.set(options.id, { ...existing, versions: options.versions });
    },

    async deleteTemplate(options: { id: string }): Promise<void> {
      templates.delete(options.id);
    },
  };
}
