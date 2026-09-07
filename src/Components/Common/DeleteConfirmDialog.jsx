import { Box, Button, Dialog, HStack, Portal, Spinner, Text } from '@chakra-ui/react';
import { LuTrash2, LuTriangleAlert, LuX } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';

export default function DeleteConfirmDialog({ open, onClose, onConfirm, isLoading, title, itemName, description }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    return <Dialog.Root open={open} onOpenChange={(event) => !event.open && onClose()} size="md" placement="center">
        <Portal>
            <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
            <Dialog.Positioner>
                <Dialog.Content bg={cardBg} borderColor={cardBorder} borderWidth="1px" borderRadius="2xl" boxShadow="2xl" overflow="hidden" maxW="440px" w="calc(100% - 32px)">
                    <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient="linear(to-r, red.500, red.300)" />
                    <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={cardBorder}>
                        <HStack gap={3}><Box p={3} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.15)' : 'red.50'} color="red.500"><LuTrash2 size={24} /></Box><span>{title}</span></HStack>
                    </Dialog.Header>
                    <Dialog.CloseTrigger asChild><Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><LuX /></Button></Dialog.CloseTrigger>
                    <Dialog.Body py={6}>
                        <Box p={4} borderRadius="xl" bg={isDark ? 'rgba(239,68,68,.08)' : 'red.50'} borderWidth="1px" borderColor={isDark ? 'rgba(239,68,68,.2)' : 'red.200'}>
                            <HStack gap={3} align="start"><LuTriangleAlert size={20} color={isDark ? '#f87171' : '#dc2626'} /><Text fontSize="sm" color={isDark ? 'red.300' : 'red.700'}>{description || <>Siz <strong>“{itemName}”</strong> ni o‘chirmoqchisiz.</>}</Text></HStack>
                        </Box>
                    </Dialog.Body>
                    <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={cardBorder}>
                        <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl">Bekor qilish</Button>
                        <Button onClick={onConfirm} disabled={isLoading} bg="red.500" color="white" _hover={{ bg: 'red.600' }} borderRadius="xl" px={7}>{isLoading ? <HStack gap={2}><Spinner size="sm" /><span>O‘chirilmoqda...</span></HStack> : <HStack gap={2}><LuTrash2 size={17} /><span>O‘chirish</span></HStack>}</Button>
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog.Root>;
}
