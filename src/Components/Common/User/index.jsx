import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box, Button, Dialog, Field, HStack, Heading,
    Portal, Table, Text, VStack, useDisclosure,
} from '@chakra-ui/react';
import {
    LuPlus, LuSearch, LuTrash2, LuUserRound, LuX,
    LuShieldCheck, LuCrown, LuCalculator, LuShoppingCart,
    LuTruck, LuWarehouse, LuHeadset, LuClipboardList,
    LuBriefcase, LuUserCog, LuUsers,
    LuFactory, LuBlend, LuReceipt, LuCoins,
} from 'react-icons/lu';
import { useGetUsersQuery, useRegisterUserMutation, useDeleteUserMutation } from '../../../store/services/user.api';
import { useGetDevicesQuery } from '../../../store/services/device.api';
import { useGetRolesQuery } from '../../../store/services/role.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import FormControl from '../../ui/FormControl';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

/* ─── Rol nomlarini o'zbek (lotin) tiliga o'girish ─────────── */
const ROLE_LABELS = {
    /* Admin / boshqaruv */
    ADMIN:                    { uz: 'Administrator',          Icon: LuShieldCheck,   color: 'red' },
    SUPERADMIN:               { uz: 'Bosh administrator',     Icon: LuCrown,         color: 'red' },
    DIRECTOR:                 { uz: 'Direktor',               Icon: LuBriefcase,     color: 'purple' },
    MANAGER:                  { uz: 'Menejer',                Icon: LuUserCog,       color: 'blue' },
    USER:                     { uz: 'Foydalanuvchi',          Icon: LuUsers,         color: 'gray' },

    /* Savdo / kassa */
    KASSIR:                   { uz: 'Kassir',                 Icon: LuCoins,         color: 'green' },
    CASHIER:                  { uz: 'Kassir',                 Icon: LuCoins,         color: 'green' },
    SELLER:                   { uz: 'Sotuvchi',               Icon: LuShoppingCart,  color: 'teal' },
    OPERATOR:                 { uz: 'Operator',               Icon: LuHeadset,       color: 'cyan' },
    ZAYAVKACHI:               { uz: 'Zayavkachi',             Icon: LuClipboardList, color: 'orange' },

    /* Ombor / ishlab chiqarish */
    WAREHOUSE:                { uz: 'Omborchi',               Icon: LuWarehouse,     color: 'yellow' },
    RAW_MATERIAL_STOREKEEPER: { uz: 'Omborchi',               Icon: LuWarehouse,     color: 'yellow' },
    PRODUCT_STOREKEEPER:      { uz: 'Omborchi',               Icon: LuWarehouse,     color: 'yellow' },
    STANOKCHI:                { uz: 'Stanokchi',              Icon: LuFactory,       color: 'indigo' },
    MIKSERCHI:                { uz: 'Mikserchi',              Icon: LuBlend,         color: 'fuchsia' },

    /* Moliya / hisob */
    ACCOUNTANT:               { uz: 'Buxgalter',              Icon: LuCalculator,    color: 'purple' },
    BUXGALTER:                { uz: 'Hisobchi',               Icon: LuReceipt,       color: 'violet' },

    /* Logistika */
    COURIER:                  { uz: 'Kuryer',                 Icon: LuTruck,         color: 'pink' },
};

const ROLE_COLORS = {
    red:     { bg: 'rgba(239,68,68,.12)',   fg: '#ef4444', border: 'rgba(239,68,68,.3)' },
    orange:  { bg: 'rgba(249,115,22,.12)',  fg: '#f97316', border: 'rgba(249,115,22,.3)' },
    amber:   { bg: 'rgba(245,158,11,.14)',  fg: '#d97706', border: 'rgba(245,158,11,.3)' },
    yellow:  { bg: 'rgba(234,179,8,.14)',   fg: '#ca8a04', border: 'rgba(234,179,8,.3)' },
    lime:    { bg: 'rgba(132,204,22,.14)',  fg: '#65a30d', border: 'rgba(132,204,22,.3)' },
    green:   { bg: 'rgba(34,197,94,.12)',   fg: '#16a34a', border: 'rgba(34,197,94,.3)' },
    teal:    { bg: 'rgba(20,184,166,.12)',  fg: '#0d9488', border: 'rgba(20,184,166,.3)' },
    cyan:    { bg: 'rgba(6,182,212,.12)',   fg: '#0891b2', border: 'rgba(6,182,212,.3)' },
    blue:    { bg: 'rgba(59,130,246,.12)',  fg: '#2563eb', border: 'rgba(59,130,246,.3)' },
    indigo:  { bg: 'rgba(99,102,241,.12)',  fg: '#4f46e5', border: 'rgba(99,102,241,.3)' },
    violet:  { bg: 'rgba(139,92,246,.12)',  fg: '#7c3aed', border: 'rgba(139,92,246,.3)' },
    purple:  { bg: 'rgba(168,85,247,.12)',  fg: '#9333ea', border: 'rgba(168,85,247,.3)' },
    fuchsia: { bg: 'rgba(217,70,239,.12)',  fg: '#c026d3', border: 'rgba(217,70,239,.3)' },
    pink:    { bg: 'rgba(236,72,153,.12)',  fg: '#db2777', border: 'rgba(236,72,153,.3)' },
    gray:    { bg: 'rgba(148,163,184,.14)', fg: '#64748b', border: 'rgba(148,163,184,.35)' },
};

