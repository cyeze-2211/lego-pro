import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Cookies from "js-cookie";
import Sidebar from "../../Components/Other/Sidebar/Sidebar";
import AdminHeader from "../../Components/Other/Header/AdminHeader";
import { useAppTheme } from "../../theme/tokens";
import { useGetUserByIdQuery } from "../../store/services/user.api";

export default function MainLayout() {
    const { isDark } = useAppTheme();
    const userId = Cookies.get("user_id");

    // Mobile: sidebar always starts closed; Desktop: starts open
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [mobileOpen, setMobileOpen] = useState(false);

    const { data: user, isLoading } = useGetUserByIdQuery(userId, {
        skip: !userId,
    });

    // Close mobile sidebar on resize to desktop
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
            }
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth < 1024) {
            setMobileOpen((prev) => !prev);
        } else {
            setSidebarOpen((prev) => !prev);
        }
    };

    // On mobile, sidebar is "open" visually when mobileOpen is true
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const effectiveSidebarOpen = isMobile ? false : sidebarOpen;

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? "theme-dark" : "theme-light"}`}>
            {/* Mobile overlay backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <Sidebar
                open={effectiveSidebarOpen}
                mobileOpen={mobileOpen}
                onToggle={toggleSidebar}
                onMobileClose={() => setMobileOpen(false)}
            />

            <div
                className={`relative min-h-screen transition-all duration-300 ${
                    effectiveSidebarOpen ? "lg:pl-[220px]" : "lg:pl-[88px]"
                }`}
            >
                <AdminHeader
                    sidebarOpen={effectiveSidebarOpen}
                    active={toggleSidebar}
                    user={user}
                    isLoading={isLoading}
                />

                <main className="px-3 pb-8 pt-[80px] sm:px-4 md:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
