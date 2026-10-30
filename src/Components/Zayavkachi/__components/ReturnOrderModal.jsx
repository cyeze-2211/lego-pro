import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Dialog, Field, HStack, Portal, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuBarcode, LuCircleAlert, LuCircleCheck, LuPackage, LuStickyNote, LuUndo2, LuWarehouse, LuX } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useReturnSalesOrderMutation } from '../../../store/services/salesOrder.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import { formatPackPiece, splitOrderItem } from '../../ui/order-items';
import usePackScanner, { beep } from '../../ui/usePackScanner';

const ORANGE = '#EA580C';
const toInt = (value) => { const n = parseInt(String(value ?? '').replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : 0; };
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');

/** Donani «N pachka + M dona (= K dona)» ko‘rinishiga keltiradi */
const describePieces = (pieces, piecesPerPack) => {
    if (pieces <= 0) return '0 dona';
    if (piecesPerPack > 0 && pieces >= piecesPerPack) {
        return `${formatPackPiece({ packs: Math.floor(pieces / piecesPerPack), pieces: pieces % piecesPerPack })} (= ${formatNumber(pieces)} dona)`;
    }
    return `${formatNumber(pieces)} dona`;
};

/**
 * Tugallangan (CONFIRMED) zayavkadan mahsulot qaytarish — qisman yoki to‘liq.
 * POST /sales-orders/{id}/return { reason?, items?: [{ itemId, packBarcodes?, pieceQuantity? }] }
 * Butun pachka — yorlig‘idagi barcode skanerlanadi (shu qator bilan chiqib ketgan bo‘lishi shart, omborga yana
 * pachka bo‘lib kiradi); yorlig‘i yo‘q mahsulot dona bilan yoziladi (donaviy qoldiqqa kiradi).
 * items bo‘lmasa — mijozdagi hamma qolgan mahsulot qaytadi.
 */
export default function ReturnOrderModal({ open, onClose, order }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [mode, setMode] = useState('partial'); // partial | all
    const [draft, setDraft] = useState({});       // { [itemId]: { packs: [pack], pieces: '' } }
    const [reason, setReason] = useState('');
    const [lastScan, setLastScan] = useState(null);
    const [returnOrder, { isLoading }] = useReturnSalesOrderMutation();

    /* Qatorlar: berilgan, qaytarilgan, qolgan (dona) */
    const lines = useMemo(() => (order?.items ?? []).map((item) => {
        const split = splitOrderItem(item);
        const total = Number(item.quantity) || 0;
        const returned = Number(item.returnedQuantity) || 0;
        const remaining = Math.max(0, total - returned);
        const ppp = split.packs > 0 ? split.piecesPerPack : 0;
        return {
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productBarcode: item.productBarcode,
            warehouseName: item.warehouseName,
            unitPrice: Number(item.unitPrice) || 0,
            split, total, returned, remaining, ppp,
        };
    }), [order]);

    useEffect(() => {
        if (open) { setMode('partial'); setDraft({}); setReason(''); setLastScan(null); }
    }, [open]);

    const rowPacks = (line) => draft[line.id]?.packs ?? [];
    const rowPackPieces = (line) => rowPacks(line).reduce((s, p) => s + (Number(p.pieces) || 0), 0);
    const rowPieces = (line) => {
        if (mode === 'all') return line.remaining;
        return rowPackPieces(line) + toInt(draft[line.id]?.pieces);
    };
    const rowError = (line) => {
        if (mode === 'all') return null;
        if (rowPieces(line) > line.remaining) return `Qolganidan ko‘p — eng ko‘pi ${describePieces(line.remaining, line.ppp)}`;
        return null;
    };

    const setRowPieces = (id, value) => setDraft((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { packs: [] }), pieces: digitsOnly(value) } }));
    const removePack = (id, barcode) => setDraft((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), packs: (prev[id]?.packs ?? []).filter((p) => p.barcode !== barcode) } }));
    const clearRow = (id) => setDraft((prev) => ({ ...prev, [id]: { packs: [], pieces: '' } }));
    const fillRow = (line) => setDraft((prev) => ({ ...prev, [line.id]: { packs: [], pieces: String(line.remaining || '') } }));

    /* Skaner: chiqib ketgan (SHIPPED) pachka → shu mahsulot qatoriga */
    const handlePack = (pack) => {
        const already = lines.some((l) => rowPacks(l).some((p) => p.barcode === pack.barcode));
        if (already) { setLastScan({ ok: false, text: `Pachka ${pack.barcode} allaqachon qo‘shilgan` }); return; }
        if (pack.status !== 'SHIPPED') {
            setLastScan({ ok: false, text: pack.status === 'IN_STOCK' ? `Pachka ${pack.barcode} omborda turibdi — chiqib ketmagan` : `Pachka ${pack.barcode} ochilgan — dona bilan yozing` });
            return;
        }
        const candidates = lines.filter((l) => l.productId === pack.productId && l.remaining > 0);
        if (!candidates.length) { setLastScan({ ok: false, text: `«${pack.productName}» bu zayavkada yo‘q yoki hammasi qaytarilgan` }); return; }
        const line = candidates.find((l) => rowPieces(l) + (Number(pack.pieces) || 0) <= l.remaining) ?? candidates[0];
        setDraft((prev) => ({ ...prev, [line.id]: { ...(prev[line.id] ?? { pieces: '' }), packs: [...(prev[line.id]?.packs ?? []), pack] } }));
        beep(true);
        setLastScan({ ok: true, text: `${pack.productName} — pachka ${pack.barcode} (${pack.pieces} dona) qo‘shildi` });
    };
    const scanner = usePackScanner({ enabled: open && mode === 'partial' && !isLoading, onPack: handlePack, onError: (text) => setLastScan({ ok: false, text }) });

    const totalRemaining = lines.reduce((s, l) => s + l.remaining, 0);
    const totalPieces = lines.reduce((s, l) => s + rowPieces(l), 0);
    const totalAmount = lines.reduce((s, l) => s + rowPieces(l) * l.unitPrice, 0);
    const hasErrors = lines.some((l) => rowError(l));
    const willBeFull = totalRemaining > 0 && totalPieces === totalRemaining;
    const canSubmit = !isLoading && !hasErrors && totalPieces > 0;

    const submit = async (event) => {
        event.preventDefault();
        if (!canSubmit) {
            if (totalPieces === 0) Alert('Qaytariladigan pachkani skanerlang yoki dona kiriting', 'error');
            else if (hasErrors) Alert('Qaytariladigan miqdor qolganidan ko‘p', 'error');
            return;
        }
        const note = reason.trim();
        if (note.length > 2000) return Alert('Sabab 2000 belgidan oshmasligi kerak', 'error');

        const data = { ...(note ? { reason: note } : {}) };
        if (mode === 'partial') {
            data.items = lines
                .filter((l) => rowPieces(l) > 0)
                .map((l) => {
                    const packBarcodes = rowPacks(l).map((p) => p.barcode);
                    const pieceQuantity = toInt(draft[l.id]?.pieces);
                    return { itemId: l.id, ...(packBarcodes.length ? { packBarcodes } : {}), ...(pieceQuantity > 0 ? { pieceQuantity } : {}) };
                });
        }
        try {
            const result = await returnOrder({ id: order.id, customerId: order.customerId, data }).unwrap();
            Alert(result?.status === 'RETURNED'
                ? `Zayavka to‘liq qaytarildi — ${formatNumber(totalPieces)} dona`
                : `Qaytarildi: ${formatNumber(totalPieces)} dona, ${formatNumber(totalAmount)} so‘m`, 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Qaytarishni saqlashda xatolik', 'error');
        }
    };

    const segment = (key, label) => {
        const active = mode === key;
        return (
            <Button key={key} type="button" flex="1" h="40px" borderRadius="lg" variant="ghost" onClick={() => setMode(key)} disabled={isLoading}
                bg={active ? ORANGE : 'transparent'} color={active ? 'white' : subtitleColor} fontWeight="semibold"
                _hover={{ bg: active ? ORANGE : (isDark ? 'whiteAlpha.200' : 'gray.200'), color: active ? 'white' : textColor }}>
                {label}
            </Button>
        );
    };

    const headerCell = { color: subtitleColor, fontSize: 'xs', textTransform: 'uppercase', letterSpacing: 'wider', fontWeight: 'bold', px: 3, py: 2.5, bg: isDark ? '#0f172a80' : '#F8FAFC' };
    const inputCx = { h: '40px', minH: '40px', py: 0, px: 3, textAlign: 'right', inputMode: 'numeric', fontWeight: 'bold' };
    const chipCx = { display: 'inline-flex', alignItems: 'center', gap: 1, borderRadius: 'md', borderWidth: '1px', px: 2, py: 0.5, fontFamily: 'mono', fontSize: 'xs', fontWeight: 'bold',
        borderColor: isDark ? 'rgba(249,115,22,.4)' : '#FDBA74', bg: isDark ? 'rgba(249,115,22,.12)' : '#FFF7ED', color: isDark ? '#fdba74' : '#9A3412' };

    return (
        <Dialog.Root open={open} onOpenChange={(event) => !event.open && !isLoading && onClose()} size="xl" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="1000px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${ORANGE}, ${ORANGE}99)`} />
                        <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(249,115,22,.14)' : '#FFEDD5'} color={ORANGE}><LuUndo2 size={24} /></Box>
                                <VStack align="start" gap={0}>
                                    <span>Mahsulot qaytarish</span>
                                    <Text color={subtitleColor} fontSize="sm" fontWeight="normal">
                                        {order?.customerName} · #{String(order?.id ?? '').slice(0, 8).toUpperCase()}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={isLoading}><X /></Button>
                        </Dialog.CloseTrigger>

                        <Dialog.Body py={5}>
                            <form id="return-order-form" onSubmit={submit}>
                                <VStack gap={5} align="stretch">
                                    <HStack gap={1} p={1} bg={isDark ? 'whiteAlpha.100' : 'gray.100'} borderRadius="xl">
                                        {segment('partial', 'Qisman — tanlab qaytarish')}
                                        {segment('all', 'Hammasini qaytarish')}
                                    </HStack>

                                    {mode === 'partial' && totalRemaining > 0 && (
                                        <Box>
                                            <Field.Label color={textColor} mb={1}>
                                                <HStack gap={2}><LuBarcode size={16} /><span>Qaytayotgan pachka yorlig‘ini skanerlang</span></HStack>
                                            </Field.Label>
                                            <FormControl {...scanner.inputProps} placeholder="Pistolet bilan o‘qing yoki barcode‘ni terib Enter bosing" fontFamily="mono" fontSize="lg" letterSpacing="wider" minH="52px" disabled={isLoading} autoFocus />
                                            <Text mt={1.5} fontSize="sm" fontWeight="semibold" color={lastScan ? (lastScan.ok ? (isDark ? 'green.300' : 'green.700') : (isDark ? 'red.300' : 'red.600')) : subtitleColor}>
                                                {lastScan
                                                    ? <HStack gap={1.5} as="span">{lastScan.ok ? <LuCircleCheck size={14} /> : <LuCircleAlert size={14} />}<span>{lastScan.text}</span></HStack>
                                                    : 'Butun pachka — barcode bilan (omborga yana pachka bo‘lib kiradi). Yorlig‘i yo‘q mahsulot — «dona» maydonida.'}
                                            </Text>
                                        </Box>
                                    )}

                                    {totalRemaining === 0 ? (
                                        <Text color={subtitleColor} textAlign="center" py={6}>Bu zayavkada mijozda qolgan mahsulot yo‘q — hammasi qaytarilgan.</Text>
                                    ) : (
                                        <Box overflowX="auto" borderWidth="1px" borderColor={isDark ? cardBorder : '#CBD5E1'} borderRadius="xl">
                                            <Table.Root size="sm" minW="820px">
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.ColumnHeader {...headerCell}>Mahsulot</Table.ColumnHeader>
                                                        <Table.ColumnHeader {...headerCell} textAlign="right">Berilgan</Table.ColumnHeader>
                                                        <Table.ColumnHeader {...headerCell} textAlign="right">Mijozda qolgan</Table.ColumnHeader>
                                                        <Table.ColumnHeader {...headerCell} textAlign="right" minW="320px">Qaytariladi</Table.ColumnHeader>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {lines.map((line) => {
                                                        const d = draft[line.id] ?? {};
                                                        const packs = rowPacks(line);
                                                        const pieces = rowPieces(line);
                                                        const error = rowError(line);
                                                        const done = line.remaining === 0;
                                                        return (
                                                            <Table.Row key={line.id} opacity={done ? 0.55 : 1} bg={pieces > 0 && !error ? (isDark ? 'rgba(249,115,22,.06)' : '#FFF7ED') : 'transparent'}>
                                                                <Table.Cell px={3} py={3}>
                                                                    <HStack gap={2.5} align="start">
                                                                        <Box p={1.5} borderRadius="md" bg={isDark ? 'whiteAlpha.100' : 'gray.100'} color={subtitleColor} flexShrink={0}><LuPackage size={14} /></Box>
                                                                        <VStack align="start" gap={0} minW={0}>
                                                                            <Text fontWeight="semibold" color={textColor} fontSize="sm">{line.productName}</Text>
                                                                            <HStack gap={2} fontSize="xs" color={subtitleColor} flexWrap="wrap">
                                                                                {line.productBarcode && <Text fontFamily="mono">{line.productBarcode}</Text>}
                                                                                {line.warehouseName && <HStack gap={1}><LuWarehouse size={11} /><span>{line.warehouseName}</span></HStack>}
                                                                                <Text>{formatNumber(line.unitPrice)} so‘m/dona</Text>
                                                                            </HStack>
                                                                        </VStack>
                                                                    </HStack>
                                                                </Table.Cell>
                                                                <Table.Cell px={3} py={3} textAlign="right" whiteSpace="nowrap">
                                                                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>{formatPackPiece(line.split)}</Text>
                                                                    {line.ppp > 0 && <Text fontSize="xs" color={subtitleColor}>= {formatNumber(line.total)} dona</Text>}
                                                                    {line.returned > 0 && <Text fontSize="xs" color={ORANGE} fontWeight="semibold">↩ {formatNumber(line.returned)} dona qaytarilgan</Text>}
                                                                </Table.Cell>
                                                                <Table.Cell px={3} py={3} textAlign="right" whiteSpace="nowrap">
                                                                    {done
                                                                        ? <Badge colorPalette="orange" borderRadius="full" px={2}>Hammasi qaytgan</Badge>
                                                                        : <Text fontSize="sm" fontWeight="bold" color={textColor}>{describePieces(line.remaining, line.ppp)}</Text>}
                                                                </Table.Cell>
                                                                <Table.Cell px={3} py={3}>
                                                                    {done ? (
                                                                        <Text fontSize="sm" color={subtitleColor} textAlign="right">—</Text>
                                                                    ) : mode === 'all' ? (
                                                                        <Text fontSize="sm" fontWeight="bold" color={ORANGE} textAlign="right">{describePieces(line.remaining, line.ppp)}</Text>
                                                                    ) : (
                                                                        <VStack align="stretch" gap={1.5}>
                                                                            {packs.length > 0 && (
                                                                                <HStack gap={1} flexWrap="wrap" justify="flex-end">
                                                                                    {packs.map((p) => (
                                                                                        <Box key={p.barcode} {...chipCx} title={`${p.pieces} dona`}>
                                                                                            <LuPackage size={11} />{p.barcode}
                                                                                            <Button type="button" variant="ghost" size="xs" h="16px" minW={0} w="16px" p={0} color="inherit" onClick={() => removePack(line.id, p.barcode)} disabled={isLoading} aria-label="Olib tashlash"><LuX size={10} /></Button>
                                                                                        </Box>
                                                                                    ))}
                                                                                </HStack>
                                                                            )}
                                                                            <HStack gap={2} justify="flex-end">
                                                                                <Text fontSize="xs" color={subtitleColor}>{packs.length > 0 ? `${packs.length} pachka +` : ''}</Text>
                                                                                <HStack gap={1.5}>
                                                                                    <FormControl value={d.pieces ?? ''} onChange={(e) => setRowPieces(line.id, e.target.value)} placeholder="0" w="80px" {...inputCx} disabled={isLoading} aria-label="Dona" />
                                                                                    <Text fontSize="xs" color={subtitleColor}>dona</Text>
                                                                                </HStack>
                                                                                {pieces > 0
                                                                                    ? <Button type="button" size="xs" variant="ghost" h="32px" px={2} color={subtitleColor} onClick={() => clearRow(line.id)} disabled={isLoading}>Tozalash</Button>
                                                                                    : <Button type="button" size="xs" variant="outline" h="32px" px={2} borderColor={isDark ? cardBorder : '#CBD5E1'} color={textColor} onClick={() => fillRow(line)} disabled={isLoading} title="Hammasini dona bilan (yorliqsiz)">Hammasi</Button>}
                                                                            </HStack>
                                                                            {error
                                                                                ? <Text fontSize="xs" color={isDark ? 'red.300' : 'red.600'} textAlign="right">{error}</Text>
                                                                                : pieces > 0 && <Text fontSize="xs" color={subtitleColor} textAlign="right">= {formatNumber(pieces)} dona · {formatNumber(pieces * line.unitPrice)} so‘m</Text>}
                                                                        </VStack>
                                                                    )}
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        );
                                                    })}
                                                </Table.Body>
                                            </Table.Root>
                                        </Box>
                                    )}

                                    {/* Jami */}
                                    <Box px={4} py={3} borderRadius="xl" borderWidth="1px" borderColor={isDark ? 'rgba(249,115,22,.35)' : '#FED7AA'} bg={isDark ? 'rgba(249,115,22,.06)' : '#FFF7ED'}>
                                        <HStack justify="space-between" flexWrap="wrap" gap={3}>
                                            <VStack align="start" gap={0}>
                                                <Text fontSize="xs" color={subtitleColor}>Qaytariladi</Text>
                                                <Text fontWeight="bold" color={textColor}>{formatNumber(totalPieces)} dona · {formatNumber(totalAmount)} so‘m</Text>
                                            </VStack>
                                            <Text fontSize="xs" color={subtitleColor} maxW="420px" textAlign={{ base: 'left', md: 'right' }}>
                                                {willBeFull
                                                    ? 'Hamma mahsulot qaytadi — zayavka «Qaytarildi» holatiga o‘tadi.'
                                                    : 'Zayavka «Tugallandi» bo‘lib qoladi, qolgan qarz kamayadi.'}{' '}
                                                Summa mijoz balansiga qo‘shiladi, kassadan pul chiqmaydi.
                                            </Text>
                                        </HStack>
                                    </Box>

                                    <Field.Root>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuStickyNote size={16} /><span>Sabab (ixtiyoriy)</span></HStack>
                                        </Field.Label>
                                        <FormControl as="textarea" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} placeholder="Masalan: brak chiqdi — 5 dona singan" disabled={isLoading} />
                                    </Field.Root>
                                </VStack>
                            </form>
                        </Dialog.Body>

                        <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={isLoading}>Bekor qilish</Button>
                            <Button type="submit" form="return-order-form" disabled={!canSubmit} bg={ORANGE} color="white" borderRadius="xl" h="44px" px={8} fontWeight="semibold" _hover={{ bg: '#C2410C' }} _focusVisible={{ boxShadow: `0 0 0 3px ${accentColor}55` }}>
                                {isLoading
                                    ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack>
                                    : <HStack gap={2}><LuUndo2 size={18} /><span>{mode === 'all' ? 'Hammasini qaytarish' : 'Qaytarishni tasdiqlash'}</span></HStack>}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

ReturnOrderModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    order: PropTypes.shape({
        id: PropTypes.string.isRequired,
        customerId: PropTypes.string,
        customerName: PropTypes.string,
        items: PropTypes.array,
    }),
};
