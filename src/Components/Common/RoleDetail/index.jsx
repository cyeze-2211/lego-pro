import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Badge, Box, Button, Dialog, Field, HStack, Heading,
    Portal, Spinner, Text, VStack, useDisclosure,
} from '@chakra-ui/react';
import {
    LuCalendar, LuCheck, LuLock, LuPencil, LuSave,
    LuShieldAlert, LuShieldCheck, LuX,
} from 'react-icons/lu';
import {
    useGetRoleByIdQuery,
    useUpdateRoleMutation,
    useUpdateRolePermissionsMutation,
    useGetPermissionCatalogQuery,
} from '../../../store/services/role.api';
import { useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import EntityDetail, { DetailRow, DetailSection, formatDetailDate } from '../EntityDetail';

/* ─── Edit Role Info Modal ─────────────────────────────────── */
function EditRoleInfoModal({ role, open, onClose, onDone }) {
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
        if (!trimmedName) return Alert('Rol nomi majburiy', 'error');

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
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
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
                                <span>Rol ma&apos;lumotlarini tahrirlash</span>
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

/* ─── Role Detail Component ────────────────────────────────── */
export default function RoleDetail() {
    const { id } = useParams();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const { open: editOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

    const { data: role, isLoading, isError, refetch } = useGetRoleByIdQuery(id, { skip: !id });
    const { data: modules = [], isLoading: catalogLoading } = useGetPermissionCatalogQuery();
    const [updatePermissions, { isLoading: isSavingPerms }] = useUpdateRolePermissionsMutation();

    const [selectedPerms, setSelectedPerms] = useState([]);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (role?.permissionIds) {
            setSelectedPerms(role.permissionIds);
            setIsDirty(false);
        }
    }, [role]);

    const togglePermission = (permId) => {
        setSelectedPerms((prev) => {
            const exists = prev.includes(permId);
            const next = exists ? prev.filter((p) => p !== permId) : [...prev, permId];
            setIsDirty(true);
            return next;
        });
    };

    const toggleModule = (permissions) => {
        const modIds = permissions.map((p) => p.id);
        const allSelected = modIds.every((mId) => selectedPerms.includes(mId));
        setSelectedPerms((prev) => {
            const next = allSelected
                ? prev.filter((p) => !modIds.includes(p))
                : Array.from(new Set([...prev, ...modIds]));
            setIsDirty(true);
            return next;
        });
    };

    const handleSavePermissions = async () => {
        try {
            await updatePermissions({
                id: Number(id),
                permissionIds: selectedPerms,
            }).unwrap();
            Alert('Rol huquqlari muvaffaqiyatli saqlandi', 'success');
            setIsDirty(false);
            refetch();
        } catch (error) {
            Alert(error?.data?.message || 'Huquqlarni saqlashda xatolik', 'error');
        }
    };

    return (
        <EntityDetail
            title={role?.roleName || 'Rol'}
            icon={LuShieldCheck}
            backTo="/roles"
            backLabel="Rollar"
            loading={isLoading}
            error={isError || !role}
            single={true}
        >
            {() => (
                <VStack gap={6} align="stretch" w="100%">
                    {/* Role Basic Info Section */}
                    <DetailSection title="Rol ma'lumotlari" icon={LuShieldCheck}>
                        <HStack justify="space-between" align="start" flexWrap="wrap">
                            <Box flex="1" minW="260px">
                                <DetailRow label="Rol nomi" value={role.roleName} emphasize />
                                <DetailRow label="Izoh" value={role.description || '—'} />
                                <DetailRow
                                    label="Turi"
                                    value={
                                        role.system ? (
                                            <Badge colorPalette="purple" variant="subtle" px={3} py={1} borderRadius="full">
                                                <HStack gap={1}><LuLock size={12} /><span>Tizim roli</span></HStack>
                                            </Badge>
                                        ) : (
                                            <Badge colorPalette="gray" variant="outline" px={3} py={1} borderRadius="full">
                                                Maxsus rol
                                            </Badge>
                                        )
                                    }
                                />
                                <DetailRow
                                    label="Biriktirilgan huquqlar"
                                    value={
                                        <Badge colorPalette="yellow" variant="subtle" px={3} py={1} borderRadius="full">
                                            {selectedPerms.length} ta faol huquq
                                        </Badge>
                                    }
                                />
                            </Box>
                            <Box>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    borderRadius="xl"
                                    onClick={onEditOpen}
                                >
                                    <HStack gap={2}>
                                        <LuPencil size={15} />
                                        <span>Tahrirlash</span>
                                    </HStack>
                                </Button>
                            </Box>
                        </HStack>

                        <Box pt={3} borderTopWidth="1px" borderColor={cardBorder}>
                            <HStack justify="space-between" flexWrap="wrap" gap={4}>
                                <HStack gap={2} color={subtitleColor} fontSize="xs">
                                    <LuCalendar size={14} />
                                    <span>Yaratilgan: {formatDetailDate(role.createdAt)}</span>
                                </HStack>
                                {role.lastModifiedAt && (
                                    <HStack gap={2} color={subtitleColor} fontSize="xs">
                                        <LuCalendar size={14} />
                                        <span>Yangilangan: {formatDetailDate(role.lastModifiedAt)}</span>
                                    </HStack>
                                )}
                            </HStack>
                        </Box>
                    </DetailSection>

                    {/* Permissions Management Section */}
                    <Box
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={cardBorder}
                        borderRadius="2xl"
                        p={{ base: 4, md: 6 }}
                        boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'}
                    >
                        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4} mb={5}>
                            <HStack gap={3}>
                                <Box p={2.5} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}>
                                    <LuShieldAlert size={20} />
                                </Box>
                                <Box>
                                    <Heading size="md" color={textColor}>Huquqlar (Permissions) boshqaruvi</Heading>
                                    <Text fontSize="xs" color={subtitleColor}>
                                        Ushbu roldagi barcha foydalanuvchilar uchun ruxsatlarni belgilang
                                    </Text>
                                </Box>
                            </HStack>

                            <Button
                                bg={accentColor}
                                color="black"
                                borderRadius="xl"
                                px={6}
                                fontWeight="semibold"
                                onClick={handleSavePermissions}
                                disabled={isSavingPerms || !isDirty}
                            >
                                {isSavingPerms ? (
                                    <HStack gap={2}>
                                        <Spinner size="sm" />
                                        <span>Saqlanmoqda...</span>
                                    </HStack>
                                ) : (
                                    <HStack gap={2}>
                                        <LuSave size={16} />
                                        <span>{isDirty ? "O'zgarishlarni saqlash" : 'Saqlangan'}</span>
                                    </HStack>
                                )}
                            </Button>
                        </HStack>

                        {catalogLoading ? (
                            <Box py={8} textAlign="center">
                                <Spinner size="lg" color={accentColor} />
                                <Text mt={2} color={subtitleColor}>Katalog yuklanmoqda...</Text>
                            </Box>
                        ) : (
                            <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4}>
                                {modules.map((mod) => {
                                    const modSelected = mod.permissions.filter((p) => selectedPerms.includes(p.id)).length;
                                    const isAllModSelected = modSelected === mod.permissions.length && mod.permissions.length > 0;

                                    return (
                                        <Box
                                            key={mod.code}
                                            borderWidth="1px"
                                            borderColor={cardBorder}
                                            borderRadius="xl"
                                            p={4}
                                            bg={isDark ? 'rgba(255,255,255,0.02)' : 'gray.50'}
                                        >
                                            <HStack justify="space-between" mb={3} pb={2} borderBottomWidth="1px" borderColor={cardBorder}>
                                                <HStack gap={2}>
                                                    <Text fontWeight="bold" fontSize="md" color={textColor}>
                                                        {mod.label}
                                                    </Text>
                                                    <Badge size="sm" variant="subtle">
                                                        {mod.code}
                                                    </Badge>
                                                    <Text fontSize="xs" color={subtitleColor}>
                                                        ({modSelected}/{mod.permissions.length})
                                                    </Text>
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

                                            <VStack gap={2} align="stretch">
                                                {mod.permissions.map((perm) => {
                                                    const checked = selectedPerms.includes(perm.id);
                                                    return (
                                                        <HStack
                                                            key={perm.id}
                                                            as="label"
                                                            cursor="pointer"
                                                            p={2.5}
                                                            borderRadius="lg"
                                                            bg={checked ? (isDark ? 'rgba(250,204,21,0.12)' : '#FEF3C7') : 'transparent'}
                                                            borderWidth="1px"
                                                            borderColor={checked ? accentColor : 'transparent'}
                                                            _hover={{ bg: isDark ? 'rgba(255,255,255,0.05)' : 'gray.100' }}
                                                            onClick={() => togglePermission(perm.id)}
                                                            alignItems="flex-start"
                                                            transition="all 0.15s"
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
                                                            <Box minW={0} flex="1">
                                                                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                                                                    {perm.label}
                                                                </Text>
                                                                <Text fontSize="11px" color={subtitleColor} fontFamily="mono">
                                                                    {perm.code}
                                                                </Text>
                                                            </Box>
                                                        </HStack>
                                                    );
                                                })}
                                            </VStack>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>

                    {/* Edit Modal */}
                    <EditRoleInfoModal
                        role={role}
                        open={editOpen}
                        onClose={onEditClose}
                        onDone={refetch}
                    />
                </VStack>
            )}
        </EntityDetail>
    );
}
