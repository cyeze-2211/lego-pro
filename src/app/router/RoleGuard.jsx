import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAppSelector } from '../../store/hooks';
import { ROLES, WAREHOUSE_ROLES, ZAYAVKACHI_ROLES, BUXGALTER_ROLES, KASSIR_ROLES } from '../permissions/roles';


export default function RoleGuard({ allow }) {
    const auth = useAppSelector(state => state.auth) || {};
    const { role, isAuthenticated } = auth;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (!allow || (Array.isArray(allow) && allow.length === 0) || allow === null) return <Outlet />;

    const allowedRoles = Array.isArray(allow) ? allow : [allow];

    if (!role || !allowedRoles.includes(role)) {
        // Role ga qarab to'g'ri sahifaga yo'naltir
        if (WAREHOUSE_ROLES.includes(role))         return <Navigate to="/staff" replace />;
        if (ZAYAVKACHI_ROLES.includes(role))        return <Navigate to="/zayavkachi" replace />;
        if (BUXGALTER_ROLES.includes(role))         return <Navigate to="/buxgalter" replace />;
        if (KASSIR_ROLES.includes(role))            return <Navigate to="/kassir" replace />;

        if (role === ROLES.STANOKCHI)               return <Navigate to="/stanokchi" replace />;
        if (role === ROLES.MIKSERCHI)               return <Navigate to="/mixer" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

RoleGuard.propTypes = {
    allow: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]),
};
