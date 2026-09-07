import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Portal,
    Spinner,
    Text,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, Package, X } from 'lucide-react';
import { LuPlus, LuUtensils } from 'react-icons/lu';
import { useCreateProductRecipeMutation } from '../../../../store/services/productRecept.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import RecipeItemsForm from './RecipeItemsForm';

export default function Create({ products, rawMaterials }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [productId, setProductId] = useState('');
    const [items, setItems] = useState([{ rawMaterialId: '', quantity: '', unit: 'KG', stepOrder: 1 }]);
    const [createRecipe, { isLoading }] = useCreateProductRecipeMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const reset = () => {
        setProductId('');
        setItems([{ rawMaterialId: '', quantity: '', unit: 'KG', stepOrder: 1 }]);
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!productId) {
            Alert('Mahsulotni tanlang', 'error');
            return;
        }
        if (items.length === 0) {
            Alert('Retsept kamida bitta qatordan iborat bo‘lishi kerak', 'error');
            return;
        }
        const hasInvalid = items.some((item) => !item.rawMaterialId || !item.quantity || Number(item.quantity) <= 0);
        if (hasInvalid) {
            Alert('Har bir qatorda xom ashyo va miqdor majburiy', 'error');
            return;
        }
        const rawIds = items.map((item) => item.rawMaterialId);
        if (new Set(rawIds).size !== rawIds.length) {
            Alert('Bir xil xom ashyo bir necha marta kiritilgan', 'error');
            return;
        }

        try {
            await createRecipe({
                productId,
                items: items.map((item) => ({
                    rawMaterialId: item.rawMaterialId,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    stepOrder: item.stepOrder,
                })),
            }).unwrap();
            Alert('Retsept muvaffaqiyatli yaratildi', 'success');
            onClose();
            reset();
        } catch (error) {
            Alert(error?.data?.message || 'Retsept yaratishda xatolik', 'error');
        }
    };

    return (
        <>
            <Button
                onClick={onOpen}
                bg={accentColor}
                color="black"
                borderRadius="xl"
                fontWeight="semibold"
                px={4}
                py={4}
                boxShadow="md"
                _hover={{ bg: isDark ? 'yellow.300' : 'yellow.500', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                transition="all 0.2s"
            >
                <HStack gap={2}><LuPlus size={20} /><span>Retsept qo‘shish</span></HStack>
            </Button>

            <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : onClose())} size="md" placement="center" scrollBehavior="inside">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="720px" w="calc(100% - 32px)">
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#FEFCE8'} borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'} borderWidth="1px" color={accentColor}>
                                        <LuUtensils size={24} />
                                    </Box>
                                    <span>Yangi retsept</span>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><X /></Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6}>
                                <VStack gap={6} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><Package size={16} /><span>Mahsulot</span></HStack><Field.RequiredIndicator /></Field.Label>
                                        <FormControl as="select" value={productId} onChange={(event) => setProductId(event.target.value)} w="100%" minH="52px">
                                            <option value="">Mahsulotni tanlang</option>
                                            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                                        </FormControl>
                                    </Field.Root>
                                    <RecipeItemsForm items={items} setItems={setItems} rawMaterials={rawMaterials} />
                                    <Text fontSize="sm" color={subtitleColor}>Har bir mahsulot uchun faqat bitta retsept bo‘lishi mumkin.</Text>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                                <Button variant="ghost" onClick={onClose} color={subtitleColor} borderWidth="1px" borderStyle="solid" borderColor={isDark ? 'transparent' : '#CBD5E1'} _hover={{ bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100', color: textColor }} size="lg" px={6} borderRadius="xl">Bekor qilish</Button>
                                <Button onClick={handleSubmit} disabled={isLoading} bg={accentColor} color="black" size="lg" borderRadius="xl" px={8} fontWeight="semibold" _hover={{ bg: 'yellow.500', transform: 'scale(1.02)', boxShadow: 'lg' }} _active={{ transform: 'scale(0.98)' }}>
                                    {isLoading ? <HStack gap={2}><Spinner size="sm" color="black" /><span>Saqlanmoqda...</span></HStack> : <HStack gap={2}><Check size={20} /><span>Saqlash</span></HStack>}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    );
}

Create.propTypes = {
    products: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
    rawMaterials: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
};
