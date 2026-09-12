import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { PRODUCT_WAREHOUSE_ROLES, RAW_WAREHOUSE_ROLES, ZAYAVKACHI_ROLES } from '../permissions/roles';

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
        if (ZAYAVKACHI_ROLES.includes(role))        return <Navigate to="/zayavkachi" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
