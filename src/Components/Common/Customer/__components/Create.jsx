import { useState } from 'react';
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
import { Check, User, X } from 'lucide-react';
import {
    LuDollarSign,
    LuPhone,
    LuPlus,
    LuStickyNote,
    LuMapPin,
    LuHash,
    LuUserCheck,
    LuSend,
    LuTrendingUp,
    LuTrendingDown,
    LuWallet,
} from 'react-icons/lu';
import { useCreateCustomerMutation } from '../../../../store/services/customer.api';
import { useGetCustomerAgentsQuery } from '../../../../store/services/customerAgent.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

const PHONE_REGEX = /^\+998\d{9}$/;

const formatPhone = (value) => {
    const digits = String(value).replace(/\D/g, '');
    const hasCountryCode = String(value).trim().startsWith('+998')
        || (digits.length > 9 && digits.startsWith('998'));
    const localDigits = (hasCountryCode ? digits.slice(3) : digits).slice(0, 9);
    const groups = [
        localDigits.slice(0, 2),
        localDigits.slice(2, 5),
        localDigits.slice(5, 7),
        localDigits.slice(7, 9),
    ].filter(Boolean);

    return `+998${groups.map((group) => `-${group}`).join('')}`;
};

const getPhoneCursorPosition = (value, digitCount) => {
    if (digitCount === 0) return 0;

    let digitsSeen = 0;
    for (let index = 0; index < value.length; index += 1) {
        if (/\d/.test(value[index])) {
            digitsSeen += 1;
            if (digitsSeen === digitCount) return index + 1;
        }
    }
    return value.length;
};

// "200000" -> "200 000"
const formatBalanceDisplay = (raw) => {
    if (raw === '' || raw === null || raw === undefined) return '';
    const str = String(raw);
    const [intPart, decPart] = str.split('.');
    const formattedInt = (intPart || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};

const initialForm = {
    name: '',
    phone: '+998',
    summary: '',
    balance: '',
    balanceType: 'credit',
    address: '',
    inn: '',
    agentId: '',
    agentName: '',
    telegramChatId: '',
};

const numberInputSx = {
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
        '-webkit-appearance': 'none',
        margin: 0,
    },
    '& input[type=number]': {
        '-moz-appearance': 'textfield',
    },
};

