import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { LuBoxes, LuPrinter } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import { formatNumber } from '../../ui/number-format';
import { useCreateProductPacksMutation } from '../../../store/services/productPack.api';
import PackLabelDialog from '../../ui/PackLabelDialog';

const MAX_PACKS = 500; // POST /product-packs: bir so‘rovda ko‘pi bilan 500

/**
 * Donaviy qoldiqdan pachka yaratish — POST /product-packs { productId, warehouseId, packQuantity }.
 * Omborchi butun pachkalarni sanab kiritadi: server shuncha pachka yaratadi, har biriga barcode beradi va
 * packQuantity × piecesPerPack donani donaviy qoldiqdan pachkalarga o‘tkazadi (jami qoldiq o‘zgarmaydi).
 * Keyin yorliq oynasi ochiladi (GET /product-packs/label?ids=…).
 */
export default function CreatePacksDialog({ open, onClose, stock, onCreated }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const [quantity, setQuantity] = useState('');
    const [createdPacks, setCreatedPacks] = useState(null);
    const [createPacks, { isLoading }] = useCreateProductPacksMutation();

    const ppp = Number(stock?.productPiecesPerPack) || 0;
    const pieceQty = Number(stock?.pieceQuantity) || 0;
    const maxPacks = ppp > 0 ? Math.min(MAX_PACKS, Math.floor(pieceQty / ppp)) : 0;

    useEffect(() => {
        if (open) { setQuantity(maxPacks > 0 ? String(maxPacks) : ''); setCreatedPacks(null); }
    }, [open, maxPacks]);

    const qtyNum = Number(quantity);
    const qtyValid = Number.isInteger(qtyNum) && qtyNum >= 1 && qtyNum <= maxPacks;

    const submit = async (event) => {
        event.preventDefault();
        if (isLoading) return;
        if (!qtyValid) return Alert(maxPacks > 0 ? `Pachka soni 1 dan ${maxPacks} gacha bo‘lsin` : 'Donaviy qoldiq bitta pachkaga ham yetmaydi', 'error');
        try {
            const packs = await createPacks({ productId: stock.productId, warehouseId: stock.warehouseId, packQuantity: qtyNum }).unwrap();
            Alert(`${qtyNum} ta pachka yaratildi — har biriga barcode berildi`, 'success');
            onCreated?.(packs);
            setCreatedPacks((packs || []).map((p) => ({ ...p, productName: p.productName || stock.productName })));
        } catch (error) {
            Alert(error?.data?.message || 'Pachka yaratishda xatolik', 'error');
        }
    };

    if (createdPacks) {
        return <PackLabelDialog open onClose={onClose} packs={createdPacks} productName={stock?.productName} defaultCopies={2} />;
    }

    return (
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && !isLoading && onClose()} size="sm" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="460px" w="calc(100% - 32px)">
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bg={`linear-gradient(90deg, ${accentColor}, #FDE047)`} />
                        <Dialog.Header color={textColor} fontSize="xl" fontWeight="bold" pt={7} pb={4} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={2.5} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><LuBoxes size={22} /></Box>
                                <VStack align="start" gap={0}>
                                    <span>Pachka yaratish</span>
                                    <Text color={subtitleColor} fontSize="sm" fontWeight="normal" noOfLines={1}>{stock?.productName}</Text>
                                </VStack>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish" disabled={isLoading}><X /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={5}>
                            <form id="create-packs-form" onSubmit={submit}>
                                <VStack gap={4} align="stretch">
                                    <Box px={4} py={3} borderRadius="xl" bg={isDark ? 'whiteAlpha.50' : '#F8FAFC'}>
                                        <Text fontSize="sm" color={textColor}>
                                            Donaviy qoldiq: <strong>{formatNumber(pieceQty)} dona</strong>
                                            {ppp > 0 && <> · 1 pachka = <strong>{ppp} dona</strong> · ko‘pi bilan <strong>{maxPacks} pachka</strong></>}
                                        </Text>
                                        <Text fontSize="xs" color={subtitleColor} mt={1}>
                                            Ombordagi butun pachkalarni sanab kiriting. Har biriga barcode beriladi va yorliq chop etiladi; jami qoldiq o‘zgarmaydi.
                                        </Text>
                                    </Box>
                                    {ppp <= 0 ? (
                                        <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>Bu mahsulotda «1 pachka = ? dona» belgilanmagan — mahsulot sozlamasida kiriting.</Text>
                                    ) : maxPacks <= 0 ? (
                                        <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'}>Donaviy qoldiq bitta pachkaga yetmaydi.</Text>
                                    ) : (
                                        <Field.Root required>
                                            <Field.Label color={textColor}>Nechta pachka</Field.Label>
                                            <FormControl type="number" min={1} max={maxPacks} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={isLoading} autoFocus fontSize="xl" fontWeight="bold" minH="52px" />
                                            <Field.HelperText color={qtyValid || quantity === '' ? subtitleColor : (isDark ? 'red.300' : 'red.600')}>
                                                {qtyValid ? `${formatNumber(qtyNum * ppp)} dona pachkalarga o‘tadi, ${formatNumber(pieceQty - qtyNum * ppp)} dona donaviy qoladi` : `1 dan ${maxPacks} gacha`}
                                            </Field.HelperText>
                                        </Field.Root>
                                    )}
                                </VStack>
                            </form>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={4} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5} disabled={isLoading}>Bekor qilish</Button>
                            <Button type="submit" form="create-packs-form" disabled={isLoading || !qtyValid} bg={accentColor} color="black" borderRadius="xl" h="44px" px={7} fontWeight="semibold">
                                {isLoading ? <HStack gap={2}><Spinner size="sm" /><span>Yaratilmoqda...</span></HStack> : <HStack gap={2}><LuPrinter size={18} /><span>Yaratish va yorliq</span></HStack>}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

CreatePacksDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    stock: PropTypes.shape({
        productId: PropTypes.string,
        productName: PropTypes.string,
        warehouseId: PropTypes.string,
        pieceQuantity: PropTypes.number,
        productPiecesPerPack: PropTypes.number,
    }),
    onCreated: PropTypes.func,
};
