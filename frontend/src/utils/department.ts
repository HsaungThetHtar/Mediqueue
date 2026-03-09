/**
 * แผนกจาก API อาจเป็น string (เก่า) หรือ object { _id, name } (ref)
 */
export function getDepartmentName(d: unknown): string {
  if (d == null) return "";
  if (typeof d === "string") return d;
  if (typeof d === "object" && d !== null && "name" in d) return (d as { name: string }).name;
  return "";
}
