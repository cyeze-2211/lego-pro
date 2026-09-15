import { Outlet } from "react-router-dom";
import Cookies from "js-cookie";
import StanokchiHeader from "../../Components/Stanokchi/StanokchiHeader";
import { useAppTheme } from "../../theme/tokens";
import { useGetUserByIdQuery } from "../../store/services/user.api";

export default function MixerLayout() {
    const { isDark } = useAppTheme();
    const userId = Cookies.get("user_id");
    const { data: user } = useGetUserByIdQuery(userId, { skip: !userId });

    return (
        <div className={`min-h-screen w-full transition-colors duration-300 ${isDark ? "theme-dark" : "theme-light"}`}>
            <StanokchiHeader user={user} title="Mixer Panel" />
            <main className="mx-auto max-w-7xl px-3 pb-8 pt-[88px] sm:px-4 md:px-6">
                <Outlet />
            </main>
        </div>
    );
}