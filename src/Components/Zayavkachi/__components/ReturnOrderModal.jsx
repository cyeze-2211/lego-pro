import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Dialog, Field, HStack, Portal, Spinner, Table, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuPackage, LuStickyNote, LuUndo2, LuWarehouse } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useReturnSalesOrderMutation } from '../../../store/services/salesOrder.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import { formatPackPiece, splitOrderItem } from '../../ui/order-items';

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
 * POST /sales-orders/{id}/return. Faqat admin va hisobchi uchun ko‘rsatiladi (chaqiruvchi tekshiradi).
 */
export default function ReturnOrderModal({ open, onClose, order }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [mode, setMode] = useState('partial'); // partial | all
    const [draft, setDraft] = useState({});       // { [itemId]: { packs: '', pieces: '' } }
    const [reason, setReason] = useState('');
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
            productName: item.productName,
            productBarcode: item.productBarcode,
            warehouseName: item.warehouseName,
            unitPrice: Number(item.unitPrice) || 0,
            split, total, returned, remaining, ppp,
            maxPacks: ppp > 0 ? Math.floor(remaining / ppp) : 0,
        };
    }), [order]);

    useEffect(() => {
        if (open) { setMode('partial'); setDraft({}); setReason(''); }
    }, [open]);

    const rowPieces = (line) => {
        if (mode === 'all') return line.remaining;
        const d = draft[line.id] ?? {};
        return toInt(d.packs) * line.ppp + toInt(d.pieces);
    };
    const rowError = (line) => {
        if (mode === 'all') return null;
        const d = draft[line.id] ?? {};
        if (line.ppp > 0 && toInt(d.packs) > line.maxPacks) return `Eng ko‘pi ${line.maxPacks} pachka`;
        if (rowPieces(line) > line.remaining) return `Qolganidan ko‘p — eng ko‘pi ${describePieces(line.remaining, line.ppp)}`;
        return null;
    };

    const setRow = (id, key, value) => setDraft((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [key]: digitsOnly(value) } }));
    const fillRow = (line) => setDraft((prev) => ({
        ...prev,
        [line.id]: line.ppp > 0
            ? { packs: String(Math.floor(line.remaining / line.ppp) || ''), pieces: String(line.remaining % line.ppp || '') }
            : { packs: '', pieces: String(line.remaining || '') },
    }));
    const clearRow = (id) => setDraft((prev) => ({ ...prev, [id]: { packs: '', pieces: '' } }));

    const totalRemaining = lines.reduce((s, l) => s + l.remaining, 0);
    const totalPieces = lines.reduce((s, l) => s + rowPieces(l), 0);
    const totalAmount = lines.reduce((s, l) => s + rowPieces(l) * l.unitPrice, 0);
    const hasErrors = lines.some((l) => rowError(l));
    const willBeFull = totalRemaining > 0 && totalPieces === totalRemaining;
    const canSubmit = !isLoading && !hasErrors && totalPieces > 0;

    const submit = async (event) => {
        event.preventDefault();
        if (!canSubmit) {
            if (totalPieces === 0) Alert('Qaytariladigan miqdorni kiriting', 'error');
            else if (hasErrors) Alert('Qaytariladigan miqdor qolganidan ko‘p', 'error');
            return;
        }
        const note = reason.trim();
        if (note.length > 2000) return Alert('Sabab 2000 belgidan oshmasligi kerak', 'error');

        const data = { ...(note ? { reason: note } : {}) };
        if (mode === 'partial') {
            data.items = lines
                .filter((l) => rowPieces(l) > 0)
                .map((l) => ({ itemId: l.id, packQuantity: toInt(draft[l.id]?.packs), pieceQuantity: toInt(draft[l.id]?.pieces) }));
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

    return (
        <Dialog.Root open={open} onOpenChange={(event) => !event.open && !isLoading && onClose()} size="xl" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="960px" w="calc(100% - 32px)">
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

                                    {totalRemaining === 0 ? (
                                        <Text color={subtitleColor} textAlign="center" py={6}>Bu zayavkada mijozda qolgan mahsulot yo‘q — hammasi qaytarilgan.</Text>
                                    ) : (
                                        <Box overflowX="auto" borderWidth="1px" borderColor={isDark ? cardBorder : '#CBD5E1'} borderRadius="xl">
                                            <Table.Root size="sm" minW="760px">
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.ColumnHeader {...headerCell}>Mahsulot</Table.ColumnHeader>
                                                        <Table.ColumnHeader {...headerCell} textAlign="right">Berilgan</Table.ColumnHeader>
                                                        <Table.ColumnHeader {...headerCell} textAlign="right">Mijozda qolgan</Table.ColumnHeader>
                                                        <Table.ColumnHeader {...headerCell} textAlign="right" minW="260px">Qaytariladi</Table.ColumnHeader>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {lines.map((line) => {
                                                        const d = draft[line.id] ?? {};
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
                                                                        <VStack align="stretch" gap={1}>
                                                                            <HStack gap={2} justify="flex-end">
                                                                                {line.ppp > 0 && (
                                                                                    <HStack gap={1.5}>
                                                                                        <FormControl value={d.packs ?? ''} onChange={(e) => setRow(line.id, 'packs', e.target.value)} placeholder="0" w="80px" {...inputCx} disabled={isLoading} aria-label="Pachka" />
                                                                                        <Text fontSize="xs" color={subtitleColor}>pachka</Text>
                                                                                    </HStack>
                                                                                )}
                                                                                <HStack gap={1.5}>
                                                                                    <FormControl value={d.pieces ?? ''} onChange={(e) => setRow(line.id, 'pieces', e.target.value)} placeholder="0" w="80px" {...inputCx} disabled={isLoading} aria-label="Dona" />
                                                                                    <Text fontSize="xs" color={subtitleColor}>dona</Text>
                                                                                </HStack>
                                                                                {pieces > 0
                                                                                    ? <Button type="button" size="xs" variant="ghost" h="32px" px={2} color={subtitleColor} onClick={() => clearRow(line.id)} disabled={isLoading}>Tozalash</Button>
                                                                                    : <Button type="button" size="xs" variant="outline" h="32px" px={2} borderColor={isDark ? cardBorder : '#CBD5E1'} color={textColor} onClick={() => fillRow(line)} disabled={isLoading}>Hammasi</Button>}
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
