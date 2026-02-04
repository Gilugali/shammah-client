import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasAccess, type UserRole } from '@/lib/types/role';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleGuard = ({ children, allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  const userRole = (user.role || 'receptionist') as UserRole;

  if (!hasAccess(userRole, allowedRoles)) {
    // Redirect based on role
    if (userRole === 'investor') {
      return <Navigate to="/investor-dashboard" replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};








