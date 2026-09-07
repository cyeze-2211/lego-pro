import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

export default function RoleGuard({ allow }) {
    const auth = useAppSelector(state => state.auth) || {};
    const { role, isAuthenticated } = auth;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (!allow || (Array.isArray(allow) && allow.length === 0) || allow === null) return <Outlet />;

    const allowedRoles = Array.isArray(allow) ? allow : [allow];
    if (role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

    return <Outlet />;
}
