import { useEffect, useState } from 'react';
import { Box, Button, Dialog, Field, HStack, Heading, Portal, Table, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { LuMonitorCog, LuPlus, LuTrash2, LuX } from 'react-icons/lu';
import { useDeleteDeviceMutation, useGetDevicesQuery, useRegisterDeviceMutation } from '../../../store/services/device.api';
import { BRAND_COLORS, useAppTheme } from '../../../theme/tokens';
import { Alert } from '../../Other/UI/Alert/Alert';
import Loading from '../../Other/UI/Loadings/Loading';
import FormControl from '../../ui/FormControl';
import DeleteConfirmDialog from '../DeleteConfirmDialog';

function CreateDevice({ onDone }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState({ deviceName: '', password: '', deviceSummary: '' });
    const [register, { isLoading }] = useRegisterDeviceMutation();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
    const submit = async () => { if (!form.deviceName.trim() || !form.password) return Alert('Qurilma nomi va paroli majburiy', 'error'); try { await register({ ...form, deviceName: form.deviceName.trim() }).unwrap(); Alert('Qurilma yaratildi', 'success'); onClose(); onDone(); setForm({ deviceName: '', password: '', deviceSummary: '' }); } catch (error) { Alert(error?.data?.message || 'Qurilma yaratishda xatolik', 'error'); } };
    return <>
        <Button onClick={onOpen} bg={accentColor} color="black" borderRadius="xl" fontWeight="semibold" px={4}><HStack gap={2}><LuPlus /><span>Qurilma qo‘shish</span></HStack></Button>
        <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : onClose())}><Portal><Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} /><Dialog.Positioner><Dialog.Content bg={cardBg} borderColor={cardBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" w="calc(100% - 32px)" maxW="520px"><Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} /><Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={cardBorder}><HStack gap={3}><Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><LuMonitorCog size={24} /></Box><span>Yangi qurilma</span></HStack></Dialog.Header><Dialog.CloseTrigger asChild><Button variant="ghost" color={subtitleColor} position="absolute" right="3" top="3" onClick={onClose}><LuX /></Button></Dialog.CloseTrigger><Dialog.Body py={6}><VStack gap={5} align="stretch"><Field.Root required><Field.Label color={textColor}>Qurilma nomi</Field.Label><FormControl value={form.deviceName} onChange={update('deviceName')} placeholder="cashbox-01" /></Field.Root><Field.Root required><Field.Label color={textColor}>Boshlang‘ich parol</Field.Label><FormControl type="password" value={form.password} onChange={update('password')} placeholder="ChangeMe123!" /></Field.Root><Field.Root><Field.Label color={textColor}>Izoh</Field.Label><FormControl as="textarea" rows={3} value={form.deviceSummary} onChange={update('deviceSummary')} placeholder="Savdo zali kassasi" /></Field.Root></VStack></Dialog.Body><Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={cardBorder}><Button variant="ghost" onClick={onClose} color={subtitleColor}>Bekor qilish</Button><Button onClick={submit} disabled={isLoading} bg={accentColor} color="black" borderRadius="xl" px={8}>Saqlash</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
    </>;
}

export default function Device() {
    const [selectedDevice, setSelectedDevice] = useState(null);
    const { data: result, isLoading, error, refetch } = useGetDevicesQuery({ page: 0, size: 100 });
    const [deleteDevice, { isLoading: isDeleting }] = useDeleteDeviceMutation();
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const devices = result?.items || [];
    const tableBg = isDark ? BRAND_COLORS.darkCardBg : cardBg;
    useEffect(() => { if (error) Alert(error?.data?.message || 'Qurilmalarni yuklashda xatolik', 'error'); }, [error]);
    const remove = async () => { try { await deleteDevice(selectedDevice.id).unwrap(); Alert('Qurilma o‘chirildi', 'success'); setSelectedDevice(null); refetch(); } catch (err) { Alert(err?.data?.message || 'Qurilmani o‘chirishda xatolik', 'error'); } };
    return <Box my={2} bg={pageBg} color={textColor} minH="100%"><HStack justify="space-between" flexWrap="wrap" gap={4} mb={4}><Heading className="text-[35px] font-semibold">Qurilmalar</Heading><CreateDevice onDone={refetch} /></HStack>{isLoading ? <Loading /> : <Box overflowX="auto" bg={tableBg} borderWidth="1px" borderColor={cardBorder} borderRadius="xl" boxShadow={isDark ? '0 16px 40px rgba(0,0,0,.22)' : '0 8px 24px rgba(15,23,42,.1)'}><Table.Root size="md" interactive bg={tableBg} borderCollapse="collapse"><Table.Header bg={isDark ? 'rgba(148,163,184,.08)' : '#F8FAFC'}><Table.Row bg={isDark ? 'rgba(148,163,184,.08)' : '#F8FAFC'}>{['Qurilma nomi', 'Izoh', 'Amallar'].map((label) => <Table.ColumnHeader key={label} color={subtitleColor} bg={isDark ? 'rgba(148,163,184,.08)' : '#F8FAFC'} borderWidth="1px" borderColor={cardBorder}>{label}</Table.ColumnHeader>)}</Table.Row></Table.Header><Table.Body bg={tableBg}>{devices.map((device) => <Table.Row key={device.id} bg={tableBg} _hover={{ bg: isDark ? 'rgba(250,204,21,.06)' : '#FFFBEB' }}><Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}><HStack gap={3}><Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250,204,21,.12)' : '#FEF3C7'} color={accentColor}><LuMonitorCog /></Box><Text fontWeight="semibold">{device.deviceName}</Text></HStack></Table.Cell><Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder} color={subtitleColor}>{device.deviceSummary || '—'}</Table.Cell><Table.Cell bg={tableBg} borderWidth="1px" borderColor={cardBorder}><Button variant="ghost" color="red.500" onClick={() => setSelectedDevice(device)} aria-label="O‘chirish"><LuTrash2 /></Button></Table.Cell></Table.Row>)}</Table.Body></Table.Root>{devices.length === 0 && <Text p={8} textAlign="center" color={subtitleColor}>Qurilmalar topilmadi</Text>}</Box>}<DeleteConfirmDialog open={Boolean(selectedDevice)} onClose={() => setSelectedDevice(null)} onConfirm={remove} isLoading={isDeleting} title="Qurilmani o‘chirish" itemName={selectedDevice?.deviceName} /></Box>;
}
