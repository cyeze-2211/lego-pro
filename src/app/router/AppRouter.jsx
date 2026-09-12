// router/AppRouter.jsx
import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import MainLayout from '../layout/MainLayout';
import StanokchiLayout from '../layout/StanokchiLayout';
import RoleGuard from './RoleGuard';
import { ROUTES, STANOKCHI_ROLES } from './routes.config';
import { ROLES } from '../permissions/roles';
import Loading from '../../Components/Other/UI/Loadings/Loading';
import Login from '../../Components/Common/Login';

// Stanokchi routelarini ajratib olamiz
const stanokchiRoutes = ROUTES.filter(r =>
    Array.isArray(r.roles)
        ? r.roles.includes(ROLES.STANOKCHI)
        : r.roles === ROLES.STANOKCHI
);

// Qolgan barcha routelar (MainLayout uchun)
const mainRoutes = ROUTES.filter(r =>
    !(Array.isArray(r.roles)
        ? r.roles.includes(ROLES.STANOKCHI)
        : r.roles === ROLES.STANOKCHI)
);

export default function AppRouter() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* ── Asosiy layout (sidebar bilan) ── */}
                <Route element={<MainLayout />}>
                    {mainRoutes.map(r => (
                        <Route key={r.path} element={<RoleGuard allow={r.roles} />}>
                            <Route path={r.path} element={<r.component />} />
                        </Route>
                    ))}
                </Route>

                {/* ── Stanokchi layout (sidebar yo'q) ── */}
                <Route element={<RoleGuard allow={STANOKCHI_ROLES} />}>
                    <Route element={<StanokchiLayout />}>
                        {stanokchiRoutes.map(r => (
                            <Route key={r.path} path={r.path} element={<r.component />} />
                        ))}
                    </Route>
                </Route>

                {/* ── Login ── */}
                <Route path="/login" element={<Login />} />
            </Routes>
        </Suspense>
    );
}
