import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Box, Button, HStack, Table, Text } from '@chakra-ui/react';
import { LuActivity, LuCalendar, LuChevronLeft, LuChevronRight, LuCog, LuHistory, LuPackage } from 'react-icons/lu';
import { useGetMachineByIdQuery, useGetMachineRunsQuery } from '../../../store/services/machine.api';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';
import { formatNumber } from '../../ui/number-format';

const PAGE_SIZE = 10;
const POLL_MS = 10000;

// 02:14:37 — davom etayotgan seans uchun
function formatClock(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

// «2 soat 14 daqiqa» — tugagan seanslar uchun
function formatDuration(startedAt, endedAt) {
    if (!startedAt || !endedAt) return '—';
    const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const minutes = Math.floor(ms / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const rest = minutes % 60;
    if (days > 0) return `${days} kun ${hours} soat`;
    if (hours > 0) return `${hours} soat ${rest} daqiqa`;
    return `${rest} daqiqa`;
}

export default function MachineDetail() {
    const { id } = useParams();
    const [page, setPage] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    // real vaqt: stanok holati va joriy seans doimiy yangilanib turadi
    const { data: machine, isLoading, isError } = useGetMachineByIdQuery(id, { skip: !id, pollingInterval: POLL_MS });
    const { data: runResult, isFetching: runsFetching } = useGetMachineRunsQuery(
        { id, page, size: PAGE_SIZE },
        { skip: !id, pollingInterval: POLL_MS }
    );

    const run = machine?.currentRun;
    const isWorking = Boolean(machine?.isWorking && run && !run.endedAt);

    // davom etayotgan seansning sarflangan vaqti har soniyada yangilanadi
    useEffect(() => {
        if (!isWorking) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isWorking]);

    const runs = runResult?.items || [];
    const pagination = runResult?.pagination;
    const totalPages = pagination?.totalPages || 0;
    const totalRuns = pagination?.totalElements ?? 0;
    const elapsed = run?.startedAt ? now - new Date(run.startedAt).getTime() : 0;

    return <EntityDetail title={machine?.name || 'Stanok'} icon={LuCog} backTo="/machines" backLabel="Stanoklar" loading={isLoading} error={isError || !machine}>
        {({ isDark, textColor, subtitleColor, cardBorder, cardBg }) => <>
            <DetailSection title="Stanok ma’lumotlari" icon={LuCog}>
                <DetailRow label="Nomi" value={machine.name} emphasize />
                <DetailRow label="Izoh" value={machine.summary} />
                <DetailRow label="Holati" value={<Badge borderRadius="full" px={3} py={1} bg={machine.isWorking ? (isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7') : (isDark ? 'rgba(148,163,184,.15)' : '#F1F5F9')} color={machine.isWorking ? (isDark ? 'green.300' : 'green.700') : subtitleColor}>{machine.isWorking ? 'Ishlayapti' : 'Bo‘sh'}</Badge>} />
                <DetailRow label="Jami seanslar" value={formatNumber(totalRuns)} />
            </DetailSection>

            <DetailSection title="Hozir nima ishlab chiqarilmoqda" icon={LuActivity}>
                {isWorking ? <>
                    <DetailRow label="Mahsulot" value={<HStack gap={2}><LuPackage size={16} /><span>{run.productName}</span></HStack>} emphasize />
                    <DetailRow label="Boshlangan" value={formatDetailDate(run.startedAt)} />
                    <DetailRow
                        label="Sarflangan vaqt"
                        value={<Text as="span" fontFamily="mono" fontSize="lg" fontWeight="bold" color={isDark ? 'green.300' : 'green.700'}>{formatClock(elapsed)}</Text>}
                    />
                </> : <Text color={subtitleColor} py={2}>Stanok hozir bo‘sh — ishlab chiqarish ketmayapti.</Text>}
            </DetailSection>

            <DetailSection title="Tizim ma’lumotlari" icon={LuCalendar}>
                <DetailRow label="Yaratilgan" value={formatDetailDate(machine.createdAt)} />
                <DetailRow label="Yangilangan" value={formatDetailDate(machine.lastModifiedAt)} />
            </DetailSection>

            <DetailSection title="Ishlab chiqarish tarixi" icon={LuHistory} gridColumn={{ base: 'auto', lg: '1 / -1' }}>
                {runsFetching && runs.length === 0 ? (
                    <Text color={subtitleColor} py={6} textAlign="center">Yuklanmoqda...</Text>
                ) : runs.length === 0 ? (
                    <Text color={subtitleColor} py={6} textAlign="center">Bu stanokda hozircha ishlab chiqarish tarixi yo‘q</Text>
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
                                            <Table.Row key={item.runId} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
                                                <Table.Cell color={subtitleColor} textAlign="center">{page * PAGE_SIZE + index + 1}</Table.Cell>
                                                <Table.Cell color={textColor} fontWeight="semibold">{item.productName}</Table.Cell>
                                                <Table.Cell color={subtitleColor} whiteSpace="nowrap">{formatDetailDate(item.startedAt)}</Table.Cell>
                                                <Table.Cell color={subtitleColor} whiteSpace="nowrap">{item.endedAt ? formatDetailDate(item.endedAt) : '—'}</Table.Cell>
                                                <Table.Cell color={textColor} fontWeight="bold" whiteSpace="nowrap">
                                                    {active
                                                        ? <Text as="span" fontFamily="mono" color={isDark ? 'green.300' : 'green.700'}>{formatClock(now - new Date(item.startedAt).getTime())}</Text>
                                                        : formatDuration(item.startedAt, item.endedAt)}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge
                                                        borderRadius="full"
                                                        px={3}
                                                        py={1}
                                                        whiteSpace="nowrap"
                                                        bg={active ? (isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7') : (isDark ? 'rgba(148,163,184,.15)' : '#F1F5F9')}
                                                        color={active ? (isDark ? 'green.300' : 'green.700') : subtitleColor}
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
                        <HStack justify="space-between" mt={4} flexWrap="wrap" gap={3}>
                            <Text color={subtitleColor} fontSize="sm">Jami: {formatNumber(totalRuns)} ta seans</Text>
                            {totalPages > 1 && <HStack gap={3}>
                                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><LuChevronLeft /></Button>
                                <Text color={subtitleColor} fontSize="sm">{page + 1} / {totalPages}</Text>
                                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}><LuChevronRight /></Button>
                            </HStack>}
                        </HStack>
                    </>
                )}
            </DetailSection>
        </>}
    </EntityDetail>;
}
