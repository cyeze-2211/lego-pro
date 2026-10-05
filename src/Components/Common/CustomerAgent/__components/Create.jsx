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
import { UserCheck, X } from 'lucide-react';
import { LuPhone, LuPlus, LuSend, LuUserCheck } from 'react-icons/lu';
import { useCreateCustomerAgentMutation } from '../../../../store/services/customerAgent.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

const PHONE_REGEX = /^\+998\d{9}$/;

const EMPTY = { name: '', phone: '+998', telegramId: '' };

export default function Create() {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(EMPTY);
    const [createAgent, { isLoading }] = useCreateCustomerAgentMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

    const handleClose = () => { if (!isLoading) { onClose(); setForm(EMPTY); } };

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!form.name.trim()) { Alert('Agent nomi majburiy', 'error'); return; }
        const phone = form.phone.trim();
        if (!PHONE_REGEX.test(phone)) { Alert('Telefon formati: +998XXXXXXXXX', 'error'); return; }

        try {
            await createAgent({
                name:       form.name.trim(),
                phone,
                telegramId: form.telegramId.trim() || null,
            }).unwrap();
            Alert('Agent muvaffaqiyatli yaratildi', 'success');
            handleClose();
        } catch (err) {
            Alert(err?.data?.message || 'Agent yaratishda xatolik', 'error');
        }
    };

    const sectionHeader = (icon, label) => (
        <HStack gap={2} color={accentColor} fontWeight="semibold" fontSize="sm"
            textTransform="uppercase" letterSpacing="wide" mb={4}>
            {icon}<span>{label}</span>
            <Box flex="1" h="1px" bg={modalBorder} />
        </HStack>
    );

    return (
        <>
            <Button
                onClick={onOpen}
                bg={accentColor} color="black" borderRadius="xl"
                fontWeight="semibold" px={4} py={4} boxShadow="md"
                _hover={{ bg: isDark ? 'yellow.300' : 'yellow.500', transform: 'translateY(-1px)', boxShadow: 'lg' }}
                transition="all 0.2s"
            >
                <HStack gap={2}><LuPlus size={20} /><span>Agent qo'shish</span></HStack>
            </Button>

            <Dialog.Root open={open} onOpenChange={(e) => (e.open ? onOpen() : handleClose())}
                size="xl" placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)"
                        bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content
                            bg={cardBg} borderColor={modalBorder} borderWidth="1px"
                            borderRadius="2xl" boxShadow="2xl" overflow="hidden"
                            maxW="560px" w="calc(100% - 32px)" maxH="92vh"
                        >
                            <Box position="absolute" top="0" left="0" right="0" h="4px"
                                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold"
                                pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl"
                                        bg={isDark ? 'rgba(250,204,21,0.1)' : '#FEFCE8'}
                                        borderColor={isDark ? 'rgba(250,204,21,0.2)' : '#FDE68A'}
                                        borderWidth="1px" color={accentColor}>
                                        <UserCheck size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>Yangi agent</span>
                                        <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>
                                            Agent ma'lumotlarini to'ldiring
                                        </Box>
                                    </VStack>
                                </HStack>
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm"
                                    position="absolute" top="3" right="3"
                                    aria-label="Yopish" onClick={handleClose}>
                                    <X />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6} overflowY="auto">
                                <VStack gap={6} align="stretch">
                                    <Box>
                                        {sectionHeader(<UserCheck size={16} />, 'Asosiy ma\'lumotlar')}
                                        <VStack gap={5} align="stretch">
                                            {/* Ism */}
                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}><LuUserCheck size={16} /><span>Agent ismi</span></HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormControl
                                                    value={form.name}
                                                    onChange={(e) => set('name', e.target.value)}
                                                    placeholder="Masalan, Anvar Tursunov"
                                                    autoFocus minH="52px" disabled={isLoading}
                                                />
                                            </Field.Root>

                                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                                {/* Telefon */}
                                                <Field.Root required>
                                                    <Field.Label color={textColor} fontWeight="medium">
                                                        <HStack gap={2}><LuPhone size={16} /><span>Telefon</span></HStack>
                                                        <Field.RequiredIndicator />
                                                    </Field.Label>
                                                    <FormControl
                                                        value={form.phone}
                                                        onChange={(e) => set('phone', e.target.value)}
                                                        placeholder="+998901234567"
                                                        type="tel" minH="52px" disabled={isLoading}
                                                    />
                                                    <Field.HelperText color={subtitleColor}>
                                                        Format: +998 va 9 raqam
                                                    </Field.HelperText>
                                                </Field.Root>

                                                {/* Telegram ID */}
                                                <Field.Root>
                                                    <Field.Label color={textColor} fontWeight="medium">
                                                        <HStack gap={2}><LuSend size={16} /><span>Telegram ID</span></HStack>
                                                    </Field.Label>
                                                    <FormControl
                                                        value={form.telegramId}
                                                        onChange={(e) => set('telegramId', e.target.value)}
                                                        placeholder="123456789"
                                                        minH="52px" disabled={isLoading}
                                                    />
                                                    <Field.HelperText color={subtitleColor}>
                                                        Ixtiyoriy
                                                    </Field.HelperText>
                                                </Field.Root>
                                            </SimpleGrid>
                                        </VStack>
                                    </Box>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={4} pb={6}
                                borderTopWidth="1px" borderColor={modalBorder}>
                                <Button variant="ghost" onClick={handleClose}
                                    color={subtitleColor} size="lg" borderRadius="xl" px={6}
                                    disabled={isLoading}
                                    _hover={{ bg: isDark ? 'rgba(148,163,184,0.16)' : 'gray.100', color: textColor }}>
                                    Bekor qilish
                                </Button>
                                <Button onClick={handleSubmit} disabled={isLoading}
                                    bg={accentColor} color="black" size="lg" borderRadius="xl"
                                    px={8} fontWeight="semibold"
                                    _hover={{ bg: isDark ? 'yellow.300' : 'yellow.500', transform: 'scale(1.02)' }}
                                    _active={{ transform: 'scale(0.98)' }} transition="all 0.2s">
                                    {isLoading
                                        ? <HStack gap={2}><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack>
                                        : <HStack gap={2}><LuPlus size={18} /><span>Saqlash</span></HStack>
                                    }
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    );
}
