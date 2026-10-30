import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuPackage, LuPrinter, LuRefreshCw } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import { Alert } from '../Other/UI/Alert/Alert';
import FormControl from '../ui/FormControl';
import { useAppDispatch } from '../../store/hooks';
import { useCreateStockTransactionMutation } from '../../store/services/productStock.api';
import { useGetWarehousesQuery } from '../../store/services/warehouse.api';
import {
    LABEL_MAX_COPIES, QZ_DOWNLOAD_URL, getSavedPrinter, labelErrorMessage, listPrinters, looksLikeLabelPrinter, printStockLabel, setSavedPrinter,
} from '../../services/labelPrinter';
import { shouldPrintLabel } from './labelPolicy';
import { getMachineWarehouseId } from './productionWarehouse';
import StartProductPicker from './MachineDetail/StartProductPicker';

const MAX_PACKS = 500; // backend: bir qatorda ko‘pi bilan 500 pachka

/*
 * Seriyali ishlab chiqarish: bitta IN yozuvi (quantity = pachka soni, unit PACK, machineId). Server har pachkaga
 * uniq barcode beradi (javobda productPack[]), yorliq GET /product-stock-transactions/{id}/label?copies=N —
 * N har pachkaga (0–10), har yorliqda o‘z barcode‘i.
 *
 * Ikki rejim:
 *  - productId berilgan — stanokdagi joriy mahsulot uchun (stanokchi, PRODUCE_WITH_DIALOG = true bo‘lsa);
 *  - pickProduct — admin: mahsulot qidiruv/filtr bilan tanlanadi, kirim ombori ham shu yerda tanlanadi.
 */
