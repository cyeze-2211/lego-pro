import PropTypes from 'prop-types';
import { Box, Button, Dialog, HStack, Portal, Spinner, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { Trash, X } from 'lucide-react';
import { useDeleteRawMaterialMutation } from '../../../../store/services/raw.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';

export default function Delete({ material }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [deleteRawMaterial, { isLoading }] = useDeleteRawMaterialMutation();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const handleDelete = async () => {
        if (isLoading) return;
        try { await deleteRawMaterial(material.id).unwrap(); Alert('Xom ashyo o‘chirildi', 'success'); onClose(); } catch (error) { Alert(error?.data?.message || 'Xom ashyoni o‘chirishda xatolik', 'error'); }
    };
    return <>
        <Button onClick={onOpen} variant="ghost" size="sm" color={isDark ? 'red.300' : 'red.600'} borderRadius="xl" px={3} aria-label="O‘chirish" _hover={{ bg: isDark ? 'rgba(239,68,68,.16)' : 'red.50' }}><Trash size={16} /></Button>
        <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : onClose())} size="md" placement="center"><Portal><Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} /><Dialog.Positioner><Dialog.Content bg={cardBg} borderColor={isDark ? cardBorder : '#94A3B8'} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden"><Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient="linear(to-r, red.500, red.300)" /><Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={cardBorder}><HStack gap={3}><Box p={3} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.15)' : 'red.50'} color="red.500"><LuTrash2 size={26} /></Box><span>Xom ashyoni o‘chirish</span></HStack></Dialog.Header><Dialog.CloseTrigger asChild><Button variant="ghost" color={subtitleColor} position="absolute" top="3" right="3"><X /></Button></Dialog.CloseTrigger><Dialog.Body py={6}><VStack gap={5} align="stretch"><Box p={4} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.08)' : 'red.50'} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.2)' : 'red.200'}><HStack gap={3} align="start"><LuTriangleAlert color={isDark ? '#f87171' : '#dc2626'} /><Text fontSize="sm" color={isDark ? 'red.300' : 'red.700'}>Siz <strong>“{material.name}”</strong> xom ashyosini o‘chirmoqchisiz.</Text></HStack></Box><Text fontSize="sm" color={subtitleColor}>Bu amalni qaytarib bo‘lmaydi, ammo tarixiy ma’lumotlar saqlanadi.</Text></VStack></Dialog.Body><Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={cardBorder}><Button variant="ghost" onClick={onClose} color={subtitleColor} size="lg" borderRadius="xl">Bekor qilish</Button><Button onClick={handleDelete} disabled={isLoading} bg="red.500" color="white" size="lg" borderRadius="xl" px={8}>{isLoading ? <HStack><Spinner size="sm" /><span>O‘chirilmoqda...</span></HStack> : <HStack><LuTrash2 /><span>O‘chirish</span></HStack>}</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
    </>;
}
Delete.propTypes = { material: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }).isRequired };
