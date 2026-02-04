export type UserRole = "receptionist" | "owner" | "admin" | "investor";

export const hasAccess = (
  userRole: UserRole | string,
  allowedRoles: UserRole[],
): boolean => {
  return allowedRoles.includes(userRole as UserRole);
};

export const isAdmin = (role: UserRole | string): boolean => role === "admin";
export const isReceptionist = (role: UserRole | string): boolean =>
  role === "receptionist";
export const isowner = (role: UserRole | string): boolean => role === "owner";
export const isInvestor = (role: UserRole | string): boolean =>
  role === "investor";






