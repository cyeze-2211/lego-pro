import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

export default function RoleGuard({ allow }) {
    const auth = useAppSelector(state => state.auth) || {};
    const { role, isAuthenticated } = auth;

    // доступ всем, если roles = null
    if (!allow || allow.length === 0 || allow === null) return <Outlet />;

    // if (!isAuthenticated) return <Navigate to="/login" replace />;
    // if (!allow.includes(role)) return <Navigate to="/403" replace />;

    return <Outlet />;
}
