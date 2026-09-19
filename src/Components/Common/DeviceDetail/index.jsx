import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Box, HStack, Text } from '@chakra-ui/react';
import {
    LuCalendar, LuMonitorCog, LuShieldCheck,
    LuLogIn, LuLogOut, LuFilePlus, LuFilePen,
    LuTrash2, LuChevronLeft, LuChevronRight, LuUser,
} from 'react-icons/lu';
import { useGetDevicesQuery } from '../../../store/services/device.api';
import { useGetAuditLogsQuery } from '../../../store/services/audit.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { useAppTheme } from '../../../theme/tokens';

/* ─── Action meta ──────────────────────────────────────────── */
const ACTION_META = {
    LOGIN:  { label: 'Kirish',     icon: LuLogIn,    bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', darkColor: '#86efac' },
    LOGOUT: { label: 'Chiqish',    icon: LuLogOut,   bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', darkColor: '#fca5a5' },
    CREATE: { label: 'Yaratish',   icon: LuFilePlus, bg: 'rgba(59,130,246,0.12)', color: '#2563eb', darkColor: '#93c5fd' },
    UPDATE: { label: 'Yangilash',  icon: LuFilePen,  bg: 'rgba(250,204,21,0.14)', color: '#ca8a04', darkColor: '#fde68a' },
    DELETE: { label: "O'chirish",  icon: LuTrash2,   bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', darkColor: '#fca5a5' },
};

function getActionMeta(action) {
    return ACTION_META[action] || {
        label: action,
        icon: LuShieldCheck,
        bg: 'rgba(148,163,184,0.12)',
        color: '#64748b',
        darkColor: '#94a3b8',
    };
}

/* ─── Changes display ──────────────────────────────────────── */
function ChangesBlock({ changes, isDark, cardBorder, subtitleColor, textColor }) {
    if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) return null;
    return (
        <div className="mt-2 rounded-lg overflow-hidden"
            style={{ border: `1px solid ${cardBorder}` }}>
            {Object.entries(changes).map(([field, val], idx, arr) => (
                <div key={field}
                    className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2 text-xs"
                    style={{
                        borderBottom: idx < arr.length - 1 ? `1px solid ${cardBorder}` : 'none',
                        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)',
                    }}>
                    <span className="font-bold shrink-0 w-28 truncate" style={{ color: subtitleColor }}>
                        {field}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {val?.old != null && (
                            <span className="px-1.5 py-0.5 rounded font-mono"
                                style={{ background: isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2', color: isDark ? '#fca5a5' : '#dc2626' }}>
                                {String(val.old).length > 36 ? String(val.old).slice(0, 36) + '…' : val.old}
                            </span>
                        )}
                        {val?.old != null && val?.new != null && (
                            <span style={{ color: subtitleColor }}>→</span>
                        )}
                        {val?.new != null && (
                            <span className="px-1.5 py-0.5 rounded font-mono"
                                style={{ background: isDark ? 'rgba(34,197,94,0.12)' : '#dcfce7', color: isDark ? '#86efac' : '#16a34a' }}>
                                {String(val.new).length > 36 ? String(val.new).slice(0, 36) + '…' : val.new}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Audit log item card ──────────────────────────────────── */
function AuditCard({ item }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const meta = getActionMeta(item.action);
    const ActionIcon = meta.icon;
    const actionColor = isDark ? meta.darkColor : meta.color;

    return (
        <div className="rounded-xl overflow-hidden transition-all"
            style={{
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(15,23,42,0.05)',
            }}>
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{
                    borderBottom: `1px solid ${cardBorder}`,
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                }}>
                {/* Action badge */}
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
                        style={{ background: meta.bg }}>
                        <ActionIcon size={13} style={{ color: actionColor }} />
                    </span>
                    <span className="text-xs font-bold" style={{ color: actionColor }}>
                        {meta.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                            color: subtitleColor,
                        }}>
                        {item.entityName}
                    </span>
                </div>
                {/* Date */}
                <span className="text-[11px] shrink-0 tabular-nums" style={{ color: subtitleColor }}>
                    {formatDetailDate(item.occurredAt)}
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-2.5">
                {/* User */}
                <div className="flex items-center gap-1.5 mb-1">
                    <LuUser size={12} style={{ color: subtitleColor, flexShrink: 0 }} />
                    <span className="text-xs font-semibold" style={{ color: textColor }}>
                        {item.username || item.userId || '—'}
                    </span>
                </div>

                {/* Changes */}
                {item.changes ? (
                    <ChangesBlock
                        changes={item.changes}
                        isDark={isDark}
                        cardBorder={cardBorder}
                        subtitleColor={subtitleColor}
                        textColor={textColor}
                    />
                ) : (
                    <span className="text-[11px]" style={{ color: subtitleColor }}>
                        O'zgarishlar mavjud emas
                    </span>
                )}
            </div>
        </div>
    );
}

/* ─── Paginated Audit Section ──────────────────────────────── */
export function AuditSection({ deviceId, userId }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const [page, setPage] = useState(0);

    const { data: auditResult, isFetching } = useGetAuditLogsQuery(
        {
            ...(deviceId ? { deviceId } : {}),
            ...(userId   ? { userId }   : {}),
            page,
            size: 10,
            sort: ['occurredAt,DESC'],
        },
        { skip: !deviceId && !userId }
    );

    const audits     = auditResult?.items      ?? [];
    const pagination = auditResult?.pagination ?? null;
    const totalPages = pagination?.totalPages  ?? 0;

    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'}
            gridColumn={{ base: '1', lg: 'span 2' }}
        >
            {/* Section header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4"
                style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <div className="flex items-center gap-2">
                    <LuShieldCheck size={18} style={{ color: accentColor }} />
                    <span className="font-bold text-base" style={{ color: textColor }}>
                        Audit yozuvlari
                    </span>
                    {pagination && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                            style={{
                                background: isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7',
                                color: accentColor,
                            }}>
                            {pagination.totalElements} ta
                        </span>
                    )}
                </div>
                {isFetching && (
                    <svg className="h-4 w-4 animate-spin" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {audits.length === 0 && !isFetching ? (
                    <div className="flex flex-col items-center gap-2 py-10"
                        style={{ color: subtitleColor }}>
                        <LuShieldCheck size={32} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                        <p className="text-sm">Audit yozuvlari yo'q</p>
                    </div>
                ) : (() => {
                    /* GROUP: simple actions (no changes) go 3-per-row, data-change actions go full-width */
                    const simpleActions = new Set(['LOGIN', 'LOGOUT']);
                    const simpleItems = audits.filter((a) => simpleActions.has(a.action));
                    const richItems   = audits.filter((a) => !simpleActions.has(a.action));

                    /* interleave in original order, but render simple ones grouped */
                    return (
                        <div className="flex flex-col gap-4">
                            {/* Build rows in chronological order: collect consecutive simples together */}
                            {(() => {
                                const rows = [];
                                let i = 0;
                                while (i < audits.length) {
                                    if (simpleActions.has(audits[i].action)) {
                                        // collect up to 3 consecutive simple items
                                        const group = [];
                                        while (i < audits.length && simpleActions.has(audits[i].action) && group.length < 3) {
                                            group.push(audits[i]);
                                            i++;
                                        }
                                        rows.push(
                                            <div key={group[0].id} className="grid gap-3"
                                                style={{ gridTemplateColumns: `repeat(${group.length}, 1fr)` }}>
                                                {group.map((item) => <AuditCard key={item.id} item={item} />)}
                                            </div>
                                        );
                                    } else {
                                        rows.push(<AuditCard key={audits[i].id} item={audits[i]} />);
                                        i++;
                                    }
                                }
                                return rows;
                            })()}
                        </div>
                    );
                })()}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: `1px solid ${cardBorder}` }}>
                    <span className="text-xs" style={{ color: subtitleColor }}>
                        {page * 10 + 1}–{Math.min((page + 1) * 10, pagination?.totalElements ?? 0)} / {pagination?.totalElements ?? 0}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage((p) => p - 1)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                            <LuChevronLeft size={15} />
                        </button>
                        <span className="text-xs font-semibold" style={{ color: subtitleColor }}>
                            {page + 1} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage((p) => p + 1)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: cardBg, borderColor: cardBorder, color: textColor, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
                            <LuChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </Box>
    );
}

/* ─── DeviceDetail page ────────────────────────────────────── */
export default function DeviceDetail() {
    const { id } = useParams();
    const { data: device, isLoading, isError } = useGetDevicesQuery({ page: 0, size: 100 });
    const currentDevice = device?.items?.find((item) => item.id === id) ?? null;

    return (
        <EntityDetail
            title={currentDevice?.deviceName || 'Qurilma'}
            icon={LuMonitorCog}
            backTo="/devices"
            backLabel="Qurilmalar"
            loading={isLoading}
            error={isError || !currentDevice}
        >
            {() => (
                <>
                    <DetailSection title="Qurilma ma'lumotlari" icon={LuMonitorCog}>
                        <DetailRow label="Nomi"   value={currentDevice.deviceName} emphasize />
                        <DetailRow label="Izoh"   value={currentDevice.deviceSummary || '—'} />
                        <DetailRow label="Status" value={
                            <Badge borderRadius="full" px={3} py={1}
                                bg="rgba(34,197,94,0.12)" color="green.600">
                                Faol
                            </Badge>
                        } />
                    </DetailSection>

                    <DetailSection title="Tizim ma'lumotlari" icon={LuCalendar}>
                        <DetailRow label="Yaratilgan"   value={formatDetailDate(currentDevice.createdAt)} />
                        <DetailRow label="Yangilangan"  value={formatDetailDate(currentDevice.lastModifiedAt)} />
                    </DetailSection>

                    <AuditSection deviceId={id} />
                </>
            )}
        </EntityDetail>
    );
}
