import { useEffect, useRef, useState } from 'react';
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
    Text,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, User, X } from 'lucide-react';
import {
    LuPen,
    LuPhone,
    LuStickyNote,
    LuMapPin,
    LuHash,
    LuUserCheck,
    LuSend,
    LuTrendingUp,
    LuTrendingDown,
    LuWallet,
} from 'react-icons/lu';
import { useGetCustomerByIdQuery, useUpdateCustomerMutation } from '../../../../store/services/customer.api';
import { useGetCustomerAgentsQuery } from '../../../../store/services/customerAgent.api';
import { useGetRegionsQuery } from '../../../../store/services/region.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import { fillBlanks, logBlockedSave } from '../../../ui/form-utils';

const PHONE_REGEX = /^\+998\d{9}$/;

// "200000" -> "200 000" (Create bilan bir xil)
const formatBalanceDisplay = (raw) => {
    if (raw === '' || raw === null || raw === undefined) return '';
    const str = String(raw);
    const [intPart, decPart] = str.split('.');
    const formattedInt = (intPart || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
};

// Balansni formaga: ishorasi tugmaga, moduli maydonga
const balanceToForm = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n === 0) return { balance: '', balanceType: 'credit' };
    return { balance: String(Math.abs(n)), balanceType: n < 0 ? 'debt' : 'credit' };
};
const signedBalance = (form) => {
    const amount = form.balance === '' ? 0 : Number(form.balance);
    if (!Number.isFinite(amount)) return NaN;
    return form.balanceType === 'debt' ? -amount : amount;
};

const buildInitial = (customer) => ({
    name:          customer.name          || '',
    phone:         customer.phone         || '+998',
    summary:       customer.summary       || '',
    address:       customer.address       || '',
    inn:           customer.inn           || '',
    agentId:       customer.agent?.id     || customer.agentId   || '',
    agentName:     customer.agent?.name   || customer.agentName || '',
    telegramChatId: customer.telegramChatId ? String(customer.telegramChatId) : '',
    regionId:      (customer.region?.id ?? customer.regionId) == null ? '' : String(customer.region?.id ?? customer.regionId),
    ...balanceToForm(customer.balance),
});

