import { useEffect, useMemo, useState } from 'react';
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
import { LuSearch, LuUserCheck, LuUsers } from 'react-icons/lu';
import { useAssignMachineCategoryOperatorsMutation } from '../../../../store/services/machineCategory.api';
import { useGetRolesQuery } from '../../../../store/services/role.api';
import { useGetUsersQuery } from '../../../../store/services/user.api';
import { useAppTheme } from '../../../../theme/tokens';
import { Alert } from '../../../Other/UI/Alert/Alert';
import FormControl from '../../../ui/FormControl';
import { operatorId, operatorLabel } from '../operatorLabel';

const normalizeRoleKey = (role) => String(role || '').toUpperCase().replace(/[\s-]/g, '_');

/**
 * Kategoriyaga stanokchilarni biriktirish (faqat MANAGER).
 * PUT /machine-categories/{id}/operators { userIds } — ro'yxatni to'liq almashtiradi.
 */
export default function Operators({ category }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [selected, setSelected] = useState(() => new Set());
    const [search, setSearch] = useState('');
    const [assign, { isLoading }] = useAssignMachineCategoryOperatorsMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    // Faqat STANOKCHI rolidagi foydalanuvchilar biriktiriladi — rol id sini rollar ro'yxatidan topamiz
    const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery(undefined, { skip: !open });
    const stanokchiRoleId = useMemo(
        () => roles.find((role) => normalizeRoleKey(role.roleName) === 'STANOKCHI')?.id,
        [roles],
    );
    const { data: userResult, isLoading: usersLoading, isError: usersError } = useGetUsersQuery(
        { roleId: stanokchiRoleId, page: 0, size: 200, sort: ['username,ASC'] },
        { skip: !open || !stanokchiRoleId },
    );
    const users = useMemo(() => userResult?.items ?? [], [userResult]);

    useEffect(() => {
        if (open) {
            setSelected(new Set((category.operators ?? []).map(operatorId).filter(Boolean)));
            setSearch('');
        }
    }, [open, category]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((user) => operatorLabel(user).toLowerCase().includes(q));
    }, [users, search]);

    const handleSubmit = async () => {
        if (isLoading) return;
        try {
            await assign({ id: category.id, userIds: Array.from(selected) }).unwrap();
            Alert('Stanokchilar ro‘yxati yangilandi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Stanokchilarni biriktirishda xatolik', 'error');
        }
    };

    const close = () => {
        if (!isLoading) onClose();
    };

    const loading = rolesLoading || usersLoading;
    const assignedCount = category.operators?.length ?? 0;

    return (
        <>
            <Button onClick={onOpen} variant="ghost" size="sm" color={isDark ? 'teal.300' : 'teal.600'} borderRadius="xl" px={3} aria-label="Stanokchilar" title="Stanokchilarni biriktirish" _hover={{ bg: isDark ? 'rgba(20, 184, 166, 0.16)' : 'teal.50', color: isDark ? 'teal.200' : 'teal.700' }}>
                <HStack gap={1.5}><LuUserCheck size={16} /><Text as="span" fontSize="xs" fontWeight="bold">{assignedCount}</Text></HStack>
            </Button>
            <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : close())} size="md" placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="560px" w="calc(100% - 32px)">
                            <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl" bg={isDark ? 'rgb(var(--accent-400) / 0.1)' : 'rgb(var(--accent-50))'} borderColor={isDark ? 'rgb(var(--accent-400) / 0.2)' : 'rgb(var(--accent-warm-200))'} borderWidth="1px" color={accentColor}><LuUsers size={24} /></Box>
                                    <Box>
                                        <Text>Stanokchilar</Text>
                                        <Text fontSize="sm" fontWeight="normal" color={subtitleColor}>{category.name}</Text>
                                    </Box>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild><Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish" disabled={isLoading}><X /></Button></Dialog.CloseTrigger>
                            <Dialog.Body py={5}>
                                <VStack gap={4} align="stretch">
                                    <Box position="relative">
                                        <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor} zIndex={1} pointerEvents="none"><LuSearch size={16} /></Box>
                                        <FormControl value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Stanokchini qidiring..." pl={10} minH="40px" disabled={loading} />
                                    </Box>

                                    {loading ? (
                                        <HStack justify="center" py={6}><Spinner size="sm" color={accentColor} /><Text fontSize="sm" color={subtitleColor}>Stanokchilar yuklanmoqda...</Text></HStack>
                                    ) : usersError ? (
                                        <Text fontSize="sm" color={isDark ? 'red.300' : 'red.600'} textAlign="center" py={4}>Foydalanuvchilarni yuklashda xatolik</Text>
                                    ) : !stanokchiRoleId ? (
                                        <Text fontSize="sm" color={subtitleColor} textAlign="center" py={4}>STANOKCHI roli topilmadi</Text>
                                    ) : filteredUsers.length === 0 ? (
                                        <Text fontSize="sm" color={subtitleColor} textAlign="center" py={4}>{search ? 'Qidiruv bo‘yicha stanokchi topilmadi' : 'STANOKCHI rolidagi foydalanuvchilar yo‘q'}</Text>
                                    ) : (
                                        <VStack align="stretch" gap={1} maxH="320px" overflowY="auto" pr={1}>
                                            {filteredUsers.map((user) => {
                                                const checked = selected.has(user.id);
                                                return (
                                                    <HStack
                                                        key={user.id}
                                                        as="label"
                                                        gap={3}
                                                        px={3}
                                                        py={2.5}
                                                        borderRadius="xl"
                                                        borderWidth="1px"
                                                        cursor="pointer"
                                                        borderColor={checked ? accentColor : (isDark ? 'whiteAlpha.100' : '#E2E8F0')}
                                                        bg={checked ? (isDark ? 'rgb(var(--accent-400) / 0.1)' : 'rgb(var(--accent-warm-50))') : 'transparent'}
                                                        _hover={{ bg: isDark ? 'whiteAlpha.50' : 'gray.50' }}
                                                    >
                                                        <input type="checkbox" checked={checked} onChange={() => toggle(user.id)} disabled={isLoading} style={{ width: 16, height: 16, accentColor: '#EAB308' }} />
                                                        <Text fontWeight={checked ? 'semibold' : 'normal'} color={textColor} fontSize="sm">{operatorLabel(user)}</Text>
                                                    </HStack>
                                                );
                                            })}
                                        </VStack>
                                    )}

                                    <Text fontSize="xs" color={subtitleColor}>Tanlangan: <strong>{selected.size}</strong> ta. Saqlashda ro‘yxat to‘liq almashtiriladi. Bitta stanokchi bir nechta kategoriyada bo‘lishi mumkin.</Text>
                                </VStack>
                            </Dialog.Body>
                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                                <Button variant="ghost" onClick={close} color={subtitleColor} borderWidth="1px" borderStyle="solid" borderColor={isDark ? 'transparent' : '#CBD5E1'} _hover={{ bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100', color: textColor }} size="lg" px={6} borderRadius="xl" disabled={isLoading}>Bekor qilish</Button>
                                <Button onClick={handleSubmit} disabled={isLoading || loading} bg={accentColor} color="black" size="lg" borderRadius="xl" px={8} fontWeight="semibold" _hover={{ bg: 'yellow.500', transform: 'scale(1.02)', boxShadow: 'lg' }} _active={{ transform: 'scale(0.98)' }}>
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

Operators.propTypes = {
    category: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        operators: PropTypes.arrayOf(PropTypes.shape({
            userId: PropTypes.string,
            id: PropTypes.string,
            username: PropTypes.string,
        })),
    }).isRequired,
};
