import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Box, HStack, Table, Text } from '@chakra-ui/react';
import { LuActivity, LuCalendar, LuCog, LuHistory, LuLayers3, LuPackage } from 'react-icons/lu';
import { useGetMachineByIdQuery, useGetMachineRunsQuery } from '../../../store/services/machine.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import ProduceDialog from '../../Stanokchi/ProduceDialog';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { formatNumber } from '../../ui/number-format';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';

const PAGE_SIZE = 20;

function formatClock(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const pad = (v) => String(v).padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function formatDuration(startedAt, endedAt) {
    if (!startedAt || !endedAt) return '—';
    const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const minutes = Math.floor(ms / 60000);
    const days  = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const rest  = minutes % 60;
    if (days  > 0) return `${days} kun ${hours} soat`;
    if (hours > 0) return `${hours} soat ${rest} daqiqa`;
    return `${rest} daqiqa`;
}

export default function MachineDetail() {
    const { id } = useParams();
    const [page, setPage] = useState(0);
    const [now, setNow]   = useState(() => Date.now());
    const role = useAppSelector((state) => state.auth.role);
    const canProduce = role === ROLES.MANAGER;
    const [produceOpen, setProduceOpen] = useState(false); // Seriyali ishlab chiqarish (mahsulot tanlab, ≤500 pachka, yorliq)

    const { data: machine, isLoading, isError } = useGetMachineByIdQuery(id, { skip: !id });
    const { data: runResult, isFetching: runsFetching } = useGetMachineRunsQuery(
        { id, page, size: PAGE_SIZE },
        { skip: !id }
    );

    const run       = machine?.currentRun;
    // isWorking: currentRun bor VA status IDLE emas
    const isWorking = Boolean(run && !run.endedAt && machine?.status !== 'IDLE');
    const isDefect  = isWorking && machine?.status === 'DEFECT';

    useEffect(() => {
        if (!isWorking) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isWorking]);

    // Sahifa tugmalari o‘rniga pastga aylantirganda yuklash
    const { items: runs, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: runResult?.items,
        pagination: runResult?.pagination,
        page,
        setPage,
        isFetching: runsFetching,
        resetKey: id,
        getId: (item) => item?.runId,
    });
    const pagination = runResult?.pagination;
    const totalRuns  = pagination?.totalElements ?? runs.length;
    const elapsed    = run?.startedAt ? now - new Date(run.startedAt).getTime() : 0;

    /* ── Holat badge helper ── */
    const statusBadge = (w, d, sc, dk) => {
        if (d) return (
            <Badge borderRadius="full" px={3} py={1}
                bg={dk ? 'rgba(239,68,68,.14)' : '#FEE2E2'}
                color={dk ? 'red.300' : '#991B1B'}>
                ⚠ Brak ishlab chiqarilmoqda
            </Badge>
        );
        if (w) return (
            <Badge borderRadius="full" px={3} py={1}
                bg={dk ? 'rgba(34,197,94,.14)' : '#DCFCE7'}
                color={dk ? 'green.300' : 'green.700'}>
                ● Ishlayapti
            </Badge>
        );
        return (
            <Badge borderRadius="full" px={3} py={1}
                bg={dk ? 'rgba(148,163,184,.15)' : '#F1F5F9'}
                color={sc}>
                ○ Bo&apos;sh
            </Badge>
        );
    };

    return (
        <EntityDetail
            title={machine?.name || 'Stanok'}
            icon={LuCog}
            backTo="/machines"
            backLabel="Stanoklar"
            loading={isLoading}
            error={isError || !machine}
            payment={canProduce ? 'Seriyali chiqarish' : undefined}
            onPayment={() => setProduceOpen(true)}
        >
            {({ isDark, textColor, subtitleColor, cardBorder, cardBg }) => (
                <>
                    {produceOpen && (
                        <ProduceDialog open pickProduct onClose={() => setProduceOpen(false)} machineId={id} machineName={machine.name} defaultCopies={2} />
                    )}
                    <DetailSection title="Stanok ma'lumotlari" icon={LuCog}>
                        <DetailRow label="Nomi"          value={machine.name} emphasize />
                        <DetailRow label="Kategoriya"    value={machine.category?.name ? <HStack gap={2}><LuLayers3 size={16} /><span>{machine.category.name}</span></HStack> : '—'} />
                        <DetailRow label="Izoh"          value={machine.summary} />
                        <DetailRow label="Holati"        value={statusBadge(isWorking, isDefect, subtitleColor, isDark)} />
                        <DetailRow label="Jami seanslar" value={formatNumber(totalRuns)} />
                    </DetailSection>

                    <DetailSection title="Hozir nima ishlab chiqarilmoqda" icon={LuActivity}>
                        {isWorking ? (
                            <>
                                {/* Brak ogohlantirish banner */}
                                {isDefect && (
                                    <Box
                                        mb={3} px={4} py={2.5} borderRadius="xl"
                                        bg={isDark ? 'rgba(239,68,68,.1)' : '#FEF2F2'}
                                        border="1px solid"
                                        borderColor={isDark ? 'rgba(239,68,68,.3)' : '#FECACA'}
                                    >
                                        <Text fontSize="sm" fontWeight="bold" color={isDark ? 'red.300' : '#991B1B'}>
                                            ⚠️ Chiqayotgan mahsulot BRAK deb belgilanmoqda
                                        </Text>
                                    </Box>
                                )}
                                <DetailRow
                                    label="Mahsulot"
                                    value={
                                        <HStack gap={2}>
                                            <LuPackage size={16} />
                                            <span>{run.productName}</span>
                                        </HStack>
                                    }
                                    emphasize
                                />
                                <DetailRow label="Boshlangan" value={formatDetailDate(run.startedAt)} />
                                <DetailRow
                                    label="Sarflangan vaqt"
                                    value={
                                        <Text as="span" fontFamily="mono" fontSize="lg" fontWeight="bold"
                                            color={isDefect
                                                ? (isDark ? 'red.300' : '#991B1B')
                                                : (isDark ? 'green.300' : 'green.700')}>
                                            {formatClock(elapsed)}
                                        </Text>
                                    }
                                />
                            </>
                        ) : (
                            <Text color={subtitleColor} py={2}>
                                Stanok hozir bo&apos;sh — ishlab chiqarish ketmayapti.
                            </Text>
                        )}
                    </DetailSection>

                    <DetailSection title="Tizim ma'lumotlari" icon={LuCalendar}>
                        <DetailRow label="Yaratilgan"  value={formatDetailDate(machine.createdAt)} />
                        <DetailRow label="Yangilangan" value={formatDetailDate(machine.lastModifiedAt)} />
                    </DetailSection>

                    <DetailSection
                        title="Ishlab chiqarish tarixi"
                        icon={LuHistory}
                        gridColumn={{ base: 'auto', lg: '1 / -1' }}
                    >
                        {runsFetching && runs.length === 0 ? (
                            <Text color={subtitleColor} py={6} textAlign="center">Yuklanmoqda...</Text>
                        ) : runs.length === 0 ? (
                            <Text color={subtitleColor} py={6} textAlign="center">
                                Bu stanokda hozircha ishlab chiqarish tarixi yo&apos;q
                            </Text>
                        ) : (
                            <>
                                <Box overflowX="auto" borderWidth="1px" borderColor={cardBorder} borderRadius="xl">
                                    <Table.Root size="md" bg={cardBg} borderCollapse="collapse">
                                        <Table.Header>
                                            <Table.Row>
                                                <Table.ColumnHeader color={subtitleColor} w="60px" textAlign="center">№</Table.ColumnHeader>
                                                <Table.ColumnHeader color={subtitleColor}>Mahsulot</Table.ColumnHeader>
                                                <Table.ColumnHeader color={subtitleColor}>Boshlandi</Table.ColumnHeader>
                                                <Table.ColumnHeader color={subtitleColor}>Tugadi</Table.ColumnHeader>
                                                <Table.ColumnHeader color={subtitleColor}>Davomiyligi</Table.ColumnHeader>
                                                <Table.ColumnHeader color={subtitleColor}>Holati</Table.ColumnHeader>
                                            </Table.Row>
                                        </Table.Header>
                                        <Table.Body>
                                            {runs.map((item, index) => {
                                                const active = !item.endedAt;
                                                return (
                                                    <Table.Row
                                                        key={item.runId}
                                                        _hover={{ bg: isDark ? 'rgb(var(--accent-400) / .06)' : 'rgb(var(--accent-warm-50))' }}
                                                    >
                                                        <Table.Cell color={subtitleColor} textAlign="center">
                                                            {index + 1}
                                                        </Table.Cell>
                                                        <Table.Cell color={textColor} fontWeight="semibold">
                                                            {item.productName}
                                                        </Table.Cell>
                                                        <Table.Cell color={subtitleColor} whiteSpace="nowrap">
                                                            {formatDetailDate(item.startedAt)}
                                                        </Table.Cell>
                                                        <Table.Cell color={subtitleColor} whiteSpace="nowrap">
                                                            {item.endedAt ? formatDetailDate(item.endedAt) : '—'}
                                                        </Table.Cell>
                                                        <Table.Cell color={textColor} fontWeight="bold" whiteSpace="nowrap">
                                                            {active
                                                                ? <Text as="span" fontFamily="mono"
                                                                    color={isDark ? 'green.300' : 'green.700'}>
                                                                    {formatClock(now - new Date(item.startedAt).getTime())}
                                                                  </Text>
                                                                : formatDuration(item.startedAt, item.endedAt)}
                                                        </Table.Cell>
                                                        <Table.Cell>
                                                            <Badge
                                                                borderRadius="full" px={3} py={1} whiteSpace="nowrap"
                                                                bg={active
                                                                    ? (isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7')
                                                                    : (isDark ? 'rgba(148,163,184,.15)' : '#F1F5F9')}
                                                                color={active
                                                                    ? (isDark ? 'green.300' : 'green.700')
                                                                    : subtitleColor}
                                                            >
                                                                {active ? 'Davom etmoqda' : 'Tugagan'}
                                                            </Badge>
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            })}
                                        </Table.Body>
                                    </Table.Root>
                                </Box>
                                <InfiniteSentinel
                                    sentinelRef={sentinelRef}
                                    hasMore={hasMore}
                                    loadingMore={loadingMore}
                                    loaded={runs.length}
                                    total={totalRuns}
                                    unit="ta seans"
                                    onLoadMore={loadMore}
                                />
                            </>
                        )}
                    </DetailSection>
                </>
            )}
        </EntityDetail>
    );
}
