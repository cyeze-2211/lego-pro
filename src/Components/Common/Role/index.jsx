import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Badge, Box, Button, Dialog, Field, HStack, Heading,
    Portal, Table, Text, VStack, useDisclosure,
} from '@chakra-ui/react';
import {
    LuCheck, LuPencil, LuPlus, LuSearch, LuShieldCheck,
    LuTrash2, LuUsers, LuX, LuLock,
} from 'react-icons/lu';
import {
    useGetRolesQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useGetPermissionCatalogQuery,
} from '../../../store/services/role.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import FormControl from '../../ui/FormControl';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

/* ─── Create Role Dialog ───────────────────────────────────── */
function CreateRole({ onDone }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState({ roleName: '', description: '', permissionIds: [] });
    const [createRole, { isLoading }] = useCreateRoleMutation();
    const { data: modules = [], isLoading: catalogLoading } = useGetPermissionCatalogQuery();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    const togglePermission = (id) => {
        setForm((prev) => {
            const exists = prev.permissionIds.includes(id);
            return {
                ...prev,
                permissionIds: exists
                    ? prev.permissionIds.filter((p) => p !== id)
                    : [...prev.permissionIds, id],
            };
        });
    };

    const toggleModule = (permissions) => {
        const moduleIds = permissions.map((p) => p.id);
        const allSelected = moduleIds.every((id) => form.permissionIds.includes(id));
        setForm((prev) => ({
            ...prev,
            permissionIds: allSelected
                ? prev.permissionIds.filter((id) => !moduleIds.includes(id))
                : Array.from(new Set([...prev.permissionIds, ...moduleIds])),
        }));
    };

    const submit = async () => {
        const trimmedName = form.roleName.trim();
        if (!trimmedName) {
            return Alert('Rol nomi majburiy', 'error');
        }
        try {
            await createRole({
                roleName: trimmedName,
                description: form.description.trim() || undefined,
                permissionIds: form.permissionIds.length > 0 ? form.permissionIds : undefined,
            }).unwrap();
            Alert('Yangi rol muvaffaqiyatli yaratildi', 'success');
            onClose();
            onDone();
            setForm({ roleName: '', description: '', permissionIds: [] });
        } catch (error) {
            Alert(error?.data?.message || 'Rol yaratishda xatolik', 'error');
        }
    };

    return (
        <>
            <Button onClick={onOpen} bg={accentColor} color="black" borderRadius="xl" fontWeight="semibold" px={4}>
                <HStack gap={2}><LuPlus /><span>Rol qo&apos;shish</span></HStack>
            </Button>

            <Dialog.Root open={open} onOpenChange={(e) => (e.open ? onOpen() : onClose())}>
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content
                            bg={cardBg} borderColor={cardBorder} borderWidth="1px"
                            borderRadius="2xl" boxShadow="2xl" overflow="hidden"
                            w="calc(100% - 32px)" maxW="700px" maxH="90vh" display="flex" flexDirection="column"
                        >
                            <Box position="absolute" top="0" left="0" right="0" h="4px"
                                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />

                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold"
                                pt={7} pb={5} borderBottomWidth="1px" borderColor={cardBorder}>
                                <HStack gap={3}>
                                    <Box p={3} borderRadius="xl"
                                        bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'}
                                        color={accentColor}>
                                        <LuShieldCheck size={24} />
                                    </Box>
                                    <span>Yangi rol yaratish</span>
                                </HStack>
                            </Dialog.Header>

                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" color={subtitleColor}
                                    position="absolute" right="3" top="3" onClick={onClose}>
                                    <LuX />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6} overflowY="auto" flex="1">
                                <VStack gap={5} align="stretch">
                                    <Field.Root required>
                                        <Field.Label color={textColor}>Rol nomi (unikal)</Field.Label>
                                        <FormControl
                                            value={form.roleName}
                                            onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                                            placeholder="Masalan: AUDITOR, DISPATCHER..."
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label color={textColor}>Izoh (ixtiyoriy)</Field.Label>
                                        <FormControl
                                            as="textarea"
                                            rows={2}
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            placeholder="Rolning tizimdagi vazifasi haqida qisqacha ma'lumot..."
                                        />
                                    </Field.Root>

                                    <Box>
                                        <HStack justify="space-between" mb={2}>
                                            <Text fontWeight="semibold" fontSize="sm" color={textColor}>Huquqlar (Permissions)</Text>
                                            <Text fontSize="xs" color={subtitleColor}>
                                                Tanlangan: {form.permissionIds.length} ta
                                            </Text>
                                        </HStack>

                                        {catalogLoading ? (
                                            <Text color={subtitleColor} fontSize="sm">Katalog yuklanmoqda...</Text>
                                        ) : (
                                            <VStack gap={4} align="stretch">
                                                {modules.map((mod) => {
                                                    const modSelected = mod.permissions.filter((p) => form.permissionIds.includes(p.id)).length;
                                                    const isAllModSelected = modSelected === mod.permissions.length && mod.permissions.length > 0;
                                                    return (
                                                        <Box
                                                            key={mod.code}
                                                            borderWidth="1px"
                                                            borderColor={cardBorder}
                                                            borderRadius="xl"
                                                            p={3}
                                                            bg={isDark ? 'rgba(255,255,255,0.02)' : 'gray.50'}
                                                        >
                                                            <HStack justify="space-between" mb={2} pb={1} borderBottomWidth="1px" borderColor={cardBorder}>
                                                                <HStack gap={2}>
                                                                    <Text fontWeight="bold" fontSize="sm" color={textColor}>
                                                                        {mod.label}
                                                                    </Text>
                                                                    <Badge size="sm" variant="subtle">
                                                                        {mod.code}
                                                                    </Badge>
                                                                </HStack>
                                                                <Button
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    color={accentColor}
                                                                    onClick={() => toggleModule(mod.permissions)}
                                                                >
                                                                    {isAllModSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash'}
                                                                </Button>
                                                            </HStack>

                                                            <Box display="grid" gridTemplateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={2}>
                                                                {mod.permissions.map((perm) => {
                                                                    const checked = form.permissionIds.includes(perm.id);
                                                                    return (
                                                                        <HStack
                                                                            key={perm.id}
                                                                            as="label"
                                                                            cursor="pointer"
                                                                            p={2}
                                                                            borderRadius="lg"
                                                                            bg={checked ? (isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7') : 'transparent'}
                                                                            borderWidth="1px"
                                                                            borderColor={checked ? accentColor : 'transparent'}
                                                                            _hover={{ bg: isDark ? 'rgba(255,255,255,0.04)' : 'gray.100' }}
                                                                            onClick={() => togglePermission(perm.id)}
                                                                            alignItems="flex-start"
                                                                        >
                                                                            <Box
                                                                                mt={0.5}
                                                                                w={4}
                                                                                h={4}
                                                                                borderRadius="sm"
                                                                                borderWidth="1px"
                                                                                borderColor={checked ? accentColor : subtitleColor}
                                                                                bg={checked ? accentColor : 'transparent'}
                                                                                display="flex"
                                                                                alignItems="center"
                                                                                justifyContent="center"
                                                                                color="black"
                                                                                flexShrink={0}
                                                                            >
                                                                                {checked && <LuCheck size={12} strokeWidth={3} />}
                                                                            </Box>
                                                                            <Box minW={0}>
                                                                                <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                                                                                    {perm.label}
                                                                                </Text>
                                                                                <Text fontSize="10px" color={subtitleColor} truncate>
                                                                                    {perm.code}
                                                                                </Text>
                                                                            </Box>
                                                                        </HStack>
                                                                    );
                                                                })}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </VStack>
                                        )}
                                    </Box>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={4} pb={5} borderTopWidth="1px" borderColor={cardBorder}>
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

/* ─── Edit Role Dialog ─────────────────────────────────────── */
function EditRole({ role, onClose, onDone }) {
    const [form, setForm] = useState({
        roleName: role?.roleName || '',
        description: role?.description || '',
    });
    const [updateRole, { isLoading }] = useUpdateRoleMutation();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    useEffect(() => {
        if (role) {
            setForm({
                roleName: role.roleName || '',
                description: role.description || '',
            });
        }
    }, [role]);

    const submit = async () => {
        const trimmedName = form.roleName.trim();
        if (!trimmedName) {
            return Alert('Rol nomi majburiy', 'error');
        }
        try {
            await updateRole({
                id: role.id,
                roleName: trimmedName,
                description: form.description.trim() || undefined,
            }).unwrap();
            Alert("Rol ma'lumotlari yangilandi", 'success');
            onClose();
            onDone();
        } catch (error) {
            Alert(error?.data?.message || 'Rolni yangilashda xatolik', 'error');
        }
    };

    return (
        <Dialog.Root open={Boolean(role)} onOpenChange={(e) => !e.open && onClose()}>
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
                                    <LuPencil size={24} />
                                </Box>
                                <span>Rolni tahrirlash</span>
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
                                    <HStack justify="space-between">
                                        <Field.Label color={textColor}>Rol nomi</Field.Label>
                                        {role?.system && (
                                            <Badge colorPalette="purple" size="sm">Tizim roli (nomi o&apos;zgarmaydi)</Badge>
                                        )}
                                    </HStack>
                                    <FormControl
                                        value={form.roleName}
                                        onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                                        placeholder="Rol nomi..."
                                        disabled={role?.system}
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label color={textColor}>Izoh</Field.Label>
                                    <FormControl
                                        as="textarea"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Rol izohi..."
                                    />
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
    );
}

/* ─── Roles Main Page ───────────────────────────────────────── */
export default function Role() {
    const [search, setSearch] = useState('');
    const [editRole, setEditRole] = useState(null);
    const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);

    const { data: roles = [], isLoading, error, refetch } = useGetRolesQuery();
    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;

    useEffect(() => {
        if (error) Alert(error?.data?.message || 'Rollarni yuklashda xatolik', 'error');
    }, [error]);

    const filteredRoles = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return roles;
        return roles.filter(
            (r) =>
                r.roleName?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q)
        );
    }, [roles, search]);

    const remove = async () => {
        if (!deleteRoleTarget) return;
        try {
            await deleteRole(deleteRoleTarget.id).unwrap();
            Alert("Rol muvaffaqiyatli o'chirildi", 'success');
            setDeleteRoleTarget(null);
            refetch();
        } catch (err) {
            Alert(err?.data?.message || "Rolni o'chirishda xatolik", 'error');
        }
    };

    return (
        <Box my={2} bg={pageBg} color={textColor} minH="100%">
            <HStack justify="space-between" flexWrap="wrap" gap={4} mb={4}>
                <Box>
                    <Heading className="text-[35px] font-semibold">Rollar va Huquqlar</Heading>
                    <Text color={subtitleColor} fontSize="sm">
                        Tizim rollari, foydalanuvchilar va ularga biriktirilgan huquqlar (permissions)
                    </Text>
                </Box>
                <CreateRole onDone={refetch} />
            </HStack>

            <HStack
                align={{ base: 'stretch', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                gap={3} mb={4} p={3}
                bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl"
            >
                <Box position="relative" flex="1" w="100%">
                    <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color={accentColor}>
                        <LuSearch />
                    </Box>
                    <FormControl
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rol nomi yoki izohi bo'yicha qidiring..."
                        pl={10}
                    />
                </Box>
            </HStack>

            {isLoading ? (
                <Loading />
            ) : (
                <Box overflowX="auto" bg={tableBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl"
                    boxShadow={isDark ? '0 16px 40px rgba(0,0,0,.22)' : '0 8px 24px rgba(15,23,42,.1)'}>
                    <Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse">
                        <Table.Header bg={isDark ? 'rgba(148,163,184,.08)' : '#F8FAFC'}>
                            <Table.Row>
                                {['Rol nomi', 'Turi', 'Izoh', 'Huquqlar soni', 'Foydalanuvchilar', 'Amallar'].map((label) => (
                                    <Table.ColumnHeader key={label} color={subtitleColor} borderWidth="1px" borderColor={cardBorder}>
                                        {label}
                                    </Table.ColumnHeader>
                                ))}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body bg={tableBg}>
                            {filteredRoles.map((role) => (
                                <Table.Row key={role.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}>
                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <HStack gap={3}>
                                            <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}>
                                                <LuShieldCheck size={18} />
                                            </Box>
                                            <Text
                                                as={Link}
                                                to={`/roles/${role.id}`}
                                                fontWeight="bold"
                                                color={textColor}
                                                _hover={{ color: accentColor, textDecoration: 'underline' }}
                                            >
                                                {role.roleName}
                                            </Text>
                                        </HStack>
                                    </Table.Cell>

                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        {role.system ? (
                                            <Badge colorPalette="purple" variant="subtle" px={2.5} py={0.5} borderRadius="full">
                                                <HStack gap={1}><LuLock size={12} /><span>Tizim roli</span></HStack>
                                            </Badge>
                                        ) : (
                                            <Badge colorPalette="gray" variant="outline" px={2.5} py={0.5} borderRadius="full">
                                                Maxsus rol
                                            </Badge>
                                        )}
                                    </Table.Cell>

                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder} color={subtitleColor} maxW="260px">
                                        <Text truncate>{role.description || '—'}</Text>
                                    </Table.Cell>

                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <Badge colorPalette="yellow" variant="subtle" px={2.5} py={0.5} borderRadius="full">
                                            {role.permissionCount ?? 0} ta huquq
                                        </Badge>
                                    </Table.Cell>

                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <HStack gap={1.5} color={subtitleColor}>
                                            <LuUsers size={14} />
                                            <Text fontWeight="semibold" color={textColor}>
                                                {role.userCount ?? 0}
                                            </Text>
                                        </HStack>
                                    </Table.Cell>

                                    <Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}>
                                        <HStack gap={2}>
                                            <Button
                                                as={Link}
                                                to={`/roles/${role.id}`}
                                                size="sm"
                                                variant="outline"
                                                color={accentColor}
                                                borderRadius="lg"
                                            >
                                                Batafsil / Huquqlar
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                color={subtitleColor}
                                                _hover={{ color: textColor }}
                                                onClick={() => setEditRole(role)}
                                                aria-label="Tahrirlash"
                                            >
                                                <LuPencil size={16} />
                                            </Button>

                                            {!role.system && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    color="red.500"
                                                    _hover={{ bg: 'red.50', color: 'red.600' }}
                                                    onClick={() => setDeleteRoleTarget(role)}
                                                    aria-label="O'chirish"
                                                >
                                                    <LuTrash2 size={16} />
                                                </Button>
                                            )}
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                    {filteredRoles.length === 0 && (
                        <Text p={8} textAlign="center" color={subtitleColor}>Rollar topilmadi</Text>
                    )}
                </Box>
            )}

            {/* Edit Dialog */}
            {editRole && (
                <EditRole
                    role={editRole}
                    onClose={() => setEditRole(null)}
                    onDone={refetch}
                />
            )}

            {/* Delete Dialog */}
            <DeleteConfirmDialog
                open={Boolean(deleteRoleTarget)}
                onClose={() => setDeleteRoleTarget(null)}
                onConfirm={remove}
                isLoading={isDeleting}
                title="Rolni o'chirish"
                itemName={deleteRoleTarget?.roleName}
                description={
                    deleteRoleTarget?.userCount > 0
                        ? `Diqqat! "${deleteRoleTarget.roleName}" roliga ${deleteRoleTarget.userCount} ta foydalanuvchi biriktirilgan. Biriktirilgan foydalanuvchisi bor rolni o'chirib bo'lmaydi.`
                        : `Siz haqiqatdan ham "${deleteRoleTarget?.roleName}" rolini o'chirmoqchimisiz?`
                }
            />
        </Box>
    );
}
