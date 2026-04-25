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

/** Departments for DUT (1st & 2nd year) students — same codes as team member picklists. */
export const DUT_DEPARTMENTS: readonly string[] = ["GI", "TM", "GIM", "GESA", "HQSE", "EDHV", "IMPC"];

/** Departments for Licence-level students. */
export const LICENSE_DEPARTMENTS: readonly string[] = ["MIA", "GCF", "MQSE", "ISIR"];

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

/**
 * Maps the public apply form's free-text / admin-configured "education year" option
 * to which department bucket applies. Uses substring heuristics so admins can keep
 * custom labels like "1st Year" or "DUT 1st year".
 */
export type ApplyEducationYearDepartmentMode = "dut" | "license" | "none" | "unknown";

export function applyEducationYearDepartmentMode(yearLabel: string): ApplyEducationYearDepartmentMode {
  const y = yearLabel.trim().toLowerCase();
  if (!y) return "unknown";
  if (y.includes("license") || y.includes("licence")) return "license";
  if (
    y.includes("master") ||
    y.includes("doctoral") ||
    y.includes("professor") ||
    (y.includes("doctor") && !y.includes("dut"))
  ) {
    return "none";
  }
  if (y.includes("1st") || y.includes("first") || y.includes("year 1") || y.includes("dut 1")) {
    return "dut";
  }
  if (y.includes("2nd") || y.includes("second") || y.includes("year 2") || y.includes("dut 2")) {
    return "dut";
  }
  if (y.includes("3rd") || y.includes("third") || y.includes("year 3")) return "license";
  return "unknown";
}

/** Department `<select>` options for the apply form for the selected education year. */
export function departmentOptionsForApplyEducationYear(
  yearLabel: string,
  configuredOptions: readonly string[],
): string[] {
  const mode = applyEducationYearDepartmentMode(yearLabel);
  if (mode === "none") return [];
  if (mode === "unknown") {
    return configuredOptions.length ? [...configuredOptions] : [...ALL_DEPARTMENT_CODES];
  }
  const allow = new Set(mode === "dut" ? DUT_DEPARTMENTS : LICENSE_DEPARTMENTS);
  const filtered = configuredOptions.filter((d) => allow.has(d.trim()));
  if (filtered.length > 0) return filtered;
  return [...(mode === "dut" ? DUT_DEPARTMENTS : LICENSE_DEPARTMENTS)];
}
