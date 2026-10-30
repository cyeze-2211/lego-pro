import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, HStack, Heading, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { LuBarcode, LuCog, LuPrinter, LuRefreshCw, LuSearch, LuTrash2, LuWarehouse, LuX } from 'react-icons/lu';
import $api from '../../../store/api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';
import FormControl from '../../ui/FormControl';
import { useInfiniteList } from '../../ui/useInfiniteList';
import InfiniteSentinel from '../../ui/InfiniteSentinel';
import { formatDateTime } from '../../ui/date-format';
import { formatNumber } from '../../ui/number-format';
import usePackScanner, { beep } from '../../ui/usePackScanner';
import PackLabelDialog from '../../ui/PackLabelDialog';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import { PACK_STATUS_LABEL, useDeleteProductPackMutation, useGetProductPacksQuery } from '../../../store/services/productPack.api';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { useGetProductsQuery } from '../../../store/services/product.api';

const PAGE_SIZE = 30;
const BULK_PAGE = 500;

/*
 * Pachkalar (admin): barcode‘li pachkalar ro‘yxati — mahsulot / ombor / holat bo‘yicha filtr,
 * skaner (pistolet) bilan pachkani topish, yorliq chop etish, bitta pachkani yoki filtrdagi hammasini o‘chirish.
 * O‘chirish — DELETE /product-packs/{id} (hammasi: ro‘yxat sahifalab o‘qiladi va har biri ketma-ket o‘chiriladi).
 */
const statusTone = (status, isDark) => {
    if (status === 'IN_STOCK') return { bg: isDark ? 'rgba(34,197,94,.14)' : '#DCFCE7', color: isDark ? 'green.300' : 'green.700' };
    if (status === 'SHIPPED') return { bg: isDark ? 'rgba(59,130,246,.14)' : '#DBEAFE', color: isDark ? 'blue.300' : 'blue.700' };
    return { bg: isDark ? 'rgba(245,158,11,.14)' : '#FEF3C7', color: isDark ? 'yellow.300' : 'yellow.800' };
};

const deleteErrorText = (error) => {
    const status = error?.status ?? error?.response?.status;
    if (status === 405 || status === 404) return 'O‘chirish endpointi backendda topilmadi (DELETE /product-packs/{id}) — backend dasturchisiga ayting';
    return error?.data?.message || error?.response?.data?.message || 'Pachkani o‘chirishda xatolik';
};