export default function ProduceDialog({ open, onClose, machineId, machineName, warehouseId, productId, productName, pickProduct = false, defaultCopies = 2, onDone }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const dispatch = useAppDispatch();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [quantity, setQuantity] = useState('1');
    const [copies, setCopies] = useState(String(defaultCopies));
    const [printers, setPrinters] = useState([]);
    const [printer, setPrinter] = useState(getSavedPrinter());
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [qzError, setQzError] = useState('');
    const [saving, setSaving] = useState(false);
    const [selProduct, setSelProduct] = useState(null); // pickProduct rejimida tanlangan mahsulot { id, name }
    const [selWarehouseId, setSelWarehouseId] = useState('');
    const [createStockTransaction] = useCreateStockTransactionMutation();
    const { data: warehouses = [] } = useGetWarehousesQuery('PRODUCT', { skip: !pickProduct || !open });

    const effProductId = pickProduct ? selProduct?.id : productId;
    const effProductName = pickProduct ? selProduct?.name : productName;
    const effWarehouseId = pickProduct ? selWarehouseId : warehouseId;

    const loadPrinters = async () => {
        setLoadingPrinters(true); setQzError('');
        try {
            const list = await listPrinters();
            setPrinters(list);
            const saved = getSavedPrinter();
            if (saved && list.includes(saved)) setPrinter(saved);
            else setPrinter(list.find(looksLikeLabelPrinter) || '');
        } catch (error) {
            setPrinters([]);
            setQzError(labelErrorMessage(error));
        } finally {
            setLoadingPrinters(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setQuantity('1');
        setCopies(String(defaultCopies));
        setSelProduct(null);
        setSelWarehouseId(warehouseId || getMachineWarehouseId(machineId) || '');
        loadPrinters();
    }, [open, defaultCopies, warehouseId, machineId]);

    // Admin: ombor bitta bo‘lsa o‘zi tanlanadi
    useEffect(() => {
        if (!pickProduct || !open || !warehouses.length) return;
        setSelWarehouseId((cur) => (cur && warehouses.some((w) => w.id === cur) ? cur : (warehouses.length === 1 ? warehouses[0].id : '')));
    }, [pickProduct, open, warehouses]);

    const qtyNum = Number(quantity);
    const copiesNum = Number(copies);
    const qtyValid = Number.isInteger(qtyNum) && qtyNum >= 1 && qtyNum <= MAX_PACKS;
    const copiesValid = Number.isInteger(copiesNum) && copiesNum >= 0 && copiesNum <= LABEL_MAX_COPIES;
    const totalLabels = qtyValid && copiesValid ? qtyNum * copiesNum : 0;
    const ready = Boolean(effProductId && effWarehouseId);

    const submit = async (event) => {
        event.preventDefault();
        if (saving) return;
        if (!effProductId) return Alert('Mahsulotni tanlang', 'error');
        if (!effWarehouseId) return Alert('Kirim omborini tanlang', 'error');
        if (!qtyValid) return Alert(`Pachka soni 1 dan ${MAX_PACKS} gacha bo‘lsin`, 'error');
        if (!copiesValid) return Alert(`Har pachkaga nusxa 0 dan ${LABEL_MAX_COPIES} gacha bo‘lsin`, 'error');
        if (totalLabels > 0 && !printer && !qzError) return Alert('Printerni tanlang', 'error');
        setSaving(true);
        try {
            // Bitta IN yozuvi: quantity = pachka soni (unit PACK → backend donaga o‘giradi)
            const txResult = await createStockTransaction({
                action: 'IN',
                machineId,
                warehouseId: effWarehouseId,
                items: [{ productId: effProductId, quantity: qtyNum, unit: 'PACK' }],
            }).unwrap();
            const entries = Array.isArray(txResult) ? txResult : (txResult?.data ?? []);
            const txId = entries[0]?.id;
            const packs = entries[0]?.productPack ?? []; // [{ id, barcode }]
            Alert(`${qtyNum} pachka qayd etildi — ${effProductName || 'mahsulot'}`, 'success');
            onDone?.({ quantity: qtyNum, transactionId: txId || null, packs, productId: effProductId, warehouseId: effWarehouseId });

            // Yorliq: faqat tayyor mahsulot va kirim yozuvi bo‘lsa (brakda massiv bo‘sh)
            if (txId && totalLabels > 0) {
                const print = await shouldPrintLabel(dispatch, effProductId);
                if (print) {
                    if (printer) setSavedPrinter(printer);
                    try {
                        // copies — har pachkaga; server shu yozuvning har pachkasiga o‘z barcode‘i bilan yorliq tayyorlaydi
                        await printStockLabel(txId, copiesNum, printer || undefined);
                        Alert(`${totalLabels} ta yorliq printerga yuborildi (${qtyNum} pachka × ${copiesNum})`, 'success');
                    } catch (error) {
                        Alert(labelErrorMessage(error), 'error');
                    }
                }
            }
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Qayd etishda xatolik', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && !saving && onClose()} size={pickProduct ? 'lg' : 'sm'} placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW={pickProduct ? '760px' : '480px'} w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${accentColor}, #FDE047)`} />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={2.5} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><LuPackage size={22} /></Box>
                                <VStack align="start" gap={0}>
                                    <span>{pickProduct ? 'Seriyali ishlab chiqarish' : 'Mahsulotni qayd etish'}</span>
                                    <Text color={subtitleColor} fontSize="sm" fontWeight="normal" noOfLines={1}>
                                        {machineName ? `${machineName}${effProductName ? ' · ' : ''}` : ''}{effProductName || (pickProduct ? 'Mahsulot tanlang — har pachkaga barcode va yorliq' : '')}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={saving}><X /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5} maxH="calc(100vh - 220px)" overflowY="auto">
                            <form id="produce-form" onSubmit={submit}>
                                <VStack gap={4} align="stretch">
                                    {pickProduct && (
                                        <>
                                            <Field.Root required>
                                                <Field.Label color={textColor}>Kirim ombori</Field.Label>
                                                <FormControl as="select" value={selWarehouseId} onChange={(e) => setSelWarehouseId(e.target.value)} disabled={saving}>
                                                    <option value="">{warehouses.length ? 'Omborni tanlang' : 'Omborlar yuklanmoqda...'}</option>
                                                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                </FormControl>
                                            </Field.Root>
                                            <StartProductPicker
                                                selectedId={selProduct?.id}
                                                onSelect={(id, product) => setSelProduct({ id, name: product?.name || '' })}
                                                isDark={isDark} cardBorder={cardBorder} textColor={textColor} subtitleColor={subtitleColor} accentColor={accentColor}
                                            />
                                        </>
                                    )}

                                    <SimpleGrid columns={2} gap={4}>
                                        <Field.Root required>
                                            <Field.Label color={textColor}>Nechta pachka</Field.Label>
                                            <FormControl type="number" min={1} max={MAX_PACKS} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={saving} autoFocus={!pickProduct} fontSize="xl" fontWeight="bold" minH="52px" />
                                            {!qtyValid && quantity !== '' && <Field.HelperText color={isDark ? 'red.300' : 'red.600'}>1 dan {MAX_PACKS} gacha</Field.HelperText>}
                                        </Field.Root>
                                        <Field.Root>
                                            <Field.Label color={textColor}>Har pachkaga yorliq</Field.Label>
                                            <FormControl type="number" min={0} max={LABEL_MAX_COPIES} step={1} value={copies} onChange={(e) => setCopies(e.target.value)} disabled={saving} fontSize="xl" fontWeight="bold" minH="52px" />
                                            <Field.HelperText color={subtitleColor}>0 — yorliqsiz, 2 — ikki tomoniga</Field.HelperText>
                                        </Field.Root>
                                    </SimpleGrid>

                                    <Box px={4} py={3} borderRadius="xl" borderWidth="1px" borderColor={isDark ? 'rgb(var(--accent-400) / .3)' : 'rgb(var(--accent-warm-200))'} bg={isDark ? 'rgb(var(--accent-400) / .08)' : 'rgb(var(--accent-warm-50))'}>
                                        <Text fontSize="sm" color={textColor}>
                                            Omborga kiradi: <strong>{qtyValid ? qtyNum : '—'} pachka</strong>
                                            {' · '}Chop etiladi: <strong>{totalLabels} ta yorliq</strong>{totalLabels > 0 && <span style={{ opacity: .7 }}> (har pachkaga o‘z barcode‘i)</span>}
                                        </Text>
                                    </Box>

                                    <Field.Root>
                                        <HStack justify="space-between" mb={1}>
                                            <Field.Label color={textColor} mb={0}>Printer</Field.Label>
                                            <Button type="button" variant="ghost" size="xs" h="26px" px={2} color={subtitleColor} onClick={loadPrinters} disabled={loadingPrinters || saving}>
                                                <HStack gap={1}><LuRefreshCw size={12} /><span>Yangilash</span></HStack>
                                            </Button>
                                        </HStack>
                                        {loadingPrinters ? (
                                            <HStack minH="52px"><Spinner size="sm" color={accentColor} /><Text fontSize="sm" color={subtitleColor}>QZ Tray dan printerlar olinmoqda...</Text></HStack>
                                        ) : qzError ? (
                                            <Box px={4} py={3} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.4)' : '#FECACA'} bg={isDark ? 'rgba(239,68,68,.08)' : '#FEF2F2'} borderRadius="xl">
                                                <Text fontSize="sm" fontWeight="semibold" color={isDark ? 'red.300' : 'red.600'}>{qzError}</Text>
                                                <Text fontSize="xs" color={subtitleColor} mt={1}>
                                                    Yorliqsiz qayd etish mumkin. QZ Tray: <a href={QZ_DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>qz.io/download</a>
                                                </Text>
                                            </Box>
                                        ) : (
                                            <FormControl as="select" value={printer} onChange={(e) => setPrinter(e.target.value)} disabled={saving}>
                                                <option value="">{printers.length ? 'Printerni tanlang' : 'Printer topilmadi'}</option>
                                                {printers.map((p) => <option key={p} value={p}>{p}</option>)}
                                            </FormControl>
                                        )}
                                    </Field.Root>
                                </VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={saving}>Bekor qilish</Button>
                            <Button type="submit" form="produce-form" disabled={saving || loadingPrinters || !qtyValid || !copiesValid || !ready} bg={accentColor} color="black" borderRadius="xl" h="44px" px={7} fontWeight="semibold">
                                {saving ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack> : <HStack gap={2}><LuPrinter size={18} /><span>Qayd etish{totalLabels > 0 ? ' va chop etish' : ''}</span></HStack>}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

ProduceDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    machineId: PropTypes.string,
    machineName: PropTypes.string,
    warehouseId: PropTypes.string,
    productId: PropTypes.string,
    productName: PropTypes.string,
    pickProduct: PropTypes.bool,
    defaultCopies: PropTypes.number,
    onDone: PropTypes.func,
};
