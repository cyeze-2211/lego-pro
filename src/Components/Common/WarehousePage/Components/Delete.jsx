// Components/Delete.jsx
import PropTypes from 'prop-types';
import {
    Button,
    Dialog,
    useDisclosure,
    Spinner,
    HStack,
    Box,
    Text,
    VStack,
    Portal,
} from '@chakra-ui/react';
import { LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import { useDeleteWarehouseMutation } from '../../../../store/services/warehouse.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { Trash, X } from 'lucide-react';

export default function Delete({ id, name }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [deleteWarehouse, { isLoading }] = useDeleteWarehouseMutation();
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();

    const handleDelete = async () => {
        if (isLoading) return;

        try {
            await deleteWarehouse(id).unwrap();
            Alert('Ombor muvaffaqiyatli o‘chirildi', 'success');
            onClose();
        } catch (err) {
            Alert(err?.data?.message || 'Omborni o‘chirishda xatolik', 'error');
        }
    };

    return (
        <>
            <Button
                onClick={onOpen}
                variant="ghost"
                size="sm"
                color={isDark ? 'red.300' : 'red.600'}
                _hover={{
                    bg: isDark ? 'rgba(239, 68, 68, 0.16)' : 'red.50',
                    color: isDark ? 'red.200' : 'red.700',
                }}
                borderRadius="xl"
                px={3}
            >
                <HStack gap={2}>
                    <Trash size={16} />
                </HStack>
            </Button>

            <Dialog.Root open={open} onOpenChange={(event) => event.open ? onOpen() : onClose()} size="md" placement="center">
                <Portal>
                    <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                    <Dialog.Positioner>
                        <Dialog.Content
                            bg={cardBg}
                            borderColor={cardBorder}
                            borderWidth="1px"
                            borderRadius="2xl"
                            boxShadow="2xl"
                            overflow="hidden"
                            maxW="440px"
                            w="calc(100% - 32px)"
                        >
                            <Box
                                position="absolute"
                                top="0"
                                left="0"
                                right="0"
                                height="4px"
                                bgGradient="linear(to-r, red.500, red.300)"
                            />

                            <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={cardBorder}>
                                <HStack spacing={3}>
                                    <Box
                                        p={2}
                                        borderRadius="xl"
                                        bg={isDark ? 'rgba(239, 68, 68, 0.15)' : 'red.50'}
                                        color="red.500"
                                    >
                                        <LuTrash2 size={28} />
                                    </Box>
                                    <span>Omborni o‘chirish</span>
                                </HStack>
                            </Dialog.Header>
                            <Dialog.CloseTrigger asChild>
                                <Button
                                    variant="ghost"
                                    color={subtitleColor}
                                    size="sm"
                                    position="absolute"
                                    top="3"
                                    right="3"
                                    aria-label="Yopish"
                                >
                                    <X />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6}>
                                <VStack gap={5} align="stretch">
                                    <Box
                                        p={4}
                                        borderRadius="xl"
                                        bg={isDark ? 'rgba(239, 68, 68, 0.08)' : 'red.50'}
                                        border="1px solid"
                                        borderColor={isDark ? 'rgba(239, 68, 68, 0.2)' : 'red.200'}
                                    >
                                        <HStack spacing={3}>
                                            <LuTriangleAlert size={20} color={isDark ? '#f87171' : '#dc2626'} />
                                            <Text fontSize="sm" color={isDark ? 'red.300' : 'red.700'}>
                                                Siz <strong>“{name}”</strong> omborini o‘chirmoqchisiz. Bu amalni qaytarib bo‘lmaydi.
                                            </Text>
                                        </HStack>
                                    </Box>
                                    <Text fontSize="sm" color={subtitleColor} pl={1}>
                                        Ombor o‘chirilganda, u ro‘yxatlarda ko‘rinmaydi. Ammo kirim/chiqim tarixi saqlanib qoladi.
                                    </Text>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={cardBorder}>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    color={subtitleColor}
                                    _hover={{
                                        bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100',
                                        color: textColor,
                                    }}
                                    size="lg"
                                    borderRadius="xl"
                                    px={6}
                                >
                                    Bekor qilish
                                </Button>
                                <Button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    bg="red.500"
                                    color="white"
                                    _hover={{
                                        bg: isDark ? 'red.400' : 'red.600',
                                        transform: 'scale(1.02)',
                                        boxShadow: 'lg',
                                    }}
                                    _active={{ transform: 'scale(0.98)' }}
                                    transition="all 0.2s"
                                    size="lg"
                                    borderRadius="xl"
                                    px={8}
                                    fontWeight="semibold"
                                >
                                    {isLoading ? (
                                        <HStack gap={2}>
                                            <Spinner size="sm" color="white" />
                                            <span>O‘chirilmoqda...</span>
                                        </HStack>
                                    ) : (
                                        <HStack gap={2}>
                                            <LuTrash2 size={20} />
                                            <span>O‘chirish</span>
                                        </HStack>
                                    )}
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </>
    );
}

Delete.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
};