export default function Create({ onCreated, compact = false, onBeforeOpen }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(initialForm);
    const [createCustomer, { isLoading }] = useCreateCustomerMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const { data: agentsData } = useGetCustomerAgentsQuery(
        { size: 200 },
        { skip: !open }
    );
    const agents = agentsData?.items ?? [];

    // Agent tanlanganda agentName va telegramChatId ni avtomatik to'ldirish
    const handleAgentChange = (agentId) => {
        const found = agents.find((a) => a.id === agentId);
        setForm((p) => ({
            ...p,
            agentId,
            agentName:      found ? found.name       : '',
            telegramChatId: found ? (found.telegramId ?? '') : '',
        }));
    };

    const parsedBalance = Number(form.balance);
    const hasValidBalance = form.balance !== '' && Number.isFinite(parsedBalance) && parsedBalance >= 0;
    const previewAmount = hasValidBalance ? parsedBalance : 0;

    const handleOpen = () => {
        onBeforeOpen?.();
        onOpen();
    };

    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handlePhoneChange = (event) => {
        const input = event.currentTarget;
        const rawValue = input.value;
        const digitsBeforeCursor = rawValue.slice(0, input.selectionStart ?? rawValue.length)
            .replace(/\D/g, '').length;
        const rawDigits = rawValue.replace(/\D/g, '');
        const hasCountryCode = rawValue.trim().startsWith('+998')
            || (rawDigits.length > 9 && rawDigits.startsWith('998'));
        const localDigitsBeforeCursor = Math.max(0, digitsBeforeCursor - (hasCountryCode ? 3 : 0));
        const formattedValue = formatPhone(rawValue);

        setField('phone', formattedValue);
        requestAnimationFrame(() => {
            const cursorPosition = getPhoneCursorPosition(formattedValue, 3 + localDigitsBeforeCursor);
            input.setSelectionRange(cursorPosition, cursorPosition);
        });
    };

    const handleBalanceChange = (event) => {
        const input = event.currentTarget;
        const rawValue = input.value;
        const cursorPos = input.selectionStart ?? rawValue.length;
        const beforeCursor = rawValue.slice(0, cursorPos);

        // Sanitize: faqat raqamlar va bitta nuqta
        let cleaned = rawValue.replace(/\s/g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
        const dotIndex = cleaned.indexOf('.');
        if (dotIndex !== -1) {
            cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
        }

        setField('balance', cleaned);

        // Kursorni to'g'ri joyga qaytarish
        const digitsBefore = beforeCursor.replace(/[^\d]/g, '').length;
        const hasDotBefore = /[.,]/.test(beforeCursor);
        const decimalsBefore = hasDotBefore
            ? (beforeCursor.split(/[.,]/)[1] || '').replace(/[^\d]/g, '').length
            : 0;

        requestAnimationFrame(() => {
            const formatted = formatBalanceDisplay(cleaned);
            let newPos = formatted.length;
            if (hasDotBefore) {
                const dotPos = formatted.indexOf('.');
                newPos = dotPos !== -1 ? dotPos + 1 + decimalsBefore : formatted.length;
            } else {
                let seen = 0;
                for (let i = 0; i < formatted.length; i += 1) {
                    if (/\d/.test(formatted[i])) {
                        seen += 1;
                        if (seen === digitsBefore) {
                            newPos = i + 1;
                            break;
                        }
                    }
                }
            }
            input.setSelectionRange(newPos, newPos);
        });
    };

    const reset = () => setForm(initialForm);

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!form.name.trim()) {
            Alert('Mijoz nomi majburiy', 'error');
            return;
        }
        const phone = form.phone.replace(/-/g, '').trim();
        if (!PHONE_REGEX.test(phone)) {
            Alert('Telefon formati: +998-XX-XXX-XX-XX', 'error');
            return;
        }
        const balanceAmount = form.balance === '' ? 0 : Number(form.balance);
        if (!Number.isFinite(balanceAmount) || balanceAmount < 0) {
            Alert('Boshlang‘ich qoldiqni kiriting (masalan, 0)', 'error');
            return;
        }
        const balance = balanceAmount === 0
            ? 0
            : form.balanceType === 'debt' ? -balanceAmount : balanceAmount;

        try {
            const created = await createCustomer({
                name: form.name.trim(),
                phone,
                summary: form.summary.trim() || null,
                balance,
                address: form.address.trim() || null,
                inn: form.inn.trim() || null,
                agentName: form.agentName.trim() || null,
                telegramChatId: form.telegramChatId.trim() || null,
            }).unwrap();

            Alert('Mijoz muvaffaqiyatli yaratildi', 'success');
            onCreated?.(created);
            onClose();
            reset();
        } catch (error) {
            Alert(error?.data?.message || 'Mijoz yaratishda xatolik', 'error');
        }
    };

    const balanceTypeAccent = form.balanceType === 'debt' ? 'red' : 'green';

    return (
        <>
            {compact ? (
                <Button
                    type="button"
                    onClick={handleOpen}
                    aria-label="Mijoz qo‘shish"
                    h="48px"
                    w="48px"
                    minW="48px"
                    p={0}
                    bg={accentColor}
                    color="black"
                    borderRadius="xl"
                    boxShadow="md"
                    _hover={{ bg: isDark ? 'yellow.300' : 'yellow.500', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                    transition="all 0.2s"
                >
                    <LuPlus size={20} />
                </Button>
            ) : (
                <Button
                    type="button"
                    onClick={handleOpen}
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
                    <HStack gap={2}><LuPlus size={20} /><span>Mijoz qo‘shish</span></HStack>
                </Button>
            )}

            <Dialog.Root
                open={open}
                onOpenChange={(event) => (event.open ? handleOpen() : onClose())}
                size="2xl"
                placement="center"
            >
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content
                            bg={cardBg}
                            borderColor={modalBorder}
                            borderWidth="1px"
                            borderRadius="2xl"
                            boxShadow="2xl"
                            overflow="hidden"
                            maxW="880px"
                            w="calc(100% - 32px)"
                            maxH="92vh"
                        >
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                            <Dialog.Header
                                color={textColor}
                                fontSize="2xl"
                                fontWeight="bold"
                                pt={7}
                                pb={5}
                                borderBottomWidth="1px"
                                borderColor={modalBorder}
                            >
                                <HStack gap={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#FEFCE8'}
                                        borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'}
                                        borderWidth="1px"
                                        color={accentColor}
                                    >
                                        <User size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>Yangi mijoz</span>
                                        <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>
                                            Barcha kerakli ma’lumotlarni to‘ldiring
                                        </Box>
                                    </VStack>
                                </HStack>
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish">
                                    <X />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6} overflowY="auto">
                                <VStack gap={8} align="stretch">

                                    {/* === Asosiy ma'lumotlar === */}
                                    <Box>
                                        <HStack mb={4} gap={2} color={accentColor} fontWeight="semibold" fontSize="sm" textTransform="uppercase" letterSpacing="wide">
                                            <User size={16} />
                                            <span>Asosiy ma’lumotlar</span>
                                            <Box flex="1" h="1px" bg={modalBorder} />
                                        </HStack>

                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                            <Field.Root required gridColumn={{ base: 'auto', md: 'span 2' }}>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><User size={16} /><span>Mijoz nomi</span></HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormControl
                                                    value={form.name}
                                                    onChange={(e) => setField('name', e.target.value)}
                                                    placeholder="Masalan, Akmal Karimov"
                                                    autoFocus
                                                    size="lg"
                                                    minH="52px"
                                                />
                                            </Field.Root>

                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuPhone size={16} /><span>Telefon</span></HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormControl
                                                    value={form.phone}
                                                    onChange={handlePhoneChange}
                                                    placeholder="+998-99-233-55-18"
                                                    type="tel"
                                                    minH="52px"
                                                />
                                            </Field.Root>

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuHash size={16} /><span>INN / STIR</span></HStack>
                                                </Field.Label>
                                                <FormControl
                                                    value={form.inn}
                                                    onChange={(e) => setField('inn', e.target.value)}
                                                    placeholder="302123456"
                                                    minH="52px"
                                                />
                                            </Field.Root>

                                            {/* === Boshlang'ich balans — hammasi bitta qatorda, full width === */}
                                            <Field.Root gridColumn={{ base: 'auto', md: 'span 2' }}>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuWallet size={16} />
                                                        <span>Boshlang‘ich balans</span>
                                                    </HStack>
                                                </Field.Label>

                                                <HStack gap={3} align="stretch" flexWrap="nowrap" w="full" sx={numberInputSx}>
                                                    {/* Kredit (+) — ikonka tugma */}
                                                    <Button
                                                        type="button"
                                                        onClick={() => setField('balanceType', 'credit')}
                                                        aria-label="Kredit"
                                                        variant="outline"
                                                        flexShrink={0}
                                                        h="52px"
                                                        minW="52px"
                                                        px={3}
                                                        borderWidth="2px"
                                                        borderColor={form.balanceType === 'credit' ? 'green.400' : modalBorder}
                                                        bg={form.balanceType === 'credit'
                                                            ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'green.50')
                                                            : 'transparent'}
                                                        color={form.balanceType === 'credit'
                                                            ? (isDark ? 'green.200' : 'green.600')
                                                            : subtitleColor}
                                                        borderRadius="xl"
                                                        transition="all 0.2s"
                                                        _hover={{
                                                            bg: form.balanceType === 'credit'
                                                                ? (isDark ? 'rgba(34, 197, 94, 0.22)' : 'green.100')
                                                                : (isDark ? 'whiteAlpha.50' : 'gray.50'),
                                                            borderColor: 'green.400',
                                                            color: isDark ? 'green.200' : 'green.600',
                                                        }}
                                                    >
                                                        <HStack gap={2}>
                                                            <LuTrendingUp size={18} />
                                                            <Box fontWeight="bold" fontSize="sm">+</Box>
                                                        </HStack>
                                                    </Button>

                                                    {/* Qarzdor (−) — ikonka tugma */}
                                                    <Button
                                                        type="button"
                                                        onClick={() => setField('balanceType', 'debt')}
                                                        aria-label="Qarzdor"
                                                        variant="outline"
                                                        flexShrink={0}
                                                        h="52px"
                                                        minW="52px"
                                                        px={3}
                                                        borderWidth="2px"
                                                        borderColor={form.balanceType === 'debt' ? 'red.400' : modalBorder}
                                                        bg={form.balanceType === 'debt'
                                                            ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'red.50')
                                                            : 'transparent'}
                                                        color={form.balanceType === 'debt'
                                                            ? (isDark ? 'red.200' : 'red.600')
                                                            : subtitleColor}
                                                        borderRadius="xl"
                                                        transition="all 0.2s"
                                                        _hover={{
                                                            bg: form.balanceType === 'debt'
                                                                ? (isDark ? 'rgba(239, 68, 68, 0.22)' : 'red.100')
                                                                : (isDark ? 'whiteAlpha.50' : 'gray.50'),
                                                            borderColor: 'red.400',
                                                            color: isDark ? 'red.200' : 'red.600',
                                                        }}
                                                    >
                                                        <HStack gap={2}>
                                                            <LuTrendingDown size={18} />
                                                            <Box fontWeight="bold" fontSize="sm">−</Box>
                                                        </HStack>
                                                    </Button>

                                                    {/* Input + so'm suffix — full width */}
                                                    <Box position="relative" flex="1" minW={0} w="full">
                                                        <FormControl
                                                            value={formatBalanceDisplay(form.balance)}
                                                            onChange={handleBalanceChange}
                                                            placeholder="0"
                                                            type="text"
                                                            inputMode="decimal"
                                                            h="52px"
                                                            minH="52px"
                                                            pr="64px"
                                                            _focus={{ borderColor: `${balanceTypeAccent}.400` }}
                                                        />
                                                        <Box
                                                            position="absolute"
                                                            right="16px"
                                                            top="50%"
                                                            transform="translateY(-50%)"
                                                            fontSize="sm"
                                                            fontWeight="medium"
                                                            color={subtitleColor}
                                                            pointerEvents="none"
                                                            userSelect="none"
                                                        >
                                                            so‘m
                                                        </Box>
                                                    </Box>
                                                </HStack>

                                                {/* Preview / helper */}
                                                <Field.HelperText color={subtitleColor} mt={2}>
                                                    {hasValidBalance && previewAmount > 0 ? (
                                                        <>
                                                            Saqlanadigan balans:{' '}
                                                            <Box
                                                                as="span"
                                                                fontWeight="bold"
                                                                color={form.balanceType === 'debt' ? 'red.400' : 'green.400'}
                                                            >
                                                                {form.balanceType === 'debt' ? '−' : '+'}
                                                                {formatBalanceDisplay(previewAmount)} so‘m
                                                            </Box>
                                                        </>
                                                    ) : (
                                                        "Bo‘sh qoldirsangiz — balans 0 bo‘ladi."
                                                    )}
                                                </Field.HelperText>
                                            </Field.Root>

                                            <Field.Root gridColumn={{ base: 'auto', md: 'span 2' }}>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuMapPin size={16} /><span>Manzil</span></HStack>
                                                </Field.Label>
                                                <FormControl
                                                    value={form.address}
                                                    onChange={(e) => setField('address', e.target.value)}
                                                    placeholder="Masalan, Samarqand sh., Registon ko‘chasi 12"
                                                    minH="52px"
                                                />
                                            </Field.Root>
                                        </SimpleGrid>
                                    </Box>

                                    {/* === Agent va Telegram === */}
                                    <Box>
                                        <HStack mb={4} gap={2} color={accentColor} fontWeight="semibold" fontSize="sm" textTransform="uppercase" letterSpacing="wide">
                                            <LuUserCheck size={16} />
                                            <span>Agent va Telegram</span>
                                            <Box flex="1" h="1px" bg={modalBorder} />
                                        </HStack>

                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuUserCheck size={16} /><span>Agent</span></HStack>
                                                </Field.Label>
                                                <FormControl
                                                    as="select"
                                                    value={form.agentId}
                                                    onChange={(e) => handleAgentChange(e.target.value)}
                                                    minH="52px"
                                                >
                                                    <option value="">Agent tanlang (ixtiyoriy)</option>
                                                    {agents.map((a) => (
                                                        <option key={a.id} value={a.id}>
                                                            {a.name} — {a.phone}
                                                        </option>
                                                    ))}
                                                </FormControl>
                                                <Field.HelperText color={subtitleColor}>Mijozni biriktirgan agent</Field.HelperText>
                                            </Field.Root>

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuSend size={16} /><span>Telegram Chat ID</span></HStack>
                                                </Field.Label>
                                                <FormControl
                                                    value={form.telegramChatId}
                                                    onChange={(e) => setField('telegramChatId', e.target.value)}
                                                    placeholder="123456789"
                                                    minH="52px"
                                                />
                                                <Field.HelperText color={subtitleColor}>Bot orqali xabar yuborish uchun</Field.HelperText>
                                            </Field.Root>
                                        </SimpleGrid>
                                    </Box>

                                    {/* === Izoh === */}
                                    <Box>
                                        <HStack mb={4} gap={2} color={accentColor} fontWeight="semibold" fontSize="sm" textTransform="uppercase" letterSpacing="wide">
                                            <LuStickyNote size={16} />
                                            <span>Izoh</span>
                                            <Box flex="1" h="1px" bg={modalBorder} />
                                        </HStack>

                                        <Field.Root>
                                            <FormControl
                                                as="textarea"
                                                rows={3}
                                                value={form.summary}
                                                onChange={(e) => setField('summary', e.target.value)}
                                                placeholder="Masalan, Do‘kon: Chorsu bozori"
                                                minH="90px"
                                                resize="vertical"
                                            />
                                        </Field.Root>
                                    </Box>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer
                                gap={3}
                                pt={5}
                                pb={6}
                                borderTopWidth="1px"
                                borderColor={modalBorder}
                                bg={isDark ? 'rgba(15, 23, 42, 0.4)' : 'gray.50'}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    color={subtitleColor}
                                    borderWidth="1px"
                                    borderStyle="solid"
                                    borderColor={isDark ? 'transparent' : '#CBD5E1'}
                                    _hover={{ bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100', color: textColor }}
                                    size="lg"
                                    px={6}
                                    borderRadius="xl"
                                >
                                    Bekor qilish
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    bg={accentColor}
                                    color="black"
                                    size="lg"
                                    borderRadius="xl"
                                    px={8}
                                    fontWeight="semibold"
                                    _hover={{ bg: 'yellow.500', transform: 'scale(1.02)', boxShadow: 'lg' }}
                                    _active={{ transform: 'scale(0.98)' }}
                                >
                                    {isLoading ? (
                                        <HStack gap={2}><Spinner size="sm" color="black" /><span>Saqlanmoqda...</span></HStack>
                                    ) : (
                                        <HStack gap={2}><Check size={20} /><span>Saqlash</span></HStack>
                                    )}
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
    onCreated: PropTypes.func,
    compact: PropTypes.bool,
    onBeforeOpen: PropTypes.func,
};