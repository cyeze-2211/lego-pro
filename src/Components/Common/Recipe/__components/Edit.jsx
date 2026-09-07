import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Dialog,
    HStack,
    Portal,
    Spinner,
    Text,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, X } from 'lucide-react';
import { LuPen, LuUtensils } from 'react-icons/lu';
import { useUpdateProductRecipeMutation } from '../../../../store/services/productRecept.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import RecipeItemsForm from './RecipeItemsForm';

export default function Edit({ recipe, rawMaterials }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [items, setItems] = useState([]);
    const [updateRecipe, { isLoading }] = useUpdateProductRecipeMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    useEffect(() => {
        if (open && recipe) {
            setItems((recipe.items || []).map((item) => ({
                rawMaterialId: item.rawMaterialId,
                quantity: String(item.quantity),
                unit: item.unit,
                stepOrder: item.stepOrder,
            })));
        }
    }, [open, recipe]);

    const handleSubmit = async () => {
        if (isLoading) return;
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
            await updateRecipe({
                productId: recipe.productId,
                items: items.map((item) => ({
                    rawMaterialId: item.rawMaterialId,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    stepOrder: item.stepOrder,
                })),
            }).unwrap();
            Alert('Retsept yangilandi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Retseptni yangilashda xatolik', 'error');
        }
    };

    return (
        <>
            <Button
                onClick={onOpen}
                variant="ghost"
                size="sm"
                color={accentColor}
                borderRadius="xl"
                px={3}
                aria-label="Tahrirlash"
                _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.16)' : 'yellow.50', color: isDark ? 'yellow.200' : 'yellow.700' }}
            >
                <LuPen size={16} />
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
                                    <Box>
                                        <span>Retseptni tahrirlash</span>
                                        {recipe?.productName && <Text fontSize="sm" fontWeight="normal" color={subtitleColor} mt={1}>{recipe.productName}</Text>}
                                    </Box>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><X /></Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6}>
                                <VStack gap={6} align="stretch">
                                    <RecipeItemsForm items={items} setItems={setItems} rawMaterials={rawMaterials} />
                                    <Text fontSize="sm" color={subtitleColor}>Saqlashda qatorlar to‘liq almashtiriladi (eski qatorlar o‘chadi).</Text>
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

Edit.propTypes = {
    recipe: PropTypes.shape({
        productId: PropTypes.string.isRequired,
        productName: PropTypes.string,
        items: PropTypes.arrayOf(PropTypes.shape({
            rawMaterialId: PropTypes.string.isRequired,
            quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            unit: PropTypes.string.isRequired,
            stepOrder: PropTypes.number.isRequired,
        })),
    }).isRequired,
    rawMaterials: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
};
