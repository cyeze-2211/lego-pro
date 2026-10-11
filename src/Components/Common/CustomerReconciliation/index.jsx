import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Badge, Box, Button, HStack, Heading, SimpleGrid, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import {
    LuArrowDownLeft, LuArrowUpRight, LuCalendarDays, LuCircleAlert, LuClipboardList, LuCreditCard,
    LuFileSpreadsheet, LuFileText, LuImage, LuRotateCcw, LuScale, LuUndo2, LuUsers,
} from 'react-icons/lu';
import Select from 'react-select';
import { useGetCustomersQuery, useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import { useGetSalesOrdersQuery } from '../../../store/services/salesOrder.api';
import { useGetPaymentsQuery } from '../../../store/services/payment.api';
import { formatNumber } from '../../ui/number-format';
import { formatDate, formatDateTime, todayIso, toDate } from '../../ui/date-format';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';

/* Dalolatnomada ko‘rsatiladigan tashkilot nomi */
const COMPANY_NAME = 'Zafar Lux';
const BIG_PAGE = 1000;

/* ── Sana yordamchilari ────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOf = (value) => { const d = toDate(value); return d ? iso(d) : ''; };

const DATE_PRESETS = [
    { key: 'today', label: 'Bugun', range: () => [todayIso(), todayIso()] },
    { key: 'week', label: 'Shu hafta', range: () => { const d = new Date(); const f = new Date(d); f.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [iso(f), iso(d)]; } },
    { key: 'month', label: 'Shu oy', range: () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(d)]; } },
    { key: 'prevMonth', label: 'O‘tgan oy', range: () => { const d = new Date(); return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1)), iso(new Date(d.getFullYear(), d.getMonth(), 0))]; } },
    { key: 'all', label: 'Barcha vaqt', range: () => ['', todayIso()] },
];

const money = (value) => formatNumber(Math.round((Number(value) || 0) * 100) / 100);

/* ── Dalolatnoma hisob-kitobi ──────────────────────────────────────────── */
/*
 * Debet — mijozning qarzi oshadi (tasdiqlangan buyurtma), Kredit — qarz kamayadi (to‘lov, qaytarish).
 * Saldo: musbat — mijoz qarzdor, manfiy — mijozda avans bor.
 * Davr boshidagi saldo joriy balansdan orqaga hisoblanadi, shuning uchun yakuniy saldo har doim
 * haqiqiy balans bilan mos keladi.
 */
function buildStatement({ orders, payments, balance, dateFrom, dateTo }) {
    const events = [];

    orders.forEach((order) => {
        if (order.status !== 'CONFIRMED' && order.status !== 'RETURNED') return;
        const at = order.decidedAt || order.createdAt;
        const itemsCount = order.items?.length ?? 0;
        events.push({
            id: `order-${order.id}`,
            kind: 'order',
            at,
            day: dayOf(at),
            title: `Sotuv (buyurtma) — ${formatDateTime(at)}`,
            note: [itemsCount ? `${itemsCount} ta mahsulot` : null, order.summary].filter(Boolean).join(' | '),
            debet: Number(order.totalAmount) || 0,
            kredit: 0,
        });
        if (order.status === 'RETURNED') {
            const rAt = order.returnedAt || order.lastModifiedAt || at;
            events.push({
                id: `return-${order.id}`,
                kind: 'return',
                at: rAt,
                day: dayOf(rAt),
                title: `Buyurtma qaytarildi — ${formatDateTime(rAt)}`,
                note: order.returnReason || 'Qaytarilgan buyurtma',
                debet: 0,
                kredit: Number(order.totalAmount) || 0,
            });
        }
    });

    payments.forEach((payment) => {
        if (payment.status !== 'ACTIVE') return;
        const at = payment.paidAt && payment.createdAt && dayOf(payment.paidAt) === dayOf(payment.createdAt) ? payment.createdAt : payment.paidAt || payment.createdAt;
        events.push({
            id: `payment-${payment.id}`,
            kind: 'payment',
            at,
            day: dayOf(at),
            title: `Kirim kassa orderi — ${payment.cashboxName || 'Kassa'}`,
            note: [payment.currency === 'USD' && Number(payment.usdRate) > 0 ? `$ ${money((Number(payment.amount) || 0) / Number(payment.usdRate))} × ${money(payment.usdRate)}` : null, payment.summary].filter(Boolean).join(' | '),
            debet: 0,
            kredit: Number(payment.amount) || 0,
        });
    });

    events.sort((a, b) => (toDate(a.at)?.getTime() ?? 0) - (toDate(b.at)?.getTime() ?? 0));

    const inPeriod = (e) => (!dateFrom || e.day >= dateFrom) && (!dateTo || e.day <= dateTo);
    const afterPeriod = (e) => Boolean(dateTo) && e.day > dateTo;

    const debtNow = -(Number(balance) || 0);
    const after = events.filter(afterPeriod);
    const period = events.filter(inPeriod);

    const sum = (list, key) => list.reduce((acc, e) => acc + e[key], 0);
    const closing = debtNow - sum(after, 'debet') + sum(after, 'kredit');
    const turnoverDebet = sum(period, 'debet');
    const turnoverKredit = sum(period, 'kredit');
    const opening = closing - turnoverDebet + turnoverKredit;

    return { rows: period, opening, closing, turnoverDebet, turnoverKredit };
}

/* ── Kichik UI ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, color, bg }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    return (
        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" p={{ base: 4, md: 5 }} minW={0} boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'}>
            <HStack gap={3} align="start">
                <Box p={2.5} borderRadius="xl" bg={bg} color={color} flexShrink={0}><Icon size={20} /></Box>
                <Box minW={0} flex={1}>
                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>{label}</Text>
                    <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={color || textColor} lineHeight="1.2" mt={1} truncate>{value}</Text>
                    {sub && <Text fontSize="sm" color={subtitleColor} mt={1}>{sub}</Text>}
                </Box>
            </HStack>
        </Box>
    );
}
StatCard.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, sub: PropTypes.node, color: PropTypes.string, bg: PropTypes.string };

/* ── Dalolatnoma (qog‘oz ko‘rinishi; faqat oddiy HTML + inline uslublar, mavzudan mustaqil) ── */
const PAPER = { text: '#111827', muted: '#4B5563', line: '#111827', head: '#F3F4F6', blue: '#1D4ED8' };

function describeSaldo(value, customerName) {
    if (value > 0) return `${customerName} ${COMPANY_NAME} ga ${money(value)} so‘m qarzdor`;
    if (value < 0) return `${customerName} da ${money(-value)} so‘m avans bor (oldindan to‘lagan)`;
    return 'Qarz ham, avans ham yo‘q';
}

function Statement({ statement, customer, dateFrom, dateTo, innerRef }) {
    const { rows, opening, closing, turnoverDebet, turnoverKredit } = statement;
    const name = customer?.name || 'Mijoz';
    const endDate = formatDate(dateTo || todayIso());
    const periodLabel = `${dateFrom ? formatDate(dateFrom) : 'boshidan'} — ${endDate}`;
    const cell = { border: `1px solid ${PAPER.line}`, padding: '6px 8px', fontSize: '13px', verticalAlign: 'top', color: PAPER.text };
    const num = { ...cell, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
    const th = { ...cell, textAlign: 'center', fontWeight: 700, background: PAPER.head };
    const saldoRow = (label, value) => (
        <tr className="sverka-total">
            <td style={{ ...cell, fontWeight: 700 }} colSpan={2}>{label}</td>
            <td style={{ ...num, fontWeight: 700 }}>{value > 0 ? money(value) : ''}</td>
            <td style={{ ...num, fontWeight: 700 }}>{value < 0 ? money(-value) : ''}</td>
            <td style={{ ...cell, color: PAPER.muted }}>{value > 0 ? 'Mijoz qarzdor' : value < 0 ? 'Mijozda avans bor' : 'Qarz yo‘q'}</td>
        </tr>
    );

    return (
        <div ref={innerRef} className="sverka-paper" style={{ background: '#ffffff', color: PAPER.text, padding: '32px 36px', fontFamily: 'Arial, Helvetica, sans-serif', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Solishtirma dalolatnomasi (akt sverka)</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{COMPANY_NAME} va {name} o‘rtasida</div>
                <div style={{ fontSize: 13, color: PAPER.muted, marginTop: 4 }}>{periodLabel} davri uchun</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13, marginBottom: 12 }}>
                <div>
                    <div><b>Tashkilot:</b> {COMPANY_NAME}</div>
                    <div><b>Mijoz:</b> {name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {customer?.phone && <div><b>Telefon:</b> {customer.phone}</div>}
                    {customer?.inn && <div><b>INN / STIR:</b> {customer.inn}</div>}
                    <div><b>Tuzilgan sana:</b> {formatDateTime(new Date())}</div>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ ...th, width: '36%' }}>Hujjat</th>
                        <th rowSpan={2} style={{ ...th, width: '12%' }}>Sana</th>
                        <th colSpan={2} style={th}>Summa, so‘m</th>
                        <th rowSpan={2} style={th}>Izoh</th>
                    </tr>
                    <tr>
                        <th style={{ ...th, width: '16%' }}>Sotuv<br /><span style={{ fontWeight: 400, fontSize: 11, color: PAPER.muted }}>qarz oshdi</span></th>
                        <th style={{ ...th, width: '16%' }}>To‘lov<br /><span style={{ fontWeight: 400, fontSize: 11, color: PAPER.muted }}>qarz kamaydi</span></th>
                    </tr>
                </thead>
                <tbody>
                    {saldoRow(`Davr boshida (${dateFrom ? formatDate(dateFrom) : 'boshidan'})`, opening)}
                    {rows.length === 0 && (
                        <tr><td style={{ ...cell, textAlign: 'center', color: PAPER.muted }} colSpan={5}>Bu davrda hujjatlar yo‘q</td></tr>
                    )}
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td style={cell}>{row.title}</td>
                            <td style={{ ...cell, whiteSpace: 'nowrap' }}>{formatDate(row.at)}</td>
                            <td style={num}>{row.debet ? money(row.debet) : ''}</td>
                            <td style={num}>{row.kredit ? money(row.kredit) : ''}</td>
                            <td style={{ ...cell, color: PAPER.muted }}>{row.note || ''}</td>
                        </tr>
                    ))}
                    <tr className="sverka-total">
                        <td style={{ ...cell, fontWeight: 700, color: PAPER.blue }} colSpan={2}>Davr jami</td>
                        <td style={{ ...num, fontWeight: 700, color: PAPER.blue }}>{money(turnoverDebet)}</td>
                        <td style={{ ...num, fontWeight: 700, color: PAPER.blue }}>{money(turnoverKredit)}</td>
                        <td style={cell} />
                    </tr>
                    {saldoRow(`Davr oxirida (${endDate})`, closing)}
                </tbody>
            </table>

            <div style={{ fontSize: 13, marginTop: 16 }}>
                <b>Xulosa:</b> {endDate} holatiga ko‘ra {describeSaldo(closing, name)}.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 32, fontSize: 13 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>{COMPANY_NAME}</div>
                    <div style={{ borderBottom: `1px solid ${PAPER.line}`, height: 34 }} />
                    <div style={{ color: PAPER.muted, fontSize: 11, marginTop: 4 }}>imzo / M.O‘.</div>
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ borderBottom: `1px solid ${PAPER.line}`, height: 34 }} />
                    <div style={{ color: PAPER.muted, fontSize: 11, marginTop: 4 }}>imzo / M.O‘.</div>
                </div>
            </div>
        </div>
    );
}
Statement.propTypes = {
    statement: PropTypes.object.isRequired, customer: PropTypes.object, dateFrom: PropTypes.string, dateTo: PropTypes.string,
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
};

