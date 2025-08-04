export const ROLES = {
  ADMIN: 'admin',
  HEAD_COACH: 'head_coach',
  ASSISTANT_COACH: 'assistant_coach',
  PARENT: 'parent',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.ADMIN]: 4,
  [ROLES.HEAD_COACH]: 3,
  [ROLES.ASSISTANT_COACH]: 2,
  [ROLES.PARENT]: 1,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasExactRole(userRole: Role, requiredRole: Role): boolean {
  return userRole === requiredRole;
}

export function getUserRoleInClub(
  userClubs: Array<{ role: string; clubId: string; status: string }>,
  clubId: string
): Role | null {
  const userClub = userClubs.find(
    (uc) => uc.clubId === clubId && uc.status === 'active'
  );
  return userClub ? (userClub.role as Role) : null;
}

export function getHighestRole(
  userClubs: Array<{ role: string; status: string }>
): Role | null {
  const activeRoles = userClubs
    .filter((uc) => uc.status === 'active')
    .map((uc) => uc.role as Role);
  
  if (activeRoles.length === 0) return null;
  
  return activeRoles.reduce((highest, current) => {
    return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest;
  });
}