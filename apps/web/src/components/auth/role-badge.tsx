import { ROLES, type Role } from '@/lib/auth/roles';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleConfig: Record<Role, { label: string; color: string }> = {
  [ROLES.ADMIN]: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  [ROLES.HEAD_COACH]: { label: 'Head Coach', color: 'bg-blue-100 text-blue-800' },
  [ROLES.ASSISTANT_COACH]: { label: 'Assistant Coach', color: 'bg-green-100 text-green-800' },
  [ROLES.PARENT]: { label: 'Parent', color: 'bg-gray-100 text-gray-800' },
};

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const config = roleConfig[role];

  if (!config) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}