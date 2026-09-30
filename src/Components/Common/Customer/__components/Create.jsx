import { useState } from 'react';
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
} from 'react-icons/lu';
import { useCreateCustomerMutation } from '../../../../store/services/customer.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormattedNumberInput from '../../../ui/FormattedNumberInput';
import FormControl from '../../../ui/FormControl';

const PHONE_REGEX = /^\+998\d{9}$/;

const initialForm = {
    name: '',
    phone: '+998',
    summary: '',
    balance: '0',
    address: '',
    inn: '',
    agentName: '',
    telegramChatId: '',
};

export default function Create() {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(initialForm);
    const [createCustomer, { isLoading }] = useCreateCustomerMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const reset = () => setForm(initialForm);

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!form.name.trim()) {
            Alert('Mijoz nomi majburiy', 'error');
            return;
        }
        if (!PHONE_REGEX.test(form.phone.trim())) {
            Alert('Telefon formati: +998XXXXXXXXX (9 raqam)', 'error');
            return;
        }
        if (form.balance === '' || Number.isNaN(Number(form.balance))) {
            Alert('Boshlang‘ich qoldiqni kiriting (masalan, 0)', 'error');
            return;
        }

        try {
            await createCustomer({
                name: form.name.trim(),
                phone: form.phone.trim(),
                summary: form.summary.trim() || null,
                balance: Number(form.balance),
                address: form.address.trim() || null,
                inn: form.inn.trim() || null,
                agentName: form.agentName.trim() || null,
                telegramChatId: form.telegramChatId.trim() || null,
            }).unwrap();

            Alert('Mijoz muvaffaqiyatli yaratildi', 'success');
            onClose();
            reset();
        } catch (error) {
            Alert(error?.data?.message || 'Mijoz yaratishda xatolik', 'error');
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
                <HStack gap={2}><LuPlus size={20} /><span>Mijoz qo‘shish</span></HStack>
            </Button>

            <Dialog.Root
                open={open}
                onOpenChange={(event) => (event.open ? onOpen() : onClose())}
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
                                                    <HStack gap={2}><LuUserCheck size={16} /><span>Agent ismi</span></HStack>
                                                </Field.Label>
                                                <FormControl
                                                    value={form.agentName}
                                                    onChange={(e) => setField('agentName', e.target.value)}
                                                    placeholder="Masalan, Anvar Tursunov"
                                                    minH="52px"
                                                />
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