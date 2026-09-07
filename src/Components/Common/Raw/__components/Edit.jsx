import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, VStack, useDisclosure } from '@chakra-ui/react';
import { Check, FileText, Package, X } from 'lucide-react';
import { LuPen, LuTag } from 'react-icons/lu';
import { useUpdateRawMaterialMutation } from '../../../../store/services/raw.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

export default function Edit({ material }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState(material.name);
    const [summary, setSummary] = useState(material.summary || '');
    const [updateRawMaterial, { isLoading }] = useUpdateRawMaterialMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    useEffect(() => { if (open) { setName(material.name); setSummary(material.summary || ''); } }, [open, material]);
    const handleSubmit = async () => {
        if (isLoading) return;
        if (!name.trim()) { Alert('Xom ashyo nomi majburiy', 'error'); return; }
        try { await updateRawMaterial({ id: material.id, data: { name: name.trim(), summary: summary.trim() || undefined } }).unwrap(); Alert('Xom ashyo yangilandi', 'success'); onClose(); } catch (error) { Alert(error?.data?.message || 'Xom ashyoni yangilashda xatolik', 'error'); }
    };
    return <>
        <Button onClick={onOpen} variant="ghost" size="sm" color={accentColor} borderRadius="xl" px={3} aria-label="Tahrirlash" _hover={{ bg: isDark ? 'rgba(250,204,21,.16)' : 'yellow.50' }}><LuPen size={16} /></Button>
        <Dialog.Root open={open} onOpenChange={(event) => (event.open ? onOpen() : onClose())} size="md" placement="center"><Portal><Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} /><Dialog.Positioner><Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="520px" w="calc(100% - 32px)"><Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} /><Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}><HStack gap={3}><Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><Package size={24} /></Box><span>Xom ashyoni tahrirlash</span></HStack></Dialog.Header><Dialog.CloseTrigger asChild><Button variant="ghost" color={subtitleColor} position="absolute" top="3" right="3"><X /></Button></Dialog.CloseTrigger><Dialog.Body py={6}><VStack gap={6} align="stretch"><Field.Root required><Field.Label color={textColor}><HStack gap={2}><LuTag size={16} /><span>Nomi</span></HStack></Field.Label><FormControl value={name} onChange={(event) => setName(event.target.value)} autoFocus minH="52px" /></Field.Root><Field.Root><Field.Label color={textColor}><HStack gap={2}><FileText size={16} /><span>Tavsifi</span></HStack></Field.Label><FormControl as="textarea" value={summary} onChange={(event) => setSummary(event.target.value)} minH="120px" rows={4} /></Field.Root></VStack></Dialog.Body><Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}><Button variant="ghost" onClick={onClose} color={subtitleColor} borderWidth="1px" borderColor={isDark ? 'transparent' : '#CBD5E1'} size="lg" borderRadius="xl">Bekor qilish</Button><Button onClick={handleSubmit} disabled={isLoading} bg={accentColor} color="black" size="lg" borderRadius="xl" px={8}>{isLoading ? <Spinner size="sm" /> : <HStack><Check size={20} /><span>Saqlash</span></HStack>}</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
    </>;
}
Edit.propTypes = { material: PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired, summary: PropTypes.string }).isRequired };
