import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const UserRoutes = ({ children }) => {
  const role = useSelector((state) => state.auth.role);
  const token = useSelector((state) => state.auth.accessToken);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'user') return <Navigate to="/admin/dashboard" replace />;

  return children;
};

export default UserRoutes;