export default function Edit({ customer, openOnMount = false, hideTrigger = false, onClosed }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(() => buildInitial(customer));
    const [updateCustomer, { isLoading }] = useUpdateCustomerMutation();
    // Oyna ochilganda mijozni serverdan to‘liq qayta yuklaymiz (viloyat, agent va boshqa maydonlar aniq kelsin)
    const { data: customerDetail, isFetching: detailLoading } = useGetCustomerByIdQuery(customer.id, { skip: !open });
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    useEffect(() => {
        if (openOnMount) onOpen();
    }, [openOnMount, onOpen]);

    const { data: agentsData } = useGetCustomerAgentsQuery(
        { size: 200 },
        { skip: !open }
    );
    const { data: regions = [], isError: regionsError } = useGetRegionsQuery(undefined, { skip: !open });
    const agents = agentsData?.items ?? [];

    useEffect(() => {
        if (regionsError) Alert('Viloyatlar ro‘yxatini yuklashda xatolik', 'error');
    }, [regionsError]);

    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const currentBalance = Number(customerDetail?.balance ?? customer.balance ?? 0) || 0;
    const nextBalance = signedBalance(form);
    const balanceChanged = Number.isFinite(nextBalance) && nextBalance !== currentBalance;
    const hasValidBalance = form.balance === '' || (Number.isFinite(Number(form.balance)) && Number(form.balance) >= 0);

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
        const decimalsBefore = hasDotBefore ? (beforeCursor.split(/[.,]/)[1] || '').replace(/[^\d]/g, '').length : 0;
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
                        if (seen === digitsBefore) { newPos = i + 1; break; }
                    }
                }
            }
            input.setSelectionRange(newPos, newPos);
        });
    };

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

    /* Forma faqat oyna ochilganda qayta to‘ldiriladi (ro‘yxat yangilanib qolsa yozilgan matn yo‘qolmasin) */
    const wasOpenRef = useRef(false);
    useEffect(() => {
        if (open && !wasOpenRef.current) setForm(buildInitial(customer));
        wasOpenRef.current = open;
    }, [open, customer]);

    /* Server javobi kelganda bo‘sh maydonlarni to‘ldiramiz */
    useEffect(() => {
        if (open && customerDetail) setForm((prev) => {
            const fresh = buildInitial(customerDetail);
            const next = fillBlanks(prev, fresh);
            // Balans qatorda 0 bo‘lib, serverdan boshqacha kelsa — ishorasi ham yangilansin
            return prev.balance === '' && fresh.balance !== '' ? { ...next, balanceType: fresh.balanceType } : next;
        });
    }, [open, customerDetail]);


    const handleSubmit = async () => {
        if (isLoading) return;
        const block = (message) => {
            logBlockedSave('Mijoz tahrirlash', message, { form, row: customer, detail: customerDetail });
            Alert(message, 'error');
        };

        if (!form.name.trim()) {
            block('Mijoz nomi majburiy');
            return;
        }
        if (!PHONE_REGEX.test(form.phone.trim())) {
            block('Telefon formati: +998XXXXXXXXX (9 raqam)');
            return;
        }
        if (!form.regionId) {
            block('Viloyatni tanlang');
            return;
        }
        if (!hasValidBalance) {
            block('Balansni to‘g‘ri kiriting (masalan, 150 000)');
            return;
        }

        try {
            await updateCustomer({
                id: customer.id,
                data: {
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    summary: form.summary.trim() || null,
                    address: form.address.trim() || null,
                    inn: form.inn.trim() || null,
                    agentId: form.agentId || null,
                    telegramChatId: form.telegramChatId.trim() || null,
                    regionId: Number(form.regionId),
                    // Balans faqat o‘zgartirilgan bo‘lsa yuboriladi — mijoz yozuvida to‘g‘ridan-to‘g‘ri almashtiriladi
                    ...(balanceChanged ? { balance: nextBalance } : {}),
                },
            }).unwrap();
            Alert('Mijoz yangilandi', 'success');
            onClosed?.();
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Mijozni yangilashda xatolik', 'error');
        }
    };

    const sectionHeader = (icon, label) => (
        <HStack mb={4} gap={2} color={accentColor} fontWeight="semibold" fontSize="sm" textTransform="uppercase" letterSpacing="wide">
            {icon}
            <span>{label}</span>
            <Box flex="1" h="1px" bg={modalBorder} />
        </HStack>
    );

    return (
        <>
            {!hideTrigger && (
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
            )}

            <Dialog.Root
                open={open}
                onOpenChange={(event) => {
                    if (event.open) onOpen();
                    else {
                        onClose();
                        onClosed?.();
                    }
                }}
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
                            maxW="820px"
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
                                        bg={isDark ? 'rgb(var(--accent-400) / 0.1)' : 'rgb(var(--accent-50))'}
                                        borderColor={isDark ? 'rgb(var(--accent-400) / 0.2)' : 'rgb(var(--accent-warm-200))'}
                                        borderWidth="1px"
                                        color={accentColor}
                                    >
                                        <User size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>Mijozni tahrirlash</span>
                                        <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>
                                            {customer.name}
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
                                        {sectionHeader(<User size={16} />, 'Asosiy ma’lumotlar')}

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
                                                    onChange={(e) => setField('phone', e.target.value)}
                                                    placeholder="+998901234567"
                                                    type="tel"
                                                    minH="52px"
                                                />
                                                <Field.HelperText color={subtitleColor}>Format: +998 va 9 raqam</Field.HelperText>
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

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuMapPin size={16} /><span>Viloyat</span></HStack>
                                                </Field.Label>
                                                <FormControl
                                                    as="select"
                                                    value={form.regionId}
                                                    onChange={(e) => setField('regionId', e.target.value)}
                                                    minH="52px"
                                                >
                                                    <option value="">Viloyatni tanlang (ixtiyoriy)</option>
                                                    {regions.map((region) => (
                                                        <option key={region.id} value={region.id}>{region.name}</option>
                                                    ))}
                                                </FormControl>
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

                                            {/* === Balans — Create bilan bir xil ko‘rinish === */}
                                            <Field.Root gridColumn={{ base: 'auto', md: 'span 2' }}>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuWallet size={16} />
                                                        <span>Balans</span>
                                                    </HStack>
                                                </Field.Label>

                                                <HStack gap={3} align="stretch" flexWrap="nowrap" w="full">
                                                    {/* Kredit (+) */}
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
                                                        bg={form.balanceType === 'credit' ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'green.50') : 'transparent'}
                                                        color={form.balanceType === 'credit' ? (isDark ? 'green.200' : 'green.600') : subtitleColor}
                                                        borderRadius="xl"
                                                        transition="all 0.2s"
                                                        _hover={{ bg: form.balanceType === 'credit' ? (isDark ? 'rgba(34, 197, 94, 0.22)' : 'green.100') : (isDark ? 'whiteAlpha.50' : 'gray.50'), borderColor: 'green.400', color: isDark ? 'green.200' : 'green.600' }}
                                                    >
                                                        <HStack gap={2}><LuTrendingUp size={18} /><Box fontWeight="bold" fontSize="sm">+</Box></HStack>
                                                    </Button>

                                                    {/* Qarzdor (−) */}
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
                                                        bg={form.balanceType === 'debt' ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'red.50') : 'transparent'}
                                                        color={form.balanceType === 'debt' ? (isDark ? 'red.200' : 'red.600') : subtitleColor}
                                                        borderRadius="xl"
                                                        transition="all 0.2s"
                                                        _hover={{ bg: form.balanceType === 'debt' ? (isDark ? 'rgba(239, 68, 68, 0.22)' : 'red.100') : (isDark ? 'whiteAlpha.50' : 'gray.50'), borderColor: 'red.400', color: isDark ? 'red.200' : 'red.600' }}
                                                    >
                                                        <HStack gap={2}><LuTrendingDown size={18} /><Box fontWeight="bold" fontSize="sm">−</Box></HStack>
                                                    </Button>

                                                    {/* Summa + so'm */}
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
                                                            _focus={{ borderColor: form.balanceType === 'debt' ? 'red.400' : 'green.400' }}
                                                        />
                                                        <Box position="absolute" right="16px" top="50%" transform="translateY(-50%)" fontSize="sm" fontWeight="medium" color={subtitleColor} pointerEvents="none" userSelect="none">
                                                            so‘m
                                                        </Box>
                                                    </Box>
                                                </HStack>

                                                <Field.HelperText color={subtitleColor} mt={2}>
                                                    Hozirgi balans:{' '}
                                                    <Box as="span" fontWeight="bold" color={currentBalance < 0 ? 'red.400' : currentBalance > 0 ? 'green.400' : subtitleColor}>
                                                        {currentBalance < 0 ? '−' : currentBalance > 0 ? '+' : ''}{formatBalanceDisplay(Math.abs(currentBalance))} so‘m
                                                    </Box>
                                                    {balanceChanged && Number.isFinite(nextBalance) && (
                                                        <>
                                                            {' '}→ yangi:{' '}
                                                            <Box as="span" fontWeight="bold" color={nextBalance < 0 ? 'red.400' : nextBalance > 0 ? 'green.400' : subtitleColor}>
                                                                {nextBalance < 0 ? '−' : nextBalance > 0 ? '+' : ''}{formatBalanceDisplay(Math.abs(nextBalance))} so‘m
                                                            </Box>
                                                            {' '}(to‘g‘ridan-to‘g‘ri almashtiriladi, kassaga yozilmaydi)
                                                        </>
                                                    )}
                                                </Field.HelperText>
                                            </Field.Root>
                                        </SimpleGrid>
                                    </Box>

                                    {/* === Agent va Telegram === */}
                                    <Box>
                                        {sectionHeader(<LuUserCheck size={16} />, 'Agent va Telegram')}

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
                                        {sectionHeader(<LuStickyNote size={16} />, 'Izoh')}

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

                                    <Text fontSize="sm" color={subtitleColor}>
                                        Saqlashda barcha maydonlar to‘liq almashtiriladi.
                                    </Text>
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
                                    disabled={isLoading || detailLoading}
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

Edit.propTypes = {
    customer: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        phone: PropTypes.string.isRequired,
        summary: PropTypes.string,
        address: PropTypes.string,
        inn: PropTypes.string,
        agentName: PropTypes.string,
        agent: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, phone: PropTypes.string }),
        region: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), name: PropTypes.string }),
        telegramChatId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
    openOnMount: PropTypes.bool,
    hideTrigger: PropTypes.bool,
    onClosed: PropTypes.func,
};