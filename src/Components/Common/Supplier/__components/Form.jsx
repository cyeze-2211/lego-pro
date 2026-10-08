import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Portal,
    SimpleGrid,
    Spinner,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Building2, X } from 'lucide-react';
import { LuHash, LuMapPin, LuPhone, LuStickyNote, LuTrendingDown, LuTrendingUp } from 'react-icons/lu';
import { useGetRegionsQuery } from '../../../../store/services/region.api';
import { useCreateSupplierMutation, useUpdateSupplierMutation } from '../../../../store/services/supplier.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

const PHONE_REGEX = /^\+998\d{9}$/;

const formatBalanceDisplay = (value) => {
    if (value === '' || value == null) return '';
    const [integerPart, decimalPart] = String(value).split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
};

const emptyForm = {
    name: '',
    phone: '+998',
    summary: '',
    address: '',
    inn: '',
    regionId: '',
    balance: '0',
    balanceType: 'credit',
};

export default function Form({ supplier, openOnMount = false, hideTrigger = false, onClosed }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(emptyForm);
    const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
    const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
    const { data: regions = [], isLoading: isLoadingRegions, isError: regionsError } = useGetRegionsQuery(undefined, { skip: !open });
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const isEdit = Boolean(supplier);
    const isLoading = isCreating || isUpdating;
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    useEffect(() => {
        if (openOnMount) onOpen();
    }, [openOnMount, onOpen]);

    useEffect(() => {
        if (open) {
            setForm(supplier ? {
                name: supplier.name ?? '',
                phone: supplier.phone ?? '+998',
                summary: supplier.summary ?? '',
                address: supplier.address ?? '',
                inn: supplier.inn ?? '',
                regionId: supplier.region?.id == null ? '' : String(supplier.region.id),
                balance: '0',
            } : emptyForm);
        }
    }, [open, supplier]);

    useEffect(() => {
        if (regionsError) Alert('Viloyatlar ro‘yxatini yuklashda xatolik', 'error');
    }, [regionsError]);

    const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    const handleBalanceChange = (event) => {
        const input = event.currentTarget;
        const rawValue = input.value;
        const cursorPosition = input.selectionStart ?? rawValue.length;
        const beforeCursor = rawValue.slice(0, cursorPosition);
        let cleaned = rawValue
            .replace(/\s/g, '')
            .replace(/,/g, '.')
            .replace(/[^\d.]/g, '');
        const decimalIndex = cleaned.indexOf('.');
        if (decimalIndex !== -1) {
            cleaned = cleaned.slice(0, decimalIndex + 1)
                + cleaned.slice(decimalIndex + 1).replace(/\./g, '');
        }

        setField('balance', cleaned);

        const digitsBeforeCursor = beforeCursor.replace(/[^\d]/g, '').length;
        const hasDecimalBeforeCursor = /[.,]/.test(beforeCursor);
        const decimalsBeforeCursor = hasDecimalBeforeCursor
            ? (beforeCursor.split(/[.,]/)[1] || '').replace(/[^\d]/g, '').length
            : 0;

        requestAnimationFrame(() => {
            const formatted = formatBalanceDisplay(cleaned);
            let nextCursorPosition = formatted.length;
            if (hasDecimalBeforeCursor) {
                const formattedDecimalIndex = formatted.indexOf('.');
                nextCursorPosition = formattedDecimalIndex !== -1
                    ? formattedDecimalIndex + 1 + decimalsBeforeCursor
                    : formatted.length;
            } else {
                let seenDigits = 0;
                for (let index = 0; index < formatted.length; index += 1) {
                    if (/\d/.test(formatted[index])) {
                        seenDigits += 1;
                        if (seenDigits === digitsBeforeCursor) {
                            nextCursorPosition = index + 1;
                            break;
                        }
                    }
                }
            }
            input.setSelectionRange(nextCursorPosition, nextCursorPosition);
        });
    };

    const close = () => {
        onClose();
        onClosed?.();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isLoading) return;
        if (!form.name.trim()) {
            Alert('Yetkazib beruvchi nomi majburiy', 'error');
            return;
        }
        if (!PHONE_REGEX.test(form.phone.trim())) {
            Alert('Telefon formati: +998XXXXXXXXX (9 raqam)', 'error');
            return;
        }
        if (!form.regionId) {
            Alert('Viloyatni tanlang', 'error');
            return;
        }

        const payload = {
            name: form.name.trim(),
            phone: form.phone.trim(),
            summary: form.summary.trim() || null,
            address: form.address.trim() || null,
            inn: form.inn.trim() || null,
            regionId: Number(form.regionId),
        };
        if (!isEdit) {
            const balanceAmount = Number(form.balance);
            if (form.balance.trim() === '' || !Number.isFinite(balanceAmount) || balanceAmount < 0) {
                Alert('Boshlang‘ich balansni to‘g‘ri kiriting', 'error');
                return;
            }
            payload.balance = form.balanceType === 'debt' ? -balanceAmount : balanceAmount;
        }

        try {
            if (isEdit) {
                await updateSupplier({ id: supplier.id, data: payload }).unwrap();
                Alert('Yetkazib beruvchi yangilandi', 'success');
            } else {
                await createSupplier(payload).unwrap();
                Alert('Yetkazib beruvchi qo‘shildi', 'success');
            }
            close();
        } catch (error) {
            Alert(error?.data?.message || 'Yetkazib beruvchini saqlashda xatolik', 'error');
        }
    };

    const sectionHeader = (icon, label) => (
        <HStack mb={4} gap={2} color={accentColor} fontWeight="semibold" fontSize="sm" textTransform="uppercase" letterSpacing="wide">
            {icon}<span>{label}</span><Box flex="1" h="1px" bg={modalBorder} />
        </HStack>
    );

    return (
        <>
            {!hideTrigger && (
                <Button onClick={onOpen} variant="ghost" size="sm" color={accentColor} borderRadius="xl" px={3} aria-label="Tahrirlash">
                    <Building2 size={16} />
                </Button>
            )}
            <Dialog.Root
                open={open}
                onOpenChange={(event) => {
                    if (event.open) onOpen();
                    else close();
                }}
                size="2xl"
                placement="center"
            >
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="820px" w="calc(100% - 32px)" maxH="92vh">
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#FEFCE8'} borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'} borderWidth="1px" color={accentColor}>
                                        <Building2 size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>{isEdit ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi'}</span>
                                        {isEdit && <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>{supplier.name}</Box>}
                                    </VStack>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><X /></Button>
                            </Dialog.CloseTrigger>
                            <Dialog.Body py={6} overflowY="auto">
                                <form id="supplier-form" onSubmit={handleSubmit}>
                                    <VStack gap={8} align="stretch">
                                        <Box>
                                            {sectionHeader(<Building2 size={16} />, 'Asosiy ma’lumotlar')}
                                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                                <Field.Root required gridColumn={{ base: 'auto', md: 'span 2' }}>
                                                    <Field.Label color={textColor} fontWeight="medium">Yetkazib beruvchi nomi<Field.RequiredIndicator /></Field.Label>
                                                    <FormControl value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Masalan, Plastmass Invest MChJ" maxLength={255} autoFocus minH="52px" />
                                                </Field.Root>
                                                <Field.Root required>
                                                    <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuPhone size={16} /><span>Telefon</span><Field.RequiredIndicator /></HStack></Field.Label>
                                                    <FormControl value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+998901234567" type="tel" minH="52px" />
                                                    <Field.HelperText color={subtitleColor}>Format: +998 va 9 raqam</Field.HelperText>
                                                </Field.Root>
                                                <Field.Root required>
                                                    <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuMapPin size={16} /><span>Viloyat</span><Field.RequiredIndicator /></HStack></Field.Label>
                                                    <FormControl as="select" value={form.regionId} onChange={(event) => setField('regionId', event.target.value)} minH="52px" disabled={isLoadingRegions || regionsError}>
                                                        <option value="">Viloyatni tanlang</option>
                                                        {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                                                    </FormControl>
                                                </Field.Root>
                                                <Field.Root>
                                                    <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuHash size={16} /><span>INN / STIR</span></HStack></Field.Label>
                                                    <FormControl value={form.inn} onChange={(event) => setField('inn', event.target.value)} placeholder="302123456" minH="52px" />
                                                </Field.Root>
                                                <Field.Root>
                                                    <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuMapPin size={16} /><span>Manzil</span></HStack></Field.Label>
                                                    <FormControl value={form.address} onChange={(event) => setField('address', event.target.value)} placeholder="Toshkent sh., Chilonzor tumani 5" minH="52px" />
                                                </Field.Root>
                                                {!isEdit && (
                                                    <Field.Root required gridColumn={{ base: 'auto', md: 'span 2' }}>
                                                        <Field.Label color={textColor} fontWeight="medium">
                                                            <HStack gap={2}><LuTrendingUp size={16} /><span>Boshlang‘ich balans</span><Field.RequiredIndicator /></HStack>
                                                        </Field.Label>
                                                        <HStack gap={3} align="stretch" w="full">
                                                            <Button
                                                                type="button"
                                                                onClick={() => setField('balanceType', 'credit')}
                                                                aria-label="Oldindan to‘langan balans"
                                                                variant="outline"
                                                                flexShrink={0}
                                                                h="52px"
                                                                minW="52px"
                                                                borderWidth="2px"
                                                                borderColor={form.balanceType === 'credit' ? 'green.400' : modalBorder}
                                                                bg={form.balanceType === 'credit'
                                                                    ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'green.50')
                                                                    : 'transparent'}
                                                                color={form.balanceType === 'credit'
                                                                    ? (isDark ? 'green.200' : 'green.600')
                                                                    : subtitleColor}
                                                                borderRadius="xl"
                                                                _hover={{ borderColor: 'green.400' }}
                                                            >
                                                                <HStack gap={2}><LuTrendingUp size={18} /><Box fontWeight="bold">+</Box></HStack>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={() => setField('balanceType', 'debt')}
                                                                aria-label="Biz qarzdormiz"
                                                                variant="outline"
                                                                flexShrink={0}
                                                                h="52px"
                                                                minW="52px"
                                                                borderWidth="2px"
                                                                borderColor={form.balanceType === 'debt' ? 'red.400' : modalBorder}
                                                                bg={form.balanceType === 'debt'
                                                                    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'red.50')
                                                                    : 'transparent'}
                                                                color={form.balanceType === 'debt'
                                                                    ? (isDark ? 'red.200' : 'red.600')
                                                                    : subtitleColor}
                                                                borderRadius="xl"
                                                                _hover={{ borderColor: 'red.400' }}
                                                            >
                                                                <HStack gap={2}><LuTrendingDown size={18} /><Box fontWeight="bold">−</Box></HStack>
                                                            </Button>
                                                            <FormControl
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={formatBalanceDisplay(form.balance)}
                                                                onChange={handleBalanceChange}
                                                                minH="52px"
                                                            />
                                                        </HStack>
                                                        <Field.HelperText color={subtitleColor}>
                                                            <HStack gap={1}>
                                                                {form.balanceType === 'credit' ? <LuTrendingUp size={13} /> : <LuTrendingDown size={13} />}
                                                                <span>
                                                                    {form.balanceType === 'credit'
                                                                        ? 'Musbat balans — biz oldindan to‘laganmiz.'
                                                                        : 'Manfiy balans — biz qarzdormiz.'}
                                                                    {' '}Keyinchalik balans faqat to‘lovlar orqali o‘zgaradi.
                                                                </span>
                                                            </HStack>
                                                        </Field.HelperText>
                                                    </Field.Root>
                                                )}
                                            </SimpleGrid>
                                        </Box>
                                        <Box>
                                            {sectionHeader(<LuStickyNote size={16} />, 'Qo‘shimcha ma’lumot')}
                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">Izoh</Field.Label>
                                                <FormControl as="textarea" value={form.summary} onChange={(event) => setField('summary', event.target.value)} placeholder="Yetkazib beruvchi haqida izoh" minH="100px" />
                                            </Field.Root>
                                        </Box>
                                    </VStack>
                                </form>
                            </Dialog.Body>
                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                                <Button variant="ghost" onClick={close} color={subtitleColor} size="lg" borderRadius="xl" px={6}>Bekor qilish</Button>
                                <Button type="submit" form="supplier-form" disabled={isLoading || isLoadingRegions || regionsError} bg={accentColor} color="black" size="lg" borderRadius="xl" px={8} fontWeight="semibold" _hover={{ opacity: 0.9 }}>
                                    {isLoading ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack> : isEdit ? 'O‘zgarishlarni saqlash' : 'Yetkazib beruvchini yaratish'}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    );
}

Form.propTypes = {
    supplier: PropTypes.object,
    openOnMount: PropTypes.bool,
    hideTrigger: PropTypes.bool,
    onClosed: PropTypes.func,
};
