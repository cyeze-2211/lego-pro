import { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Portal,
    Spinner,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, User, X } from 'lucide-react';
import { LuDollarSign, LuPhone, LuPlus, LuStickyNote } from 'react-icons/lu';
import { useCreateCustomerMutation } from '../../../../store/services/customer.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormattedNumberInput from '../../../ui/FormattedNumberInput';
import FormControl from '../../../ui/FormControl';

const PHONE_REGEX = /^\+998\d{9}$/;

export default function Create() {
    const { open, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('+998');
    const [summary, setSummary] = useState('');
    const [balance, setBalance] = useState('0');
    const [createCustomer, { isLoading }] = useCreateCustomerMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const reset = () => {
        setName('');
        setPhone('+998');
        setSummary('');
        setBalance('0');
    };

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!name.trim()) {
            Alert('Mijoz nomi majburiy', 'error');
            return;
        }
        if (!PHONE_REGEX.test(phone.trim())) {
            Alert('Telefon formati: +998XXXXXXXXX (9 raqam)', 'error');
            return;
        }
        if (balance === '' || Number.isNaN(Number(balance))) {
            Alert('Boshlang‘ich qoldiqni kiriting (masalan, 0)', 'error');
            return;
        }
        try {
            await createCustomer({
                name: name.trim(),
                phone: phone.trim(),
                summary: summary.trim() || null,
                balance: Number(balance),
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

            <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : onClose())} size="md" placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="520px" w="calc(100% - 32px)">
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#FEFCE8'} borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'} borderWidth="1px" color={accentColor}>
                                        <User size={24} />
                                    </Box>
                                    <span>Yangi mijoz</span>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><X /></Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6}>
                                <VStack gap={6} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><User size={16} /><span>Mijoz nomi</span></HStack><Field.RequiredIndicator /></Field.Label>
                                        <FormControl value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan, Akmal Karimov" autoFocus size="lg" minH="52px" />
                                    </Field.Root>
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuPhone size={16} /><span>Telefon</span></HStack><Field.RequiredIndicator /></Field.Label>
                                        <FormControl value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+998901234567" type="tel" minH="52px" />
                                        <Field.HelperText color={subtitleColor}>Format: +998 va 9 raqam.</Field.HelperText>
                                    </Field.Root>
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuDollarSign size={16} /><span>Boshlang‘ich qoldiq (so‘m)</span></HStack><Field.RequiredIndicator /></Field.Label>
                                        <FormattedNumberInput value={balance} onChange={setBalance} placeholder="0" minH="52px" />
                                        <Field.HelperText color={subtitleColor}>Musbat — mijoz qarzdor, manfiy — kreditda.</Field.HelperText>
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label color={textColor} fontWeight="medium"><HStack gap={2}><LuStickyNote size={16} /><span>Izoh (ixtiyoriy)</span></HStack></Field.Label>
                                        <FormControl as="textarea" rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Masalan, Do‘kon: Chorsu bozori" minH="90px" resize="vertical" />
                                    </Field.Root>
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
