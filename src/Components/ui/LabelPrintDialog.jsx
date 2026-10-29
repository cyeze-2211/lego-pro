import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuPrinter, LuRefreshCw } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import { Alert } from '../Other/UI/Alert/Alert';
import FormControl from './FormControl';
import {
    QZ_DOWNLOAD_URL, getSavedPrinter, labelErrorMessage, listPrinters, printProductLabel, printStockLabel, setSavedPrinter,
} from '../../services/labelPrinter';

/**
 * «Yorliq chop etish» oynasi: nusxalar soni (1–1000), printer va «Chop etish».
 * Printer ro‘yxati QZ Tray dan; tanlov localStorage da (har kompyuter o‘zinikini eslaydi).
 * transactionId (kirim yozuvi) berilsa — shu yozuv yorlig‘i; bo‘lmasa productId bo‘yicha so‘nggi kirim yozuvi.
 */
export default function LabelPrintDialog({ open, onClose, transactionId, productId, productName, defaultCopies = 1, onPrinted }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [copies, setCopies] = useState(String(defaultCopies));
    const [printers, setPrinters] = useState([]);
    const [printer, setPrinter] = useState(getSavedPrinter());
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const [qzError, setQzError] = useState('');
    const [printing, setPrinting] = useState(false);

    const loadPrinters = async () => {
        setLoadingPrinters(true); setQzError('');
        try {
            const list = await listPrinters();
            setPrinters(list);
            const saved = getSavedPrinter();
            if (saved && list.includes(saved)) setPrinter(saved);
            else {
                const x = list.find((p) => /xprinter/i.test(p));
                setPrinter(x || '');
            }
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
    }, [open, defaultCopies]);

    const copiesNum = Number(copies);
    const copiesValid = Number.isInteger(copiesNum) && copiesNum >= 1 && copiesNum <= 1000;

    const print = async (event) => {
        event.preventDefault();
        if (printing) return;
        if (!copiesValid) return Alert('Nusxalar soni 1 dan 1000 gacha bo‘lsin', 'error');
        if (!printer) return Alert('Printerni tanlang', 'error');
        setPrinting(true);
        try {
            setSavedPrinter(printer);
            if (transactionId) await printStockLabel(transactionId, copiesNum, printer);
            else await printProductLabel(productId, copiesNum, printer);
            Alert('Yorliq printerga yuborildi', 'success');
            onPrinted?.();
            onClose();
        } catch (error) {
            Alert(labelErrorMessage(error), 'error');
        } finally {
            setPrinting(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && !printing && onClose()} size="sm" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="440px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${accentColor}, #FDE047)`} />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={2.5} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><LuPrinter size={22} /></Box>
                                <VStack align="start" gap={0}>
                                    <span>Yorliq chop etish</span>
                                    {productName && <Text color={subtitleColor} fontSize="sm" fontWeight="normal" noOfLines={1}>{productName}</Text>}
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={printing}><X /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5}>
                            <form id="label-print-form" onSubmit={print}>
                                <VStack gap={4} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor}>Nusxalar soni</Field.Label>
                                        <FormControl type="number" min={1} max={1000} step={1} value={copies} onChange={(e) => setCopies(e.target.value)} disabled={printing} autoFocus />
                                        {!copiesValid && copies !== '' && <Field.HelperText color={isDark ? 'red.300' : 'red.600'}>1 dan 1000 gacha</Field.HelperText>}
                                    </Field.Root>
                                    <Field.Root required>
                                        <HStack justify="space-between" mb={1}>
                                            <Field.Label color={textColor} mb={0}>Printer</Field.Label>
                                            <Button type="button" variant="ghost" size="xs" h="26px" px={2} color={subtitleColor} onClick={loadPrinters} disabled={loadingPrinters || printing}>
                                                <HStack gap={1}><LuRefreshCw size={12} /><span>Yangilash</span></HStack>
                                            </Button>
                                        </HStack>
                                        {loadingPrinters ? (
                                            <HStack minH="52px"><Spinner size="sm" color={accentColor} /><Text fontSize="sm" color={subtitleColor}>QZ Tray dan printerlar olinmoqda...</Text></HStack>
                                        ) : qzError ? (
                                            <Box px={4} py={3} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.4)' : '#FECACA'} bg={isDark ? 'rgba(239,68,68,.08)' : '#FEF2F2'} borderRadius="xl">
                                                <Text fontSize="sm" fontWeight="semibold" color={isDark ? 'red.300' : 'red.600'}>{qzError}</Text>
                                                <Text fontSize="xs" color={subtitleColor} mt={1}>
                                                    QZ Tray ni shu kompyuterga o‘rnating va ishga tushiring: <a href={QZ_DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>qz.io/download</a>
                                                </Text>
                                            </Box>
                                        ) : (
                                            <FormControl as="select" value={printer} onChange={(e) => setPrinter(e.target.value)} disabled={printing}>
                                                <option value="">{printers.length ? 'Printerni tanlang' : 'Printer topilmadi'}</option>
                                                {printers.map((p) => <option key={p} value={p}>{p}</option>)}
                                            </FormControl>
                                        )}
                                        <Field.HelperText color={subtitleColor}>Tanlov shu kompyuterda eslab qolinadi.</Field.HelperText>
                                    </Field.Root>
                                </VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={printing}>Bekor qilish</Button>
                            <Button type="submit" form="label-print-form" disabled={printing || loadingPrinters || !printer || !copiesValid} bg={accentColor} color="black" borderRadius="xl" h="44px" px={7} fontWeight="semibold">
                                {printing ? <HStack gap={2}><Spinner size="sm" /><span>Yuborilmoqda...</span></HStack> : <HStack gap={2}><LuPrinter size={18} /><span>Chop etish</span></HStack>}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

LabelPrintDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    transactionId: PropTypes.string,
    productId: PropTypes.string,
    productName: PropTypes.string,
    defaultCopies: PropTypes.number,
    onPrinted: PropTypes.func,
};
