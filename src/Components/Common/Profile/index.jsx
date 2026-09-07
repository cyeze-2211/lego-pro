import Cookies from "js-cookie";
import { User, ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppTheme } from "../../../theme/tokens";
import { useGetUserByIdQuery } from "../../../store/services/user.api";

export default function Profile() {
    const navigate = useNavigate();
    const { isDark } = useAppTheme();
    const userId = Cookies.get("user_id");
    const { data: user, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });

    const username = isLoading ? "Yuklanmoqda..." : user?.username || "Guest";
    const role = user?.roleName || user?.role || "No role";

    return (
        <section className="w-full py-2">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">Account</p>
                    <h1 className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Profile</h1>
                </div>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        isDark
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Orqaga
                </button>
            </div>

            <div className={`w-full overflow-hidden rounded-2xl border shadow-lg ${
                isDark ? "border-white/10 bg-[#141C2B] shadow-black/25" : "border-slate-200 bg-white shadow-slate-200/50"
            }`}>
                <div className="h-28 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500" />
                <div className="px-5 pb-7 sm:px-8 lg:px-10">
                    {/* Avatar: solid, high-contrast circle with a ring that matches the card
                        background, so it reads as a separate layer above the gradient
                        instead of blending into it. */}
                    <div
                        className={`-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl shadow-md ring-4 ${
                            isDark
                                ? "bg-white ring-[#141C2B]"
                                : "bg-slate-900 ring-white"
                        }`}
                    >
                        <User className={`h-9 w-9 ${isDark ? "text-slate-900" : "text-amber-400"}`} />
                    </div>
                    <h2 className={`mt-4 text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{username}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">PLASTPRO administrator profile</p>

                    <div className="mt-7 grid gap-3 md:grid-cols-2">
                        <div className={`flex items-center gap-3 rounded-xl border p-4 ${isDark ? "border-white/10 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-amber-400/15" : "bg-amber-100"}`}>
                                <ShieldCheck className={`h-5 w-5 ${isDark ? "text-amber-300" : "text-amber-600"}`} />
                            </span>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                                <p className={`mt-0.5 text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{role}</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-3 rounded-xl border p-4 ${isDark ? "border-white/10 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-amber-400/15" : "bg-amber-100"}`}>
                                <Mail className={`h-5 w-5 ${isDark ? "text-amber-300" : "text-amber-600"}`} />
                            </span>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Username</p>
                                <p className={`mt-0.5 truncate text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{username}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}