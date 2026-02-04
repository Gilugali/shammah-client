import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Outlet />
    </div>
  );
};

export default AuthLayout;


