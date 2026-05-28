import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoutes = ({ children }) => {
  const role = useSelector((state) => state.auth.role);
  const token = useSelector((state) => state.auth.accessToken);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/chat" replace />;

  return children;
};

export default AdminRoutes;
