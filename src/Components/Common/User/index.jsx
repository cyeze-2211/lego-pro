import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Dialog, Field, HStack, Heading, Portal, Table, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { LuPlus, LuSearch, LuTrash2, LuUserRound, LuX } from 'react-icons/lu';
import { useGetUsersQuery, useRegisterUserMutation, useDeleteUserMutation } from '../../../store/services/user.api';
import { useGetDevicesQuery } from '../../../store/services/device.api';
import { useGetRolesQuery } from '../../../store/services/role.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import FormControl from '../../ui/FormControl';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

function CreateUser({ devices, onDone }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState({ username: '', code: '', roleId: '', deviceId: '' });
    const [register, { isLoading }] = useRegisterUserMutation();
    const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

    // Set default roleId once roles are loaded
    useEffect(() => {
        if (roles.length > 0 && !form.roleId) {
            setForm((prev) => ({ ...prev, roleId: String(roles[0].id) }));
        }
    }, [roles]);

    const submit = async () => {
        if (!form.username.trim() || !/^\d{6}$/.test(form.code) || !form.deviceId || !form.roleId) {
            return Alert('Login, 6 xonali PIN, rol va qurilma majburiy', 'error');
        }
        try {
            await register({ ...form, username: form.username.trim(), roleId: Number(form.roleId) }).unwrap();
            Alert('Foydalanuvchi yaratildi', 'success');
            onClose();
            onDone();
            setForm({ username: '', code: '', roleId: roles[0] ? String(roles[0].id) : '', deviceId: '' });
        } catch (error) {
            Alert(error?.data?.message || 'Foydalanuvchi yaratishda xatolik', 'error');
        }
    };

    return (
        <>
            <Button onClick={onOpen} bg={accentColor} color="black" borderRadius="xl" fontWeight="semibold" px={4}>
                <HStack gap={2}><LuPlus /><span>Foydalanuvchi qo&apos;shish</span></HStack>
            </Button>

            <Dialog.Root open={open} onOpenChange={(e) => (e.open ? onOpen() : onClose())}>
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content
                            bg={cardBg} borderColor={cardBorder} borderWidth="1px"
                            borderRadius="2xl" boxShadow="2xl" overflow="hidden"
                            w="calc(100% - 32px)" maxW="520px"
                        >
                            <Box position="absolute" top="0" left="0" right="0" h="4px"
                                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold"
                                pt={7} pb={5} borderBottomWidth="1px" borderColor={cardBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl"
                                        bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'}
                                        color={accentColor}>
                                        <LuUserRound size={24} />
                                    </Box>
                                    <span>Yangi foydalanuvchi</span>
                                </HStack>
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor}
                                    position="absolute" right="3" top="3" onClick={onClose}>
                                    <LuX />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6}>
                                <VStack gap={5} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor}>Username</Field.Label>
                                        <FormControl value={form.username} onChange={update('username')} placeholder="cashier1" />
                                    </Field.Root>

                                    <Field.Root required>
                                        <Field.Label color={textColor}>6 xonali PIN</Field.Label>
                                        <FormControl
                                            value={form.code}
                                            onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                            inputMode="numeric"
                                            placeholder="123456"
                                        />
                                    </Field.Root>

                                    <Field.Root required>
                                        <Field.Label color={textColor}>Rol</Field.Label>
                                        <FormControl as="select" value={form.roleId} onChange={update('roleId')}>
                                            {rolesLoading ? (
                                                <option value="">Yuklanmoqda...</option>
                                            ) : (
                                                roles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.roleName}
                                                    </option>
                                                ))
                                            )}
                                        </FormControl>
                                    </Field.Root>

                                    <Field.Root required>
                                        <Field.Label color={textColor}>Qurilma</Field.Label>
                                        <FormControl as="select" value={form.deviceId} onChange={update('deviceId')}>
                                            <option value="">Qurilmani tanlang</option>
                                            {devices.map((device) => (
                                                <option key={device.id} value={device.id}>{device.deviceName}</option>
                                            ))}
                                        </FormControl>
                                    </Field.Root>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={cardBorder}>
                                <Button variant="ghost" onClick={onClose} color={subtitleColor}>Bekor qilish</Button>
                                <Button onClick={submit} disabled={isLoading} bg={accentColor} color="black" borderRadius="xl" px={8}>
                                    Saqlash
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    );
}

