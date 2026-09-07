import { useState } from "react";
import { Outlet } from "react-router-dom";
import Cookies from "js-cookie"; // установите: npm install js-cookie
import Sidebar from "../../Components/Other/Sidebar/Sidebar";
import AdminHeader from "../../Components/Other/Header/AdminHeader";
import { useAppTheme } from "../../theme/tokens";
import { useGetUserByIdQuery } from "../../store/services/user.api"; // путь к вашему API

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { isDark } = useAppTheme();

    // Получаем ID пользователя из cookies (предполагаем ключ "userId")
    const userId = Cookies.get("user_id");

    // Запрашиваем данные пользователя, если ID есть
    const { data: user, isLoading, isError } = useGetUserByIdQuery(userId, {
        skip: !userId, 
    });

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? "theme-dark" : "theme-light"}`}>
            <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />

            <div className={`relative min-h-screen transition-all duration-300 ${sidebarOpen ? "pl-[220px]" : "pl-[88px]"}`}>
                <AdminHeader
                    sidebarOpen={sidebarOpen}
                    active={toggleSidebar}
                    user={user}          // передаём данные пользователя в хедер
                    isLoading={isLoading}
                />

                <main className="px-4 pb-8 pt-[80px]">
                    <div className="">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}