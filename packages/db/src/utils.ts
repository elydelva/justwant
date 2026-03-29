export function str(val: unknown): string {
  return typeof val === "string" ? val : "";
}