export default function User() {
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const { data: result, isLoading, error, refetch } = useGetUsersQuery({ username: query || undefined, page: 0, size: 100 });
    const { data: devicesResult } = useGetDevicesQuery({ page: 0, size: 100 });
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const users = result?.items || [];
    const devices = devicesResult?.items || [];
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Foydalanuvchilarni yuklashda xatolik', 'error');
    }, [error]);

    const remove = async () => {
        try {
            await deleteUser(selectedUser.id).unwrap();
            Alert('Foydalanuvchi o\u2018chirildi', 'success');
            setSelectedUser(null);
            refetch();
        } catch (err) {
            Alert(err?.data?.message || 'Foydalanuvchini o\u2018chirishda xatolik', 'error');
        }
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" flexWrap="wrap" gap={4} mb={4}>
                <Heading className="text-[35px] font-semibold">Foydalanuvchilar</Heading>
                <CreateUser devices={devices} onDone={refetch} />
            </HStack>

            <HStack
                as="form"
                onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}
                align={{ base: 'stretch', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                gap={3} mb={4} p={3}
                bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl"
            >
                <Box position="relative" flex="1" w="100%">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor}>
                        <LuSearch />
                    </Box>
                    <FormControl value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Username bo'yicha qidiring..." pl={10} />
                </Box>
                <Button type="submit" bg={accentColor} color="black" borderRadius="xl" px={6}>
                    <HStack gap={2}><LuSearch /><span>Qidirish</span></HStack>
                </Button>
            </HStack>

            {isLoading ? (
                <Loading />
            ) : (
                <Box overflowX="auto" bg={tableBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl"
                    boxShadow={isDark ? '0 16px 40px rgba(0,0,0,.22)' : '0 8px 24px rgba(15,23,42,.1)'}>
                    <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                        <Table.Header bg={isDark ? 'rgba(148,163,184,.08)' : '#F8FAFC'}>
                            <Table.Row>
                                {['Username', 'Rol', 'Qurilma', 'Oxirgi kirish', 'Amallar'].map((label) => (
                                    <Table.ColumnHeader key={label} color={subtitleColor} borderWidth="1px" borderColor={cardBorder}>
                                        {label}
                                    </Table.ColumnHeader>
                                ))}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body bg={tableBg}>
                            {users.map((user) => (
                                <Table.Row key={user.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <HStack gap={3}>
                                            <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}>
                                                <LuUserRound />
                                            </Box>
                                            <Text as={Link} to={`/users/${user.id}`} fontWeight="semibold" color={textColor} _hover={{ color: accentColor }}>
                                                {user.username}
                                            </Text>
                                        </HStack>
                                    </Table.Cell>
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>{user.roleName}</Table.Cell>
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>{user.deviceName || '—'}</Table.Cell>
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder} color={subtitleColor}>
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('uz-UZ') : 'Kirilmagan'}
                                    </Table.Cell>
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <Button variant="ghost" color="red.500" onClick={() => setSelectedUser(user)} aria-label="O'chirish">
                                            <LuTrash2 />
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    {users.length === 0 && (
                        <Text p={8} textAlign="center" color={subtitleColor}>Foydalanuvchilar topilmadi</Text>
                    )}
                </Box>
            )}

            <DeleteConfirmDialog
                open={Boolean(selectedUser)}
                onClose={() => setSelectedUser(null)}
                onConfirm={remove}
                isLoading={isDeleting}
                title="Foydalanuvchini o'chirish"
                itemName={selectedUser?.username}
            />
        </Box>
    );
}
