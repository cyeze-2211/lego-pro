import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Portal,
    Spinner,
    Text,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, Tag, X } from 'lucide-react';
import { LuPen } from 'react-icons/lu';
import { useUpdateBrandMutation } from '../../../../store/services/brand.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

export default function Edit({ brand }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState(brand.name || '');
    const [updateBrand, { isLoading }] = useUpdateBrandMutation();
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    // Modal ochilganda formani brand ma'lumotlari bilan sinxronlash
    useEffect(() => {
        if (open) setName(brand.name || '');
    }, [open, brand]);

    const handleSubmit = async () => {
        if (isLoading) return;

        const trimmed = name.trim();
        if (!trimmed) {
            Alert('Brend nomi majburiy', 'error');
            return;
        }
        if (trimmed.length > 255) {
            Alert('Brend nomi 255 belgidan oshmasligi kerak', 'error');
            return;
        }
        if (trimmed === brand.name) {
            onClose();
            return;
        }

        try {
            await updateBrand({
                id: brand.id,
                data: { name: trimmed },
            }).unwrap();
            Alert('Brend yangilandi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Brendni yangilashda xatolik', 'error');
        }
    };

    return (
        <>
            <Button
                onClick={onOpen}
                variant="ghost"
                size="sm"
                color={accentColor}
                borderRadius="xl"
                px={3}
                aria-label="Tahrirlash"
                _hover={{
                    bg: isDark ? 'rgba(250, 204, 21, 0.16)' : 'yellow.50',
                    color: isDark ? 'yellow.200' : 'yellow.700',
                }}
            >
                <LuPen size={16} />
            </Button>

            <Dialog.Root
                open={open}
                onOpenChange={(event) => (event.open ? onOpen() : onClose())}
                size="md"
                placement="center"
            >
                <Portal>
                    <Dialog.Backdrop
                        backdropFilter="blur(6px)"
                        bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'}
                    />
                    <Dialog.Positioner>
                        <Dialog.Content
                            bg={cardBg}
                            borderColor={modalBorder}
                            borderWidth="1px"
                            borderRadius="2xl"
                            boxShadow="2xl"
                            overflow="hidden"
                            maxW="480px"
                            w="calc(100% - 32px)"
                        >
                            <Box
                                position="absolute"
                                top="0"
                                left="0"
                                right="0"
                                h="4px"
                                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`}
                            />

                            <Dialog.Header
                                color={textColor}
                                fontSize="2xl"
                                fontWeight="bold"
                                pt={7}
                                pb={5}
                                borderBottomWidth="1px"
                                borderColor={modalBorder}
                            >
                                <HStack gap={3}>
                                    <Box
                                        p={3}
                                        borderRadius="xl"
                                        bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#FEFCE8'}
                                        borderColor={
                                            isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'
                                        }
                                        borderWidth="1px"
                                        color={accentColor}
                                    >
                                        <Tag size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>Brendni tahrirlash</span>
                                        <Box
                                            fontSize="sm"
                                            fontWeight="normal"
                                            color={subtitleColor}
                                        >
                                            {brand.name}
                                        </Box>
                                    </VStack>
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
                                    <Field.Root required>
                                        <Field.Label color={textColor} fontWeight="medium">
                                            <HStack gap={2}>
                                                <Tag size={16} />
                                                <span>Brend nomi</span>
                                            </HStack>
                                            <Field.RequiredIndicator />
                                        </Field.Label>
                                        <FormControl
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder="Masalan, Nike"
                                            autoFocus
                                            size="lg"
                                            minH="52px"
                                            maxLength={255}
                                            disabled={isLoading}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSubmit();
                                            }}
                                        />
                                        <Field.HelperText color={subtitleColor}>
                                            Maksimal 255 belgi
                                        </Field.HelperText>
                                    </Field.Root>

                                    <Text fontSize="sm" color={subtitleColor}>
                                        Logotip bu yerda o‘zgarmaydi — u alohida boshqariladi.
                                    </Text>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer
                                gap={3}
                                pt={5}
                                pb={6}
                                borderTopWidth="1px"
                                borderColor={modalBorder}
                            >
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    color={subtitleColor}
                                    borderWidth="1px"
                                    borderStyle="solid"
                                    borderColor={isDark ? 'transparent' : '#CBD5E1'}
                                    _hover={{
                                        bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100',
                                        color: textColor,
                                    }}
                                    size="lg"
                                    px={6}
                                    borderRadius="xl"
                                    disabled={isLoading}
                                >
                                    Bekor qilish
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !name.trim()}
                                    bg={accentColor}
                                    color="black"
                                    size="lg"
                                    borderRadius="xl"
                                    px={8}
                                    fontWeight="semibold"
                                    _hover={{
                                        bg: 'yellow.500',
                                        transform: 'scale(1.02)',
                                        boxShadow: 'lg',
                                    }}
                                    _active={{ transform: 'scale(0.98)' }}
                                    _disabled={{
                                        opacity: 0.6,
                                        cursor: 'not-allowed',
                                        transform: 'none',
                                    }}
                                >
                                    {isLoading ? (
                                        <HStack gap={2}>
                                            <Spinner size="sm" color="black" />
                                            <span>Saqlanmoqda...</span>
                                        </HStack>
                                    ) : (
                                        <HStack gap={2}>
                                            <Check size={20} />
                                            <span>Saqlash</span>
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

Edit.propTypes = {
    brand: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
    }).isRequired,
};