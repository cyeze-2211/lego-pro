import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Checkbox, Dialog, Field, HStack, Portal, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuFactory, LuPackage, LuPrinter, LuRefreshCw } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import { Alert } from '../Other/UI/Alert/Alert';
import FormControl from './FormControl';
import { formatDateTime } from './date-format';
import { useLazyGetProductPacksQuery } from '../../store/services/productPack.api';
import {
    LABEL_MAX_COPIES, LABEL_MAX_PACKS, QZ_DOWNLOAD_URL, getSavedPrinter, labelErrorMessage, listPrinters, looksLikeLabelPrinter,
    printPackLabels, setSavedPrinter,
} from '../../services/labelPrinter';

/**
 * Pachka yorliqlarini chop etish: har yorliqda pachkaning o‘z barcode‘i.
 *  - `packs` berilsa (masalan, hozirgina yaratilgan pachkalar) — ular tanlangan holda ko‘rsatiladi;
 *  - bo‘lmasa productId (+ warehouseId) bo‘yicha omborda turgan (IN_STOCK) pachkalar ro‘yxati yuklanadi.
 * Nusxa — har pachkaga (1–10, ikki tomoni uchun 2). GET /product-packs/label?ids=…&copies=N → QZ Tray.
 */
export default function PackLabelDialog({ open, onClose, productId, warehouseId, productName, packs, defaultCopies = 2, onPrinted }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [copies, setCopies] = useState(String(defaultCopies));
    const [printers, setPrinters] = useState([]);
    const [printer, setPrinter] = useState(getSavedPrinter());
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [qzError, setQzError] = useState('');
    const [printing, setPrinting] = useState(false);
    const [selected, setSelected] = useState(() => new Set());
    const [list, setList] = useState([]);
    const [fetchPacks, { isFetching: loadingPacks, isError: packsError }] = useLazyGetProductPacksQuery();

    const loadPrinters = async () => {
        setLoadingPrinters(true); setQzError('');
        try {
            const found = await listPrinters();
            setPrinters(found);
            const saved = getSavedPrinter();
            if (saved && found.includes(saved)) setPrinter(saved);
            else setPrinter(found.find(looksLikeLabelPrinter) || '');
        } catch (error) {
            setPrinters([]);
            setQzError(labelErrorMessage(error));
        } finally {
            setLoadingPrinters(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setCopies(String(defaultCopies));
        loadPrinters();
        if (Array.isArray(packs)) {
            setList(packs);
            setSelected(new Set(packs.map((p) => p.id)));
        } else if (productId) {
            fetchPacks({ productId, warehouseId: warehouseId || undefined, status: 'IN_STOCK', page: 0, size: LABEL_MAX_PACKS, sort: 'createdAt,DESC' })
                .unwrap()
                .then((res) => { setList(res.items); setSelected(new Set(res.items.map((p) => p.id))); })
                .catch(() => { setList([]); setSelected(new Set()); });
        }
    }, [open, defaultCopies, packs, productId, warehouseId, fetchPacks]);

    const copiesNum = Number(copies);
    const copiesValid = Number.isInteger(copiesNum) && copiesNum >= 1 && copiesNum <= LABEL_MAX_COPIES;
    const selectedIds = useMemo(() => list.filter((p) => selected.has(p.id)).map((p) => p.id), [list, selected]);
    const allSelected = list.length > 0 && selectedIds.length === list.length;
    const toggle = (id) => setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((p) => p.id)));

    const print = async (event) => {
        event.preventDefault();
        if (printing) return;
        if (!copiesValid) return Alert(`Nusxa 1 dan ${LABEL_MAX_COPIES} gacha bo‘lsin`, 'error');
        if (selectedIds.length === 0) return Alert('Kamida bitta pachkani tanlang', 'error');
        if (!printer) return Alert('Printerni tanlang', 'error');
        setPrinting(true);
        try {
            setSavedPrinter(printer);
            await printPackLabels(selectedIds, copiesNum, printer);
            Alert(`${selectedIds.length} ta pachka × ${copiesNum} yorliq printerga yuborildi`, 'success');
            onPrinted?.(selectedIds);
            onClose();
        } catch (error) {
            Alert(labelErrorMessage(error), 'error');
        } finally {
            setPrinting(false);
        }
    };

    const rowBg = isDark ? 'whiteAlpha.50' : '#F8FAFC';

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && !printing && onClose()} size="md" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="560px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${accentColor}, #FDE047)`} />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={2.5} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><LuPrinter size={22} /></Box>
                                <VStack align="start" gap={0}>
                                    <span>Pachka yorliqlari</span>
                                    {productName && <Text color={subtitleColor} fontSize="sm" fontWeight="normal" noOfLines={1}>{productName}</Text>}
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={printing}><X /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5}>
                            <form id="pack-label-form" onSubmit={print}>
                                <VStack gap={4} align="stretch">
                                    {/* Pachkalar ro‘yxati */}
                                    <Box>
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                                Pachkalar {list.length > 0 && <Badge ml={1} colorPalette="yellow" borderRadius="full">{selectedIds.length} / {list.length}</Badge>}
                                            </Text>
                                            {list.length > 1 && (
                                                <Button type="button" variant="ghost" size="xs" h="26px" px={2} color={subtitleColor} onClick={toggleAll} disabled={printing}>
                                                    {allSelected ? 'Hammasini bekor qilish' : 'Hammasini tanlash'}
                                                </Button>
                                            )}
                                        </HStack>
                                        {loadingPacks ? (
                                            <HStack minH="52px"><Spinner size="sm" color={accentColor} /><Text fontSize="sm" color={subtitleColor}>Pachkalar yuklanmoqda...</Text></HStack>
                                        ) : packsError ? (
                                            <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>Pachkalarni yuklab bo‘lmadi</Text>
                                        ) : list.length === 0 ? (
                                            <Box px={4} py={3} borderRadius="xl" bg={rowBg}>
                                                <Text fontSize="sm" color={subtitleColor}>Omborda turgan pachka yo‘q. Donaviy qoldiqdan avval «Pachka yaratish» qiling — keyin yorliq chiqadi.</Text>
                                            </Box>
                                        ) : (
                                            <VStack align="stretch" gap={1} maxH="260px" overflowY="auto" pr={1}>
                                                {list.map((p) => (
                                                    <HStack key={p.id} gap={3} px={3} py={2} borderRadius="lg" bg={selected.has(p.id) ? (isDark ? 'rgb(var(--accent-400) / .1)' : 'rgb(var(--accent-warm-50))') : rowBg} cursor="pointer" onClick={() => !printing && toggle(p.id)}>
                                                        <Checkbox.Root checked={selected.has(p.id)} disabled={printing} colorPalette="yellow" size="sm" pointerEvents="none">
                                                            <Checkbox.HiddenInput />
                                                            <Checkbox.Control />
                                                        </Checkbox.Root>
                                                        <VStack align="start" gap={0} flex="1" minW={0}>
                                                            <HStack gap={2}>
                                                                <LuPackage size={14} />
                                                                <Text fontFamily="mono" fontWeight="bold" fontSize="sm" color={textColor}>{p.barcode}</Text>
                                                                {p.pieces != null && <Text fontSize="xs" color={subtitleColor}>{p.pieces} dona</Text>}
                                                            </HStack>
                                                            <Text fontSize="xs" color={subtitleColor} noOfLines={1}>
                                                                {p.machineName ? <><LuFactory size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {p.machineName} · </> : 'Qo‘lda yaratilgan · '}
                                                                {formatDateTime(p.producedAt || p.createdAt)}
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                ))}
                                            </VStack>
                                        )}
                                    </Box>

                                    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                                        <Field.Root required>
                                            <Field.Label color={textColor}>Har pachkaga nusxa</Field.Label>
                                            <FormControl type="number" min={1} max={LABEL_MAX_COPIES} step={1} value={copies} onChange={(e) => setCopies(e.target.value)} disabled={printing} fontWeight="bold" />
                                            <Field.HelperText color={subtitleColor}>{copiesValid ? `Jami ${selectedIds.length * copiesNum} ta yorliq` : `1 dan ${LABEL_MAX_COPIES} gacha`}</Field.HelperText>
                                        </Field.Root>
                                        <Field.Root required>
                                            <HStack justify="space-between" mb={1}>
                                                <Field.Label color={textColor} mb={0}>Printer</Field.Label>
                                                <Button type="button" variant="ghost" size="xs" h="26px" px={2} color={subtitleColor} onClick={loadPrinters} disabled={loadingPrinters || printing}>
                                                    <HStack gap={1}><LuRefreshCw size={12} /><span>Yangilash</span></HStack>
                                                </Button>
                                            </HStack>
                                            {loadingPrinters ? (
                                                <HStack minH="52px"><Spinner size="sm" color={accentColor} /><Text fontSize="sm" color={subtitleColor}>QZ Tray...</Text></HStack>
                                            ) : qzError ? (
                                                <Box px={3} py={2} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.4)' : '#FECACA'} bg={isDark ? 'rgba(239,68,68,.08)' : '#FEF2F2'} borderRadius="xl">
                                                    <Text fontSize="xs" fontWeight="semibold" color={isDark ? 'red.300' : 'red.600'}>{qzError}</Text>
                                                    <Text fontSize="xs" color={subtitleColor}><a href={QZ_DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>qz.io/download</a></Text>
                                                </Box>
                                            ) : (
                                                <FormControl as="select" value={printer} onChange={(e) => setPrinter(e.target.value)} disabled={printing}>
                                                    <option value="">{printers.length ? 'Printerni tanlang' : 'Printer topilmadi'}</option>
                                                    {printers.map((p) => <option key={p} value={p}>{p}</option>)}
                                                </FormControl>
                                            )}
                                        </Field.Root>
                                    </SimpleGrid>
                                </VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={printing}>Yopish</Button>
                            <Button type="submit" form="pack-label-form" disabled={printing || loadingPrinters || loadingPacks || !printer || !copiesValid || selectedIds.length === 0} bg={accentColor} color="black" borderRadius="xl" h="44px" px={7} fontWeight="semibold">
                                {printing ? <HStack gap={2}><Spinner size="sm" /><span>Yuborilmoqda...</span></HStack> : <HStack gap={2}><LuPrinter size={18} /><span>Chop etish</span></HStack>}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

PackLabelDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    productId: PropTypes.string,
    warehouseId: PropTypes.string,
    productName: PropTypes.string,
    packs: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, barcode: PropTypes.string })),
    defaultCopies: PropTypes.number,
    onPrinted: PropTypes.func,
};
