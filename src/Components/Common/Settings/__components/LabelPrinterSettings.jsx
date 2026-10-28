import { useEffect, useState } from 'react';
import { Badge, Box, Button, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { LuPrinter, LuRefreshCw, LuCheck } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import SettingsSection from './SettingsSection';
import { QZ_DOWNLOAD_URL, getSavedPrinter, labelErrorMessage, listPrinters, setSavedPrinter } from '../../../../services/labelPrinter';

/** Sozlamalar → «Yorliq printeri»: QZ Tray orqali printer tanlash, shu kompyuterda saqlanadi */
export default function LabelPrinterSettings() {
    const { isDark, textColor, subtitleColor, accentColor, cardBorder } = useAppTheme();
    const [printers, setPrinters] = useState([]);
    const [selected, setSelected] = useState(getSavedPrinter());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [savedFlash, setSavedFlash] = useState(false);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const list = await listPrinters();
            setPrinters(list);
            if (!getSavedPrinter()) {
                const x = list.find((p) => /xprinter/i.test(p));
                if (x) setSelected(x);
            }
        } catch (e) {
            setPrinters([]); setError(labelErrorMessage(e));
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const save = () => {
        setSavedPrinter(selected);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
    };
    const saved = getSavedPrinter();

    return (
        <SettingsSection id="label-printer" icon={LuPrinter} title="Yorliq printeri" description="Shtrix-kod yorlig‘i chop etiladigan printer (Xprinter, QZ Tray orqali). Tanlov faqat shu kompyuterda saqlanadi.">
            <VStack align="stretch" gap={3} px={{ base: 4, md: 6 }} py={4}>
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <Text fontSize="sm" color={subtitleColor}>
                        Hozirgi: {saved ? <Badge colorPalette="green" borderRadius="full" px={2}>{saved}</Badge> : <Badge colorPalette="orange" borderRadius="full" px={2}>tanlanmagan</Badge>}
                    </Text>
                    <Button type="button" variant="ghost" size="sm" h="32px" px={3} color={subtitleColor} onClick={load} disabled={loading}>
                        <HStack gap={1.5}><LuRefreshCw size={13} /><span>Printerlarni yangilash</span></HStack>
                    </Button>
                </HStack>

                {loading ? (
                    <HStack><Spinner size="sm" color={accentColor} /><Text fontSize="sm" color={subtitleColor}>QZ Tray ga ulanmoqda...</Text></HStack>
                ) : error ? (
                    <Box px={4} py={3} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.4)' : '#FECACA'} bg={isDark ? 'rgba(239,68,68,.08)' : '#FEF2F2'} borderRadius="xl">
                        <Text fontSize="sm" fontWeight="semibold" color={isDark ? 'red.300' : 'red.600'}>{error}</Text>
                        <Text fontSize="xs" color={subtitleColor} mt={1}>
                            QZ Tray ni shu kompyuterga o‘rnating va ishga tushiring: <a href={QZ_DOWNLOAD_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>qz.io/download</a>. Printer Windows da o‘z drayveri bilan o‘rnatilgan bo‘lishi kerak.
                        </Text>
                    </Box>
                ) : (
                    <HStack flexWrap="wrap" gap={3} align="end">
                        <Box flex="1" minW="240px">
                            <FormControl as="select" value={selected} onChange={(e) => setSelected(e.target.value)}>
                                <option value="">{printers.length ? 'Printerni tanlang' : 'Printer topilmadi'}</option>
                                {printers.map((p) => <option key={p} value={p}>{p}</option>)}
                            </FormControl>
                        </Box>
                        <Button type="button" onClick={save} disabled={!selected || selected === saved} bg={accentColor} color="black" borderRadius="xl" h="52px" px={6} fontWeight="semibold">
                            <HStack gap={2}><LuCheck size={16} /><span>{savedFlash ? 'Saqlandi' : 'Saqlash'}</span></HStack>
                        </Button>
                    </HStack>
                )}
                <Text fontSize="xs" color={subtitleColor} borderTopWidth="1px" borderColor={cardBorder} pt={3} style={{ color: textColor === undefined ? undefined : undefined }}>
                    Chop etish faqat QZ Tray va printer o‘rnatilgan kompyuterda ishlaydi. Serverda imzo kaliti sozlanmaguncha QZ Tray har safar «Allow» deb ruxsat so‘raydi — bu normal holat.
                </Text>
            </VStack>
        </SettingsSection>
    );
}