const normalizeRoleKey = (role) => {
    if (!role) return 'USER';
    return String(role).toUpperCase().replace(/[\s-]/g, '_');
};

const getRoleMeta = (roleName) => {
    const key = normalizeRoleKey(roleName);
    return ROLE_LABELS[key] || {
        uz: roleName || 'Foydalanuvchi',
        Icon: LuUserRound,
        color: 'gray',
    };
};

/* ─── Chiroyli rol badge ───────────────────────────────────── */
function RoleBadge({ roleName, isDark }) {
    const meta = getRoleMeta(roleName);
    const { Icon } = meta;
    const palette = ROLE_COLORS[meta.color] || ROLE_COLORS.gray;

    return (
        <HStack
            gap={2}
            px={2.5}
            py={1}
            borderRadius="full"
            borderWidth="1px"
            borderColor={palette.border}
            bg={isDark
                ? palette.bg.replace(/\.\d+\)/, '.18)')
                : palette.bg}
            w="fit-content"
            title={roleName}
        >
            <Box color={palette.fg} display="flex" alignItems="center">
                <Icon size={14} />
            </Box>
            <Text
                fontSize="xs"
                fontWeight="bold"
                color={palette.fg}
                letterSpacing="wide"
                whiteSpace="nowrap"
            >
                {meta.uz}
            </Text>
        </HStack>
    );
}

/* ─── Create user dialog ───────────────────────────────────── */
function CreateUser({ devices, onDone }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState({ username: '', code: '', roleId: '', deviceId: '' });
    const [register, { isLoading }] = useRegisterUserMutation();
    const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    const assignableRoles = useMemo(() => {
        const warehouseRole = roles.find((role) => normalizeRoleKey(role.roleName) === 'PRODUCT_STOREKEEPER')
            || roles.find((role) => normalizeRoleKey(role.roleName) === 'RAW_MATERIAL_STOREKEEPER');
        return [
            ...roles.filter((role) => !['PRODUCT_STOREKEEPER', 'RAW_MATERIAL_STOREKEEPER'].includes(normalizeRoleKey(role.roleName))),
            ...(warehouseRole ? [warehouseRole] : []),
        ];
    }, [roles]);

    useEffect(() => {
        if (assignableRoles.length > 0 && !form.roleId) {
            setForm((prev) => ({ ...prev, roleId: String(assignableRoles[0].id) }));
        }
    }, [assignableRoles, form.roleId]);

    const submit = async () => {
        if (!form.username.trim() || !/^\d{6}$/.test(form.code) || !form.deviceId || !form.roleId) {
            return Alert('Login, 6 xonali PIN, rol va qurilma majburiy', 'error');
        }
        try {
            await register({ ...form, username: form.username.trim(), roleId: Number(form.roleId) }).unwrap();
            Alert('Foydalanuvchi yaratildi', 'success');
            onClose();
            onDone();
            setForm({ username: '', code: '', roleId: assignableRoles[0] ? String(assignableRoles[0].id) : '', deviceId: '' });
        } catch (error) {
            Alert(error?.data?.message || 'Foydalanuvchi yaratishda xatolik', 'error');
        }
    };

    const selectedRole = assignableRoles.find((r) => String(r.id) === String(form.roleId));
    const selectedMeta = selectedRole ? getRoleMeta(selectedRole.roleName) : null;

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
                                            {rolesLoading
                                                ? <option value="">Yuklanmoqda...</option>
                                                : assignableRoles.map((r) => {
                                                    const meta = getRoleMeta(r.roleName);
                                                    return (
                                                        <option key={r.id} value={r.id}>
                                                            {meta.uz}
                                                        </option>
                                                    );
                                                })
                                            }
                                        </FormControl>
                                        {selectedMeta && (
                                            <Box mt={2}>
                                                <RoleBadge roleName={selectedRole?.roleName} isDark={isDark} />
                                            </Box>
                                        )}
                                    </Field.Root>

                                    <Field.Root required>
                                        <Field.Label color={textColor}>Qurilma</Field.Label>
                                        <FormControl as="select" value={form.deviceId} onChange={update('deviceId')}>
                                            <option value="">Qurilmani tanlang</option>
                                            {devices.map((d) => (
                                                <option key={d.id} value={d.id}>{d.deviceName}</option>
                                            ))}
                                        </FormControl>
                                    </Field.Root>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={cardBorder}>
                                <Button variant="ghost" onClick={onClose} color={subtitleColor}>Bekor qilish</Button>
                                <Button onClick={submit} disabled={isLoading}
                                    bg={accentColor} color="black" borderRadius="xl" px={8}>
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

/* ─── Users page ───────────────────────────────────────────── */
export default function User() {
    const [search, setSearch]             = useState('');
    const [query, setQuery]               = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    const { data: result, isLoading, error, refetch } = useGetUsersQuery({ username: query || undefined, page: 0, size: 100 });
    const { data: devicesResult }  = useGetDevicesQuery({ page: 0, size: 100 });
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const users   = result?.items        ?? [];
    const devices = devicesResult?.items ?? [];
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Foydalanuvchilarni yuklashda xatolik', 'error');
    }, [error]);

    const remove = async () => {
        try {
            await deleteUser(selectedUser.id).unwrap();
            Alert("Foydalanuvchi o'chirildi", 'success');
            setSelectedUser(null);
            refetch();
        } catch (err) {
            Alert(err?.data?.message || "Foydalanuvchini o'chirishda xatolik", 'error');
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
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <RoleBadge roleName={user.roleName} isDark={isDark} />
                                    </Table.Cell>
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