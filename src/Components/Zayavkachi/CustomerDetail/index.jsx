import { useNavigate, useParams } from 'react-router-dom';
import {
    LuArrowLeft, LuUser, LuPhone, LuStickyNote, LuClock3,
    LuCircleAlert, LuPencil, LuPlus, LuClipboardList, LuEye,
} from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import Loading from '../../Other/UI/Loadings/Loading';
import DeleteCustomer from '../__components/DeleteCustomer';
import { STATUS_LABEL, statusCx } from '../__components/statusBadge';

const ORDERS_SIZE = 20;

export default function ZayavkachiCustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDark } = useAppTheme();

    const { data: customer, isLoading, isError } = useGetCustomerByIdQuery(id, { skip: !id });
    const { data: ordersData, isFetching: isOrdersFetching } = useGetSalesOrdersQuery(
        { customerId: id, size: ORDERS_SIZE },
        { skip: !id }
    );

    const panel   = isDark ? 'border-white/10 bg-[#141C2B]' : 'border-[#e2e8f0] bg-white';
    const muted   = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]';
    const head    = isDark ? 'text-white' : 'text-[#0f172a]';
    const divider = isDark ? 'divide-[#334155]/50' : 'divide-[#f1f5f9]';
    const line    = isDark ? 'border-[#334155]/60' : 'border-[#f1f5f9]';
    const rowHov  = isDark ? 'hover:bg-[#1e293b]/60' : 'hover:bg-amber-50/50';
    const ghostBtn = isDark
        ? 'border-[#334155] text-[#94a3b8] hover:bg-[#1e293b]'
        : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]';
    const iconBtn = isDark
        ? 'flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-[#64748b] hover:bg-[#1e293b] hover:text-amber-400'
        : 'flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-[#94a3b8] hover:bg-amber-50 hover:text-amber-500';

    const backToList = () => navigate('/zayavkachi/customers');

    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !customer) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Mijozni yuklashda xatolik</p>
                <button type="button" onClick={backToList}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Mijozlar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    const orders  = ordersData?.items ?? [];
    const balance = Number(customer.balance) || 0;

    const renderBalance = () => {
        if (balance > 0) return <span className="font-bold text-[#f43f5e]">{balance.toLocaleString('uz-UZ')} so&apos;m (qarzdor)</span>;
        if (balance < 0) return <span className="font-bold text-[#10b981]">{Math.abs(balance).toLocaleString('uz-UZ')} so&apos;m (kredit)</span>;
        return <span className={`font-bold ${head}`}>0 so&apos;m</span>;
    };

    return (
        <div className="flex w-full flex-col gap-4 py-2">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-md ${panel}`}>
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-amber-400/6 to-transparent" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-500">
                            <LuUser size={20} />
                        </span>
                        <div>
                            <h1 className={`text-xl font-bold tracking-tight leading-tight ${head}`}>{customer.name}</h1>
                            <p className={`text-sm mt-0.5 flex items-center gap-1.5 ${muted}`}>
                                <LuPhone size={13} />{customer.phone}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => navigate(`/zayavkachi/customers/${customer.id}/orders/new`)}
                            className="flex h-12 items-center gap-2 rounded-xl bg-[#FACC15] px-6 text-sm font-bold text-[#0F172A] shadow-lg shadow-[#FACC15]/30 transition-all duration-200 hover:-translate-y-px hover:bg-[#EAB308] hover:shadow-xl">
                            <LuPlus size={16} /> Buyurtma yaratish
                        </button>
                        <button type="button" onClick={() => navigate(`/zayavkachi/customers/${customer.id}/edit`)}
                            className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                            <LuPencil size={16} /> Tahrirlash
                        </button>
                        <DeleteCustomer customer={customer} onDeleted={backToList} />
                        <button type="button" onClick={backToList}
                            className={`flex h-12 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-colors ${ghostBtn}`}>
                            <LuArrowLeft size={16} /> Mijozlar
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Ma'lumotlar ───────────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuUser size={12} /> Mijoz nomi</p>
                        <p className={`text-sm font-bold ${head}`}>{customer.name}</p>
                    </div>
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuPhone size={12} /> Telefon</p>
                        <p className={`text-sm font-bold ${head}`}>{customer.phone || '—'}</p>
                    </div>
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuClock3 size={12} /> Qoldiq</p>
                        <p className="text-sm">{renderBalance()}</p>
                    </div>
                    <div>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}><LuClock3 size={12} /> Yaratilgan</p>
                        <p className={`text-sm font-bold ${head}`}>
                            {customer.createdAt ? new Date(customer.createdAt).toLocaleString('uz-UZ') : '—'}
                        </p>
                    </div>
                </div>

                {customer.summary && (
                    <div className={`mx-5 mb-5 rounded-xl border px-4 py-3 ${isDark ? 'border-[#334155] bg-[#1e293b]/50' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                        <p className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${muted}`}>
                            <LuStickyNote size={12} /> Izoh
                        </p>
                        <p className={`text-sm ${head}`}>{customer.summary}</p>
                    </div>
                )}
            </div>

            {/* ── Mijoz buyurtmalari ────────────────────────────────────── */}
            <div className={`rounded-2xl border shadow-md ${panel}`}>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${line}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
                            <LuClipboardList size={15} />
                        </span>
                        <div>
                            <p className={`text-sm font-bold ${head}`}>Mijoz buyurtmalari</p>
                            <p className={`text-xs ${muted}`}>Shu mijoz uchun yaratilgan zayavkalar</p>
                        </div>
                    </div>
                    {orders.length > 0 && (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-500">
                            {ordersData?.pagination?.totalElements ?? orders.length}
                        </span>
                    )}
                </div>

                {isOrdersFetching ? (
                    <div className={`flex items-center justify-center gap-2 py-12 text-sm ${muted}`}>
                        <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Yuklanmoqda...
                    </div>
                ) : orders.length === 0 ? (
                    <div className={`flex flex-col items-center gap-2 py-12 ${muted}`}>
                        <LuClipboardList size={34} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Buyurtmalar topilmadi</p>
                        <p className="text-xs">Yuqoridagi &quot;Buyurtma yaratish&quot; tugmasi orqali qo&apos;shing</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${muted} ${isDark ? 'bg-[#0f172a]/30' : 'bg-[#f8fafc]/80'}`}>
                                    <th className="px-5 py-3 w-14">№</th>
                                    <th className="px-5 py-3 w-32">Mahsulot</th>
                                    <th className="px-5 py-3">Izoh</th>
                                    <th className="px-5 py-3 w-44 text-right">Jami summa</th>
                                    <th className="px-5 py-3 w-40">Holat</th>
                                    <th className="px-5 py-3 w-44">Sana</th>
                                    <th className="px-5 py-3 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {orders.map((o, idx) => (
                                    <tr key={o.id} className={`transition-colors ${rowHov}`}>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>{idx + 1}</td>
                                        <td className={`px-5 py-3 text-xs font-semibold ${muted}`}>{o.items?.length ?? 0} ta</td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            <span className="block max-w-xs truncate">{o.summary || '—'}</span>
                                        </td>
                                        <td className={`px-5 py-3 text-right font-bold ${head}`}>
                                            {(o.totalAmount ?? 0).toLocaleString('uz-UZ')} so&apos;m
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusCx(o.status)}`}>
                                                {STATUS_LABEL[o.status] ?? o.status}
                                            </span>
                                        </td>
                                        <td className={`px-5 py-3 text-xs ${muted}`}>
                                            {o.createdAt ? new Date(o.createdAt).toLocaleString('uz-UZ') : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button type="button" onClick={() => navigate(`/zayavkachi/orders/${o.id}`)}
                                                aria-label="Ko'rish" title="Ko'rish" className={iconBtn}>
                                                <LuEye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