/* ── Sahifa ────────────────────────────────────────────────────────────── */
export default function CustomerReconciliation() {
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor, inputBg, inputBorder } = useAppTheme();
    const paperRef = useRef(null);

    const [selected, setSelected] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [dateFrom, setDateFrom] = useState(() => DATE_PRESETS[2].range()[0]);
    const [dateTo, setDateTo] = useState(todayIso());
    const [exporting, setExporting] = useState('');

    const customerId = selected?.value ?? null;

    const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery({ name: customerSearch || undefined, page: 0, size: 50 });
    const customerOptions = (customersData?.items ?? []).map((c) => ({ value: c.id, label: c.name, phone: c.phone, balance: c.balance }));

    const { data: customer, isFetching: customerFetching } = useGetCustomerByIdQuery(customerId, { skip: !customerId });
    const { data: ordersData, isFetching: ordersFetching, isError: ordersError } = useGetSalesOrdersQuery({ customerId, page: 0, size: BIG_PAGE, sort: ['createdAt,ASC', 'id,ASC'] }, { skip: !customerId });
    const { data: paymentsData, isFetching: paymentsFetching, isError: paymentsError } = useGetPaymentsQuery({ customerId, page: 0, size: BIG_PAGE, sort: ['paidAt,ASC', 'createdAt,ASC'] }, { skip: !customerId });

    const loading = customerFetching || ordersFetching || paymentsFetching;
    const orders = useMemo(() => ordersData?.items ?? [], [ordersData]);
    const payments = useMemo(() => paymentsData?.items ?? [], [paymentsData]);

    const statement = useMemo(
        () => buildStatement({ orders, payments, balance: customer?.balance ?? selected?.balance ?? 0, dateFrom, dateTo }),
        [orders, payments, customer, selected, dateFrom, dateTo],
    );

    const activePreset = DATE_PRESETS.find((p) => { const [f, t] = p.range(); return dateFrom === f && dateTo === t; })?.key;
    const applyPreset = (preset) => { const [f, t] = preset.range(); setDateFrom(f); setDateTo(t); };
    const resetAll = () => { setSelected(null); setCustomerSearch(''); applyPreset(DATE_PRESETS[2]); };

    const fileBase = () => `Sverka_${(customer?.name || 'mijoz').replace(/[^\p{L}\p{N}]+/gu, '_')}_${dateFrom || 'boshidan'}_${dateTo || todayIso()}`;

    const downloadPng = async () => {
        if (!paperRef.current) return;
        setExporting('png');
        try {
            const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
            const link = document.createElement('a');
            link.download = `${fileBase()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            Alert('Dalolatnoma rasm sifatida yuklab olindi', 'success');
        } catch (err) {
            console.error(err);
            Alert('Rasmga aylantirishda xatolik', 'error');
        } finally {
            setExporting('');
        }
    };

    const downloadExcel = () => {
        setExporting('xlsx');
        try {
            const { rows, opening, closing, turnoverDebet, turnoverKredit } = statement;
            const aoa = [
                ['SOLISHTIRMA DALOLATNOMASI (AKT SVERKA)'],
                [`${COMPANY_NAME} va ${customer?.name || ''} o‘rtasida`],
                [`Davr: ${dateFrom ? formatDate(dateFrom) : 'boshidan'} — ${formatDate(dateTo || todayIso())}`],
                [],
                ['Hujjat', 'Sana', 'Sotuv (qarz oshdi), so‘m', 'To‘lov (qarz kamaydi), so‘m', 'Izoh'],
                [`Davr boshida (${dateFrom ? formatDate(dateFrom) : 'boshidan'})`, '', opening > 0 ? opening : '', opening < 0 ? -opening : '', opening > 0 ? 'Mijoz qarzdor' : opening < 0 ? 'Mijozda avans bor' : ''],
                ...rows.map((r) => [r.title, formatDate(r.at), r.debet || '', r.kredit || '', r.note || '']),
                ['Davr jami', '', turnoverDebet, turnoverKredit, ''],
                [`Davr oxirida (${formatDate(dateTo || todayIso())})`, '', closing > 0 ? closing : '', closing < 0 ? -closing : '', closing > 0 ? 'Mijoz qarzdor' : closing < 0 ? 'Mijozda avans bor' : 'Qarz yo‘q'],
            ];
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            ws['!cols'] = [{ wch: 44 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sverka');
            XLSX.writeFile(wb, `${fileBase()}.xlsx`);
            Alert('Excel fayl yuklab olindi', 'success');
        } catch (err) {
            console.error(err);
            Alert('Eksportda xatolik', 'error');
        } finally {
            setExporting('');
        }
    };

    /* react-select */
    const selectStyles = {
        control: (base, state) => ({ ...base, minHeight: 44, borderRadius: 12, borderColor: state.isFocused ? '#FACC15' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'), backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#fff', boxShadow: state.isFocused ? '0 0 0 2px rgba(250,204,21,.2)' : 'none', '&:hover': { borderColor: '#FACC15' }, fontSize: 14 }),
        option: (base, state) => ({ ...base, backgroundColor: state.isSelected ? '#FACC15' : state.isFocused ? (isDark ? 'rgba(250,204,21,.12)' : '#FFFBEB') : (isDark ? '#141C2B' : '#fff'), color: state.isSelected ? '#0F172A' : (isDark ? '#e2e8f0' : '#0f172a'), fontSize: 14, cursor: 'pointer' }),
        menu: (base) => ({ ...base, backgroundColor: isDark ? '#141C2B' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: 12, zIndex: 50 }),
        singleValue: (base) => ({ ...base, color: isDark ? '#f1f5f9' : '#0f172a' }),
        placeholder: (base) => ({ ...base, color: isDark ? '#64748b' : '#94a3b8', fontSize: 14 }),
        input: (base) => ({ ...base, color: isDark ? '#f1f5f9' : '#0f172a' }),
        noOptionsMessage: (base) => ({ ...base, color: isDark ? '#64748b' : '#94a3b8', fontSize: 14 }),
    };
    const formatOptionLabel = (opt) => {
        const b = Number(opt.balance) || 0;
        return (
            <div className="flex items-center justify-between gap-2 py-0.5">
                <div><div className="font-semibold text-sm">{opt.label}</div>{opt.phone && <div className="text-xs opacity-60">{opt.phone}</div>}</div>
                <span className={`text-xs font-bold shrink-0 ${b < 0 ? 'text-red-500' : b > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                    {b < 0 ? `qarz ${money(-b)}` : b > 0 ? `avans ${money(b)}` : '0'} so‘m
                </span>
            </div>
        );
    };

    const inputCx = { h: '44px', px: 3, w: '100%', borderRadius: 'xl', borderWidth: '1px', borderColor: inputBorder, bg: inputBg, color: textColor, fontSize: 'sm', outline: 'none', _focus: { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}44` } };
    const accentSoft = isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7';
    const red = isDark ? '#FCA5A5' : '#B91C1C';
    const redSoft = isDark ? 'rgba(239,68,68,.14)' : '#FEE2E2';
    const green = isDark ? '#86EFAC' : '#15803D';
    const greenSoft = isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7';
    const sky = isDark ? '#7DD3FC' : '#0284C7';
    const skySoft = isDark ? 'rgba(14,165,233,.12)' : '#E0F2FE';
    const panelShadow = isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)';
    const saldoMeta = (v) => (v > 0 ? { color: red, bg: redSoft, label: 'Mijoz qarzdor' } : v < 0 ? { color: green, bg: greenSoft, label: 'Mijozda avans bor' } : { color: textColor, bg: isDark ? 'rgba(148,163,184,.12)' : '#F1F5F9', label: 'Qarz yo‘q' });
    const th = { color: subtitleColor, fontSize: '11px', fontWeight: 'semibold', textTransform: 'uppercase', letterSpacing: 'wider', whiteSpace: 'nowrap', bg: isDark ? 'rgba(148,163,184,0.06)' : '#F8FAFC' };
    const openMeta = saldoMeta(statement.opening);
    const closeMeta = saldoMeta(statement.closing);
    const hasData = Boolean(customerId) && !loading;

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            {/* ── Sarlavha ── */}
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Akt sverka</Heading>
                    <Text color={subtitleColor} fontSize="sm" mt={1}>Mijoz bilan o‘zaro hisob-kitoblar bo‘yicha solishtirma dalolatnomasi</Text>
                </Box>
                <HStack gap={2} flexWrap="wrap">
                    <Button variant="outline" borderRadius="xl" h="42px" px={4} disabled={!hasData || Boolean(exporting)} onClick={downloadExcel}>
                        <HStack gap={2}>{exporting === 'xlsx' ? <Spinner size="sm" /> : <LuFileSpreadsheet size={16} />}<span>Excel</span></HStack>
                    </Button>
                    <Button bg={accentColor} color="black" borderRadius="xl" h="42px" px={5} fontWeight="semibold" _hover={{ bg: '#EAB308' }} disabled={!hasData || Boolean(exporting)} onClick={downloadPng}>
                        <HStack gap={2}>{exporting === 'png' ? <Spinner size="sm" /> : <LuImage size={16} />}<span>{exporting === 'png' ? 'Tayyorlanmoqda...' : 'Aktni yuklab olish'}</span></HStack>
                    </Button>
                </HStack>
            </HStack>

            {/* ── Filtrlar ── */}
            <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" p={5} mb={4} boxShadow={panelShadow}>
                <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} alignItems="end">
                    <Box gridColumn={{ xl: 'span 2' }}>
                        <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuUsers size={13} /><span>Mijoz</span></HStack>
                        <Select value={selected} onChange={setSelected} onInputChange={(v) => setCustomerSearch(v)} options={customerOptions} isLoading={customersLoading} isClearable placeholder="Mijoz nomini qidiring..." noOptionsMessage={() => 'Mijoz topilmadi'} loadingMessage={() => 'Yuklanmoqda...'} styles={selectStyles} formatOptionLabel={formatOptionLabel} />
                    </Box>
                    <Box>
                        <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuCalendarDays size={13} /><span>Davr boshi</span></HStack>
                        <Box as="input" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} aria-label="Davr boshi" {...inputCx} />
                    </Box>
                    <Box>
                        <HStack gap={1.5} mb={1.5} fontSize="xs" fontWeight="semibold" color={subtitleColor}><LuCalendarDays size={13} /><span>Davr oxiri</span></HStack>
                        <Box as="input" type="date" value={dateTo} min={dateFrom || undefined} max={todayIso()} onChange={(e) => setDateTo(e.target.value)} aria-label="Davr oxiri" {...inputCx} />
                    </Box>
                </SimpleGrid>
                <HStack justify="space-between" flexWrap="wrap" gap={3} mt={4}>
                    <HStack gap={1.5} flexWrap="wrap">
                        <Text fontSize="xs" color={subtitleColor} mr={1}>Tez tanlash:</Text>
                        {DATE_PRESETS.map((preset) => {
                            const isActive = activePreset === preset.key;
                            return (
                                <Button key={preset.key} size="sm" h="30px" px={3.5} borderRadius="full" fontSize="xs" fontWeight="semibold" onClick={() => applyPreset(preset)} bg={isActive ? accentColor : 'transparent'} color={isActive ? 'black' : subtitleColor} borderWidth="1px" borderColor={isActive ? accentColor : cardBorder} _hover={{ bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50') }}>
                                    {preset.label}
                                </Button>
                            );
                        })}
                    </HStack>
                    {(selected || activePreset !== 'month') && (
                        <Button variant="ghost" size="sm" h="32px" px={3} borderRadius="xl" color={subtitleColor} onClick={resetAll} _hover={{ color: accentColor }}>
                            <HStack gap={1.5}><LuRotateCcw size={13} /><span>Tozalash</span></HStack>
                        </Button>
                    )}
                </HStack>
            </Box>

            {/* ── Mazmun ── */}
            {!customerId ? (
                <VStack py={16} gap={3} bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" boxShadow={panelShadow}>
                    <Box p={4} borderRadius="2xl" bg={accentSoft} color={accentColor}><LuFileText size={30} /></Box>
                    <Text fontWeight="semibold" color={textColor}>Mijozni tanlang</Text>
                    <Text fontSize="sm" color={subtitleColor} textAlign="center" maxW="420px">Dalolatnoma tanlangan mijoz va davr bo‘yicha avtomatik tuziladi: davr boshidagi saldo, sotuvlar, to‘lovlar va yakuniy saldo.</Text>
                </VStack>
            ) : loading ? (
                <VStack py={16} gap={3} bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl"><Spinner size="lg" color={accentColor} /><Text color={subtitleColor} fontSize="sm">Dalolatnoma tuzilmoqda...</Text></VStack>
            ) : (
                <>
                    {(ordersError || paymentsError) && (
                        <HStack gap={2} mb={4} px={4} py={3} borderRadius="xl" bg={redSoft} color={red} fontSize="sm"><LuCircleAlert size={16} /><span>Ma&apos;lumotlarning bir qismini yuklab bo‘lmadi, dalolatnoma to‘liq bo‘lmasligi mumkin.</span></HStack>
                    )}
                    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={4}>
                        <StatCard icon={LuScale} label={`Davr boshida · ${dateFrom ? formatDate(dateFrom) : 'boshidan'}`} value={`${money(Math.abs(statement.opening))} so‘m`} sub={openMeta.label} color={openMeta.color} bg={openMeta.bg} />
                        <StatCard icon={LuArrowUpRight} label="Sotuvlar (qarz oshdi)" value={`${money(statement.turnoverDebet)} so‘m`} sub={`${statement.rows.filter((r) => r.kind === 'order').length} ta buyurtma`} color={sky} bg={skySoft} />
                        <StatCard icon={LuArrowDownLeft} label="To‘lovlar (qarz kamaydi)" value={`${money(statement.turnoverKredit)} so‘m`} sub={`${statement.rows.filter((r) => r.kind !== 'order').length} ta to‘lov / qaytarish`} color={green} bg={greenSoft} />
                        <StatCard icon={LuScale} label={`Davr oxirida · ${formatDate(dateTo || todayIso())}`} value={`${money(Math.abs(statement.closing))} so‘m`} sub={closeMeta.label} color={closeMeta.color} bg={closeMeta.bg} />
                    </SimpleGrid>

                    <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" boxShadow={panelShadow}>
                        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                            <HStack gap={2}>
                                <LuFileText size={17} color={accentColor} />
                                <Heading size="sm" color={textColor}>Hisob-kitoblar</Heading>
                                <Badge borderRadius="full" px={2} fontSize="11px" bg={accentSoft} color={accentColor}>{statement.rows.length}</Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtitleColor}>{customer?.name || selected?.label} · {dateFrom ? formatDate(dateFrom) : 'boshidan'} — {formatDate(dateTo || todayIso())}</Text>
                        </HStack>
                        <Box overflowX="auto">
                            <Table.Root size="sm" bg={isDark ? 'transparent' : 'white'} minW="880px">
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeader {...th} w="44px" textAlign="center">№</Table.ColumnHeader>
                                        <Table.ColumnHeader {...th}>Hujjat</Table.ColumnHeader>
                                        <Table.ColumnHeader {...th}>Sana</Table.ColumnHeader>
                                        <Table.ColumnHeader {...th} textAlign="right">Sotuv (qarz +)</Table.ColumnHeader>
                                        <Table.ColumnHeader {...th} textAlign="right">To‘lov (qarz −)</Table.ColumnHeader>
                                        <Table.ColumnHeader {...th}>Izoh</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    <Table.Row bg={isDark ? 'whiteAlpha.50' : 'gray.50'}>
                                        <Table.Cell />
                                        <Table.Cell colSpan={2} fontWeight="bold" color={textColor} fontSize="sm">Davr boshida ({dateFrom ? formatDate(dateFrom) : 'boshidan'})</Table.Cell>
                                        <Table.Cell textAlign="right" fontWeight="bold" fontSize="sm" color={red} whiteSpace="nowrap">{statement.opening > 0 ? money(statement.opening) : ''}</Table.Cell>
                                        <Table.Cell textAlign="right" fontWeight="bold" fontSize="sm" color={green} whiteSpace="nowrap">{statement.opening < 0 ? money(-statement.opening) : ''}</Table.Cell>
                                        <Table.Cell fontSize="sm" color={subtitleColor}>{openMeta.label}</Table.Cell>
                                    </Table.Row>
                                    {statement.rows.length === 0 && (
                                        <Table.Row><Table.Cell colSpan={6} py={10} textAlign="center" color={subtitleColor}>Bu davrda hujjatlar yo‘q</Table.Cell></Table.Row>
                                    )}
                                    {statement.rows.map((row, index) => {
                                        const kind = row.kind === 'order'
                                            ? { label: 'Sotuv', Icon: LuArrowUpRight, color: sky, bg: skySoft }
                                            : row.kind === 'return'
                                                ? { label: 'Qaytarish', Icon: LuUndo2, color: isDark ? '#C4B5FD' : '#6D28D9', bg: isDark ? 'rgba(139,92,246,.14)' : '#EDE9FE' }
                                                : { label: 'To‘lov', Icon: LuArrowDownLeft, color: green, bg: greenSoft };
                                        return (
                                            <Table.Row key={row.id} _hover={{ bg: isDark ? 'rgba(250,204,21,.04)' : '#FFFBEB' }}>
                                                <Table.Cell textAlign="center" color={subtitleColor} fontSize="sm">{index + 1}</Table.Cell>
                                                <Table.Cell>
                                                    <HStack gap={2.5}>
                                                        <Box p={1.5} borderRadius="md" bg={kind.bg} color={kind.color} flexShrink={0}><kind.Icon size={13} /></Box>
                                                        <Box minW={0}>
                                                            <Text fontSize="sm" fontWeight="semibold" color={textColor} noOfLines={1}>{row.title}</Text>
                                                            <Text fontSize="10px" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>{kind.label}</Text>
                                                        </Box>
                                                    </HStack>
                                                </Table.Cell>
                                                <Table.Cell whiteSpace="nowrap" color={textColor} fontSize="sm">{formatDate(row.at)}</Table.Cell>
                                                <Table.Cell textAlign="right" whiteSpace="nowrap" fontSize="sm" fontWeight={row.debet ? 'bold' : 'normal'} color={row.debet ? red : subtitleColor}>{row.debet ? money(row.debet) : '—'}</Table.Cell>
                                                <Table.Cell textAlign="right" whiteSpace="nowrap" fontSize="sm" fontWeight={row.kredit ? 'bold' : 'normal'} color={row.kredit ? green : subtitleColor}>{row.kredit ? money(row.kredit) : '—'}</Table.Cell>
                                                <Table.Cell fontSize="sm" color={subtitleColor} maxW="260px"><Text noOfLines={2}>{row.note || '—'}</Text></Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                    <Table.Row bg={accentSoft}>
                                        <Table.Cell />
                                        <Table.Cell colSpan={2} fontWeight="bold" color={textColor} fontSize="sm">Davr jami</Table.Cell>
                                        <Table.Cell textAlign="right" fontWeight="bold" fontSize="sm" color={textColor} whiteSpace="nowrap">{money(statement.turnoverDebet)}</Table.Cell>
                                        <Table.Cell textAlign="right" fontWeight="bold" fontSize="sm" color={textColor} whiteSpace="nowrap">{money(statement.turnoverKredit)}</Table.Cell>
                                        <Table.Cell />
                                    </Table.Row>
                                    <Table.Row bg={isDark ? 'whiteAlpha.50' : 'gray.50'}>
                                        <Table.Cell />
                                        <Table.Cell colSpan={2} fontWeight="bold" color={textColor} fontSize="sm">Davr oxirida ({formatDate(dateTo || todayIso())})</Table.Cell>
                                        <Table.Cell textAlign="right" fontWeight="bold" fontSize="sm" color={red} whiteSpace="nowrap">{statement.closing > 0 ? money(statement.closing) : ''}</Table.Cell>
                                        <Table.Cell textAlign="right" fontWeight="bold" fontSize="sm" color={green} whiteSpace="nowrap">{statement.closing < 0 ? money(-statement.closing) : ''}</Table.Cell>
                                        <Table.Cell fontSize="sm" color={subtitleColor}>{closeMeta.label}</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table.Root>
                        </Box>
                    </Box>

                    {/* Yuklab olish uchun yashirin qog‘oz ko‘rinishi (1C uslubida) */}
                    <Box position="fixed" left="-20000px" top="0" w="960px" aria-hidden="true" pointerEvents="none" bg="white" color="#111827">
                        <Statement statement={statement} customer={customer || { name: selected?.label, phone: selected?.phone }} dateFrom={dateFrom} dateTo={dateTo} innerRef={paperRef} />
                    </Box>

                    <HStack gap={2} mt={3} color={subtitleColor} fontSize="xs" flexWrap="wrap">
                        <LuClipboardList size={13} /><span>«Sotuv» ustuni — tasdiqlangan buyurtmalar, mijozning qarzi shunga oshadi.</span>
                        <LuCreditCard size={13} /><span>«To‘lov» ustuni — qabul qilingan to‘lovlar va qaytarishlar, qarz shunga kamayadi. Bekor qilinganlar hisobga olinmaydi.</span>
                    </HStack>
                </>
            )}
        </Box>
    );
}
