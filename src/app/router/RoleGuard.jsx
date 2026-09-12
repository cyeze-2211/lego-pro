import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { ROLES, PRODUCT_WAREHOUSE_ROLES, RAW_WAREHOUSE_ROLES } from '../permissions/roles';

export default function RoleGuard({ allow }) {
    const auth = useAppSelector(state => state.auth) || {};
    const { role, isAuthenticated } = auth;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (!allow || (Array.isArray(allow) && allow.length === 0) || allow === null) return <Outlet />;

    const allowedRoles = Array.isArray(allow) ? allow : [allow];

    if (!role || !allowedRoles.includes(role)) {
        // Role ga qarab to'g'ri sahifaga yo'naltir
        if (PRODUCT_WAREHOUSE_ROLES.includes(role)) return <Navigate to="/staff" replace />;
        if (RAW_WAREHOUSE_ROLES.includes(role))     return <Navigate to="/raw-staff" replace />;
        if (role === ROLES.STANOKCHI)               return <Navigate to="/stanokchi" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