export default function ProductPack() {
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const tableBg       = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    const tableHeaderBg = isDark ? tableBg : '#F8FAFC';
    const tableBorder   = isDark ? cardBorder : '#CBD5E1';

    /* ── Filtrlar ── */
    const [productSearch, setProductSearch] = useState('');
    const [productQuery, setProductQuery] = useState('');
    const [productId, setProductId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        const t = window.setTimeout(() => setProductQuery(productSearch.trim()), 300);
        return () => window.clearTimeout(t);
    }, [productSearch]);

    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT');
    const { data: productsData, isFetching: productsFetching } = useGetProductsQuery({ query: productQuery || undefined, page: 0, size: 100, sort: ['name,ASC', 'id,ASC'] });
    const products = productsData?.items ?? [];
    const warehouseName = (id) => warehouses.find((w) => w.id === id)?.name || '';

    const filters = useMemo(() => ({ productId: productId || undefined, warehouseId: warehouseId || undefined, status: status || undefined }), [productId, warehouseId, status]);
    const { data: packResult, isLoading, isFetching, error, refetch } = useGetProductPacksQuery({ ...filters, page, size: PAGE_SIZE });
    const { items: packs, hasMore, sentinelRef, loadingMore, loadMore } = useInfiniteList({
        items: packResult?.items,
        pagination: packResult?.pagination,
        page,
        setPage,
        isFetching,
        resetKey: JSON.stringify(filters),
    });
    const total = packResult?.pagination?.totalElements ?? packs.length;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Pachkalarni yuklashda xatolik', 'error');
    }, [error]);

    /* ── Skaner ── */
    const [scanned, setScanned] = useState(null);
    const [scanError, setScanError] = useState('');
    const scanner = usePackScanner({
        enabled: true,
        onPack: (pack) => { beep(true); setScanError(''); setScanned(pack); },
        onError: (text) => { setScanError(text); },
    });

    /* ── Yorliq / o‘chirish ── */
    const [labelPack, setLabelPack] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletePack, { isLoading: deleting }] = useDeleteProductPackMutation();

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deletePack(deleteTarget.id).unwrap();
            Alert(`Pachka ${deleteTarget.barcode} o‘chirildi`, 'success');
            if (scanned?.id === deleteTarget.id) setScanned(null);
            setDeleteTarget(null);
        } catch (err) {
            Alert(deleteErrorText(err), 'error');
        }
    };

    /* ── Hammasini o‘chirish (joriy filtr bo‘yicha) ── */
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulk, setBulk] = useState(null); // { done, total, failed }
    const bulkRun = async () => {
        setBulkOpen(false);
        setBulk({ done: 0, total, failed: 0 });
        let failed = 0; let done = 0; let stopReason = '';
        try {
            // Avval barcha id lar (sahifalab), keyin ketma-ket o‘chirish
            const ids = [];
            for (let p = 0; p < 1000; p += 1) {
                const res = await $api.get('/product-packs', { params: { ...filters, page: p, size: BULK_PAGE } });
                const items = res?.data?.data ?? [];
                items.forEach((x) => ids.push(x.id));
                const pg = res?.data?.pagination;
                if (!items.length || !pg || p + 1 >= (pg.totalPages ?? 0)) break;
            }
            setBulk({ done: 0, total: ids.length, failed: 0 });
            for (const id of ids) {
                try {
                    await $api.delete(`/product-packs/${id}`);
                    done += 1;
                } catch (err) {
                    failed += 1;
                    const st = err?.response?.status;
                    if (st === 405 || st === 404) { stopReason = deleteErrorText(err); break; } // endpoint yo‘q — davom etishdan ma’no yo‘q
                }
                setBulk({ done, total: ids.length, failed });
            }
        } catch (err) {
            stopReason = err?.response?.data?.message || 'Ro‘yxatni o‘qishda xatolik';
        }
        setBulk(null);
        setScanned(null);
        setPage(0);
        refetch();
        if (stopReason) Alert(stopReason, 'error');
        else if (failed) Alert(`${done} ta o‘chirildi, ${failed} tasi o‘chmadi`, 'error');
        else Alert(`${done} ta pachka o‘chirildi`, 'success');
    };

    const filterText = [
        productId ? (products.find((p) => p.id === productId)?.name || 'tanlangan mahsulot') : '',
        warehouseId ? warehouseName(warehouseId) : '',
        status ? PACK_STATUS_LABEL[status] : '',
    ].filter(Boolean).join(' · ');
    const hasFilter = Boolean(productId || warehouseId || status);
    const resetFilters = () => { setProductSearch(''); setProductQuery(''); setProductId(''); setWarehouseId(''); setStatus(''); setPage(0); };

    const renderStatus = (s) => {
        const tone = statusTone(s, isDark);
        return <Badge borderRadius="full" px={3} py={1} whiteSpace="nowrap" bg={tone.bg} color={tone.color}>{PACK_STATUS_LABEL[s] || s}</Badge>;
    };

    const rowActions = (pack) => (
        <HStack justify="center" gap={1}>
            <Button onClick={() => setLabelPack(pack)} variant="ghost" size="sm" color={accentColor} borderRadius="xl" px={3} aria-label="Yorliq" title="Yorliq chop etish"
                _hover={{ bg: isDark ? 'rgb(var(--accent-400) / 0.12)' : 'rgb(var(--accent-warm-100))' }}>
                <LuPrinter size={16} />
            </Button>
            <Button onClick={() => setDeleteTarget(pack)} variant="ghost" size="sm" color={isDark ? 'red.300' : 'red.600'} borderRadius="xl" px={3} aria-label="O‘chirish" title="Pachkani o‘chirish"
                _hover={{ bg: isDark ? 'rgba(239, 68, 68, 0.16)' : 'red.50' }}>
                <LuTrash2 size={16} />
            </Button>
        </HStack>
    );

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold" color={textColor}>Pachkalar</Heading>
                    <Text fontSize="sm" color={subtitleColor}>Barcode‘li pachkalar: skaner bilan topish, yorliq chop etish, o‘chirish</Text>
                </Box>
                <Button
                    onClick={() => setBulkOpen(true)}
                    disabled={!packs.length || Boolean(bulk) || isFetching}
                    bg="red.500" color="white" _hover={{ bg: 'red.600' }} borderRadius="xl" h="40px" px={5}
                    title={hasFilter ? `Filtrdagi barcha pachkalarni o‘chirish (${formatNumber(total)} ta)` : `Barcha pachkalarni o‘chirish (${formatNumber(total)} ta)`}
                >
                    <HStack gap={2}><LuTrash2 size={16} /><span>Hammasini o‘chirish{total ? ` (${formatNumber(total)})` : ''}</span></HStack>
                </Button>
            </HStack>

            {/* ── Skaner ── */}
            <Box p={4} mb={4} bg={cardBg} borderWidth="1px" borderColor={scanError ? (isDark ? 'rgba(239,68,68,.5)' : '#FCA5A5') : cardBorder} borderRadius="xl" boxShadow={isDark ? 'none' : '0 6px 18px rgba(15, 23, 42, 0.06)'}>
                <HStack gap={3} align={{ base: 'stretch', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }}>
                    <Box position="relative" flex="1">
                        <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none"><LuBarcode size={20} /></Box>
                        <FormControl {...scanner.inputProps} disabled={scanner.busy} placeholder="Pachka barcode‘ini skanerlang yoki terib Enter bosing" aria-label="Pachka skaneri" pl={12} minH="46px" fontSize="lg" fontFamily="mono" />
                    </Box>
                    <Button type="button" onClick={() => scanner.submit(scanner.value)} disabled={!scanner.value || scanner.busy} bg={accentColor} color="black" borderRadius="xl" minH="46px" px={6} flexShrink={0}>
                        <HStack gap={2}>{scanner.busy ? <Spinner size="sm" /> : <LuSearch size={18} />}<span>Topish</span></HStack>
                    </Button>
                </HStack>
                <Text fontSize="xs" color={subtitleColor} mt={2}>Pistolet maydon fokusda bo‘lmasa ham ishlaydi — sahifaning istalgan joyida skanerlang.</Text>
                {scanError && <Text fontSize="sm" fontWeight="semibold" color={isDark ? 'red.300' : 'red.600'} mt={2}>{scanError}</Text>}

                {scanned && (
                    <Box mt={3} p={4} borderRadius="xl" borderWidth="1px" borderColor={isDark ? 'rgb(var(--accent-400) / .35)' : 'rgb(var(--accent-warm-200))'} bg={isDark ? 'rgb(var(--accent-400) / .08)' : 'rgb(var(--accent-warm-50))'}>
                        <HStack justify="space-between" align="start" flexWrap="wrap" gap={3}>
                            <VStack align="start" gap={1} minW={0}>
                                <HStack gap={2} flexWrap="wrap">
                                    <Text fontFamily="mono" fontWeight="bold" fontSize="lg" color={textColor}>{scanned.barcode}</Text>
                                    {renderStatus(scanned.status)}
                                </HStack>
                                <Text fontWeight="semibold" color={textColor}>{scanned.productName}</Text>
                                <HStack gap={4} flexWrap="wrap" fontSize="sm" color={subtitleColor}>
                                    <span>{formatNumber(scanned.pieces)} dona</span>
                                    <HStack gap={1}><LuWarehouse size={14} /><span>{warehouseName(scanned.warehouseId) || '—'}</span></HStack>
                                    <HStack gap={1}><LuCog size={14} /><span>{scanned.machineName || 'Donaviy qoldiqdan'}</span></HStack>
                                    <span>{formatDateTime(scanned.producedAt || scanned.createdAt)}</span>
                                </HStack>
                            </VStack>
                            <HStack gap={2} flexShrink={0}>
                                <Button onClick={() => setLabelPack(scanned)} variant="outline" borderColor={cardBorder} color={textColor} borderRadius="xl" h="40px" px={4}>
                                    <HStack gap={2}><LuPrinter size={16} /><span>Yorliq</span></HStack>
                                </Button>
                                <Button onClick={() => setDeleteTarget(scanned)} bg="red.500" color="white" _hover={{ bg: 'red.600' }} borderRadius="xl" h="40px" px={4}>
                                    <HStack gap={2}><LuTrash2 size={16} /><span>Bu pachkani o‘chirish</span></HStack>
                                </Button>
                                <Button onClick={() => setScanned(null)} variant="ghost" color={subtitleColor} borderRadius="xl" h="40px" w="40px" p={0} minW={0} aria-label="Yopish"><LuX size={16} /></Button>
                            </HStack>
                        </HStack>
                    </Box>
                )}
            </Box>

            {/* ── Filtrlar ── */}
            <HStack w="100%" align={{ base: 'stretch', md: 'center' }} flexDirection={{ base: 'column', md: 'row' }} gap={3} mb={4} p={3}
                bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" boxShadow={isDark ? 'none' : '0 6px 18px rgba(15, 23, 42, 0.06)'}>
                <Box position="relative" flex="1" w="100%">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none"><LuSearch size={18} /></Box>
                    <FormControl value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Mahsulot nomi yoki artikuli..." aria-label="Mahsulot qidirish" pl={11} minH="32px" />
                </Box>
                <Box w={{ base: '100%', md: '260px' }} flexShrink={0}>
                    <FormControl as="select" value={productId} onChange={(e) => { setPage(0); setProductId(e.target.value); }} aria-label="Mahsulot" minH="32px">
                        <option value="">{productsFetching ? 'Yuklanmoqda...' : 'Barcha mahsulotlar'}</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.article ? ` · ${p.article}` : ''}</option>)}
                    </FormControl>
                </Box>
                <Box w={{ base: '100%', md: '200px' }} flexShrink={0}>
                    <FormControl as="select" value={warehouseId} onChange={(e) => { setPage(0); setWarehouseId(e.target.value); }} aria-label="Ombor" minH="32px">
                        <option value="">Barcha omborlar</option>
                        {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </FormControl>
                </Box>
                <Box w={{ base: '100%', md: '170px' }} flexShrink={0}>
                    <FormControl as="select" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value); }} aria-label="Holati" minH="32px">
                        <option value="">Barcha holatlar</option>
                        {Object.entries(PACK_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </FormControl>
                </Box>
                {hasFilter && (
                    <Button type="button" variant="ghost" onClick={resetFilters} color={subtitleColor} borderRadius="xl" minH="32px" px={3} flexShrink={0} title="Filtrlarni tozalash">
                        <HStack gap={1}><LuX size={14} /><span>Tozalash</span></HStack>
                    </Button>
                )}
                <Button type="button" variant="ghost" onClick={() => { setPage(0); refetch(); }} color={subtitleColor} borderRadius="xl" minH="32px" w="32px" p={0} minW={0} flexShrink={0} aria-label="Yangilash" title="Yangilash">
                    <LuRefreshCw size={15} />
                </Button>
            </HStack>

            {bulk && (
                <Box p={3} mb={4} borderRadius="xl" borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.4)' : '#FECACA'} bg={isDark ? 'rgba(239,68,68,.08)' : '#FEF2F2'}>
                    <HStack gap={3}><Spinner size="sm" color="red.500" /><Text fontSize="sm" color={textColor}>O‘chirilmoqda: {bulk.done} / {bulk.total}{bulk.failed ? ` (xato: ${bulk.failed})` : ''}</Text></HStack>
                </Box>
            )}

            {/* ── Ro‘yxat ── */}
            {(isLoading || (isFetching && packs.length === 0)) ? (
                <Loading />
            ) : error ? (
                <Box p={8} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>Ma&apos;lumotlarni yuklashda xatolik</Box>
            ) : packs.length === 0 ? (
                <EmptyData text={hasFilter ? 'Filtr bo‘yicha pachka topilmadi' : 'Hozircha pachkalar yo‘q'} description="Pachkalar stanokdan chiqqanda yoki donaviy qoldiqdan «Pachka yaratish» bilan paydo bo‘ladi." />
            ) : (
                <>
                    <Box overflowX="auto" bg={tableBg} borderWidth="0.5px" borderColor={tableBorder} borderRadius="10px" boxShadow={isDark ? '0 16px 40px rgba(0,0,0,0.22)' : '0 8px 24px rgba(15,23,42,0.10)'}>
                        <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse" minW="900px">
                            <Table.Header bg={tableHeaderBg}>
                                <Table.Row bg={tableHeaderBg}>
                                    {['№', 'Barcode', 'Mahsulot', 'Dona', 'Holati', 'Ombor', 'Stanok', 'Vaqti', 'Amallar'].map((h, i) => (
                                        <Table.ColumnHeader key={h} bg={tableHeaderBg} borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} textAlign={i === 0 || i === 8 ? 'center' : 'start'} w={i === 0 ? '60px' : undefined} whiteSpace="nowrap">{h}</Table.ColumnHeader>
                                    ))}
                                </Table.Row>
                            </Table.Header>
                            <Table.Body bg={tableBg}>
                                {packs.map((pack, index) => (
                                    <Table.Row key={pack.id} bg={scanned?.id === pack.id ? (isDark ? 'rgb(var(--accent-400) / 0.1)' : 'rgb(var(--accent-warm-100))') : tableBg}
                                        _hover={{ bg: isDark ? 'rgb(var(--accent-400) / 0.06)' : 'rgb(var(--accent-warm-50))' }}>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} textAlign="center" color={subtitleColor}>{index + 1}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} fontFamily="mono" fontWeight="semibold" color={textColor} whiteSpace="nowrap">{pack.barcode}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={textColor} fontWeight="semibold">{pack.productName}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={textColor} whiteSpace="nowrap">{formatNumber(pack.pieces)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{renderStatus(pack.status)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} whiteSpace="nowrap">{warehouseName(pack.warehouseId) || '—'}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} whiteSpace="nowrap">{pack.machineName || '—'}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder} color={subtitleColor} whiteSpace="nowrap">{formatDateTime(pack.producedAt || pack.createdAt)}</Table.Cell>
                                        <Table.Cell borderWidth="0.5px" borderColor={tableBorder}>{rowActions(pack)}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                    <InfiniteSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} loaded={packs.length} total={total} unit="ta pachka" onLoadMore={loadMore} />
                </>
            )}

            {labelPack && (
                <PackLabelDialog open onClose={() => setLabelPack(null)} packs={[labelPack]} productName={labelPack.productName} productId={labelPack.productId} warehouseId={labelPack.warehouseId} defaultCopies={2} />
            )}
            <DeleteConfirmDialog
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                isLoading={deleting}
                title="Pachkani o‘chirish"
                itemName={deleteTarget ? `${deleteTarget.barcode} · ${deleteTarget.productName}` : ''}
            />
            <DeleteConfirmDialog
                open={bulkOpen}
                onClose={() => setBulkOpen(false)}
                onConfirm={bulkRun}
                title="Hammasini o‘chirish"
                description={<>{hasFilter ? <>Filtr: <strong>{filterText}</strong>. </> : <strong>Filtr yo‘q — barcha omborlardagi barcha pachkalar. </strong>}<strong>{formatNumber(total)} ta pachka</strong> o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.</>}
            />
        </Box>
    );
}
