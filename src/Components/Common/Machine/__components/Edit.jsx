import { useEffect, useState } from 'react';
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
import { Check, Cog, Layers3, X } from 'lucide-react';
import { LuPen, LuTag } from 'react-icons/lu';
import { useUpdateMachineMutation } from '../../../../store/services/machine.api';
import { useGetMachineCategoriesQuery } from '../../../../store/services/machineCategory.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

export default function Edit({ machine }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState(machine.name);
    const [summary, setSummary] = useState(machine.summary || '');
    const [categoryId, setCategoryId] = useState(machine.category?.id || '');
    const [updateMachine, { isLoading }] = useUpdateMachineMutation();
    const { data: categoryResult, isLoading: categoriesLoading, isError: categoriesError } = useGetMachineCategoriesQuery({ page: 0, size: 200, sort: ['name,ASC', 'id,ASC'] }, { skip: !open });
    const categories = categoryResult?.items ?? [];
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    useEffect(() => {
        if (open) {
            setName(machine.name);
            setSummary(machine.summary || '');
            setCategoryId(machine.category?.id || '');
        }
    }, [open, machine]);

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!name.trim()) {
            Alert('Stanok nomi majburiy', 'error');
            return;
        }
        if (!categoryId) {
            Alert('Stanok kategoriyasi majburiy', 'error');
            return;
        }
        try {
            await updateMachine({ id: machine.id, data: { name: name.trim(), categoryId, summary: summary.trim() || null } }).unwrap();
            Alert('Stanok yangilandi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Stanokni yangilashda xatolik', 'error');
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
                _hover={{ bg: isDark ? 'rgb(var(--accent-400) / 0.16)' : 'yellow.50', color: isDark ? 'yellow.200' : 'yellow.700' }}
            >
                <LuPen size={16} />
            </Button>

            <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : onClose())} size="md" placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="520px" w="calc(100% - 32px)">
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl" bg={isDark ? 'rgb(var(--accent-400) / 0.1)' : 'rgb(var(--accent-50))'} borderColor={isDark ? 'rgb(var(--accent-400) / 0.2)' : 'rgb(var(--accent-warm-200))'} borderWidth="1px" color={accentColor}>
                                        <Cog size={24} />
                                    </Box>
                                    <span>Stanokni tahrirlash</span>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><X /></Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6}>
                                <VStack gap={6} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuTag size={16} /><span>Stanok nomi</span></HStack><Field.RequiredIndicator /></Field.Label>
                                        <FormControl value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan, Non pishiradigan pech 1" autoFocus minH="52px" />
                                    </Field.Root>
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><Layers3 size={16} /><span>Kategoriya</span></HStack><Field.RequiredIndicator /></Field.Label>
                                        <FormControl
                                            as="select"
                                            value={categoryId}
                                            onChange={(event) => setCategoryId(event.target.value)}
                                            minH="52px"
                                            disabled={isLoading || categoriesLoading || categoriesError || categories.length === 0}
                                        >
                                            <option value="">
                                                {categoriesLoading
                                                    ? 'Kategoriyalar yuklanmoqda...'
                                                    : categoriesError
                                                    ? 'Kategoriyalarni yuklashda xatolik'
                                                    : categories.length === 0
                                                    ? 'Avval stanok kategoriyasini qo‘shing'
                                                    : 'Kategoriyani tanlang'}
                                            </option>
                                            {categoryId && !categories.some((category) => category.id === categoryId) && (
                                                <option value={categoryId}>{machine.category?.name || 'Mavjud kategoriya'}</option>
                                            )}
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>{category.name}</option>
                                            ))}
                                        </FormControl>
                                        {!categoriesLoading && !categoriesError && categories.length === 0 && (
                                            <Field.HelperText color={subtitleColor}>Stanok kategoriyalari sahifasida kategoriya yarating.</Field.HelperText>
                                        )}
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><Cog size={16} /><span>Izoh (ixtiyoriy)</span></HStack></Field.Label>
                                        <FormControl as="textarea" rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Masalan, Kunlik quvvati: 2 tonna" minH="90px" resize="vertical" />
                                    </Field.Root>
                                    <Text fontSize="sm" color={subtitleColor}>Saqlash davom etayotgan ishlab chiqarish seansiga ta’sir qilmaydi.</Text>
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
    machine: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        summary: PropTypes.string,
        category: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
    }).isRequired,
};
