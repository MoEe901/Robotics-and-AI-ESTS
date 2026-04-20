/**
 * Canonical labels for `teamMembers.schoolStatus` and department picklists.
 * Department options depend on school status (see `departmentsForSchoolStatus`).
 */

export const SCHOOL_STATUS_OPTIONS = [
  "DUT 1st year",
  "DUT 2nd year",
  "license",
  "master",
  "doctoral",
  "professor",
] as const;

export type SchoolStatusOption = (typeof SCHOOL_STATUS_OPTIONS)[number];

/** Full list of department codes used in the club (reference + legacy “unknown” bucket). */
export const ALL_DEPARTMENT_CODES = [
  "GI",
  "TM",
  "GIM",
  "GESA",
  "HQSE",
  "EDHV",
  "IMPC",
  "MIA",
  "GCF",
  "MQSE",
  "ISIR",
] as const;

const DUT_DEPARTMENTS: readonly string[] = ["GI", "TM", "GIM", "GESA", "HQSE", "EDHV", "IMPC"];

const LICENSE_DEPARTMENTS: readonly string[] = ["MIA", "GCF", "MQSE", "ISIR"];

export type SchoolStatusDepartmentMode = "dut" | "license" | "none" | "unknown";

export function schoolStatusDepartmentMode(status: string): SchoolStatusDepartmentMode {
  const s = status.trim().toLowerCase();
  if (s === "dut 1st year" || s === "dut 2nd year") return "dut";
  if (s === "license") return "license";
  if (s === "master" || s === "doctoral" || s === "professor") return "none";
  return "unknown";
}

/** Allowed department codes for this school status; empty array when department must stay empty. */
export function departmentsForSchoolStatus(status: string): readonly string[] {
  const mode = schoolStatusDepartmentMode(status);
  if (mode === "dut") return DUT_DEPARTMENTS;
  if (mode === "license") return LICENSE_DEPARTMENTS;
  if (mode === "none") return [];
  return ALL_DEPARTMENT_CODES as unknown as readonly string[];
}

export function departmentMustBeEmpty(status: string): boolean {
  return schoolStatusDepartmentMode(status) === "none";
}
