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
import { UserCheck, X } from 'lucide-react';
import { LuPen, LuPhone, LuSend, LuUserCheck } from 'react-icons/lu';
import { useUpdateCustomerAgentMutation } from '../../../../store/services/customerAgent.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

const PHONE_REGEX = /^\+998\d{9}$/;

const buildInitial = (agent) => ({
    name:       agent.name       || '',
    phone:      agent.phone      || '+998',
    telegramId: agent.telegramId ? String(agent.telegramId) : '',
});

export default function Edit({ agent }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(() => buildInitial(agent));
    const [updateAgent, { isLoading }] = useUpdateCustomerAgentMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    useEffect(() => { if (open) setForm(buildInitial(agent)); }, [open, agent]);

    const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));
    const handleClose = () => { if (!isLoading) onClose(); };

    const handleSubmit = async () => {
        if (isLoading) return;
        if (!form.name.trim()) { Alert('Agent nomi majburiy', 'error'); return; }
        if (!PHONE_REGEX.test(form.phone.trim())) { Alert('Telefon formati: +998XXXXXXXXX', 'error'); return; }

        try {
            await updateAgent({
                id: agent.id,
                data: {
                    name:       form.name.trim(),
                    phone:      form.phone.trim(),
                    telegramId: form.telegramId.trim() || null,
                },
            }).unwrap();
            Alert('Agent yangilandi', 'success');
            onClose();
        } catch (err) {
            Alert(err?.data?.message || 'Agent yangilashda xatolik', 'error');
        }
    };

    return (
        <>
            <Button
                onClick={onOpen} variant="ghost" size="sm"
                color={accentColor} borderRadius="xl" px={3}
                aria-label="Tahrirlash"
                _hover={{ bg: isDark ? 'rgba(250,204,21,0.16)' : 'yellow.50', color: isDark ? 'yellow.200' : 'yellow.700' }}
            >
                <LuPen size={16} />
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
                                        <span>Agentni tahrirlash</span>
                                        <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>
                                            {agent.name}
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
                                            <Field.HelperText color={subtitleColor}>Ixtiyoriy</Field.HelperText>
                                        </Field.Root>
                                    </SimpleGrid>
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
                                        : 'Saqlash'
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

Edit.propTypes = {
    agent: PropTypes.shape({
        id:         PropTypes.string.isRequired,
        name:       PropTypes.string.isRequired,
        phone:      PropTypes.string,
        telegramId: PropTypes.string,
    }).isRequired,
};
