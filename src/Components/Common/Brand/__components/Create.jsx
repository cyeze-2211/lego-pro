import { useCallback, useRef, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Image,
    Portal,
    Spinner,
    Text,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, Tag, X, Upload, ImageIcon, Trash2 } from 'lucide-react';
import { LuPlus } from 'react-icons/lu';
import {
    useCreateBrandMutation,
    useUploadBrandLogoMutation,
} from '../../../../store/services/brand.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function Create({ onCreated }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
    const [uploadLogo, { isLoading: uploading }] = useUploadBrandLogoMutation();
    const isLoading = creating || uploading;

    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    const reset = () => {
        setName('');
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (isLoading) return;
        onClose();
        reset();
    };

    const acceptFile = useCallback(
        (picked) => {
            if (!picked) return;

            if (!ALLOWED_TYPES.includes(picked.type)) {
                Alert('Faqat PNG, JPEG yoki WEBP formatdagi rasm', 'error');
                return;
            }
            if (picked.size > MAX_SIZE) {
                Alert('Fayl hajmi 5 MB dan oshmasligi kerak', 'error');
                return;
            }

            if (preview) URL.revokeObjectURL(preview);
            setFile(picked);
            setPreview(URL.createObjectURL(picked));
        },
        [preview],
    );

    const handleFilePick = (event) => {
        const picked = event.target.files?.[0];
        acceptFile(picked);
        event.target.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const picked = event.dataTransfer.files?.[0];
        acceptFile(picked);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const removeFile = () => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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

        try {
            // 1) Brendni yaratish
            const created = await createBrand({ name: trimmed }).unwrap();

            // 2) Logotip tanlangan bo'lsa — yuklash
            if (file && created?.id) {
                try {
                    await uploadLogo({ id: created.id, file }).unwrap();
                    Alert('Brend va logotip muvaffaqiyatli yaratildi', 'success');
                } catch (logoErr) {
                    Alert(
                        logoErr?.data?.message ||
                            'Brend yaratildi, lekin logotip yuklanmadi',
                        'warning',
                    );
                }
            } else {
                Alert('Brend muvaffaqiyatli yaratildi', 'success');
            }

            onCreated?.(created);
            handleClose();
        } catch (error) {
            Alert(error?.data?.message || 'Brend yaratishda xatolik', 'error');
        }
    };

    return (
        <>
            <Button
                onClick={onOpen}
                bg={accentColor}
                color="black"
                borderRadius="xl"
                fontWeight="semibold"
                px={4}
                py={4}
                boxShadow="md"
                _hover={{
                    bg: isDark ? 'yellow.300' : 'yellow.500',
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg',
                }}
                transition="all 0.2s"
            >
                <HStack gap={2}>
                    <LuPlus size={20} />
                    <span>Brend qo‘shish</span>
                </HStack>
            </Button>

            <Dialog.Root
                open={open}
                onOpenChange={(event) => (event.open ? onOpen() : handleClose())}
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
                            maxW="540px"
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
                                        <span>Yangi brend</span>
                                        <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>
                                            Nom va ixtiyoriy logotip
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
                                    onClick={handleClose}
                                    disabled={isLoading}
                                >
                                    <X />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6} px={6}>
                                <VStack gap={6} align="stretch" w="full">
                                    {/* Brend nomi */}
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

                                    {/* Logotip yuklash */}
                                    <Field.Root w="full">
                                        <Field.Label color={textColor} fontWeight="medium">
                                            <HStack gap={2}>
                                                <ImageIcon size={16} />
                                                <span>Logotip</span>
                                            </HStack>
                                            <Text
                                                as="span"
                                                color={subtitleColor}
                                                fontWeight="normal"
                                                fontSize="xs"
                                                ml={1}
                                            >
                                                (ixtiyoriy)
                                            </Text>
                                        </Field.Label>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleFilePick}
                                            style={{ display: 'none' }}
                                        />

                                        {preview ? (
                                            /* Tanlangan fayl ko'rinishi */
                                            <Box
                                                borderWidth="1px"
                                                borderColor={modalBorder}
                                                borderRadius="2xl"
                                                bg={isDark ? 'rgba(148,163,184,0.05)' : 'gray.50'}
                                                p={4}
                                            >
                                                <HStack gap={4} align="center">
                                                    <Box
                                                        w="120px"
                                                        h="120px"
                                                        borderRadius="xl"
                                                        overflow="hidden"
                                                        bg="white"
                                                        borderWidth="1px"
                                                        borderColor={modalBorder}
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        flexShrink={0}
                                                        boxShadow="sm"
                                                    >
                                                        <Image
                                                            src={preview}
                                                            alt="Logotip"
                                                            objectFit="contain"
                                                            w="100%"
                                                            h="100%"
                                                        />
                                                    </Box>

                                                    <VStack align="start" gap={1} flex="1" minW={0}>
                                                        <Text
                                                            fontSize="sm"
                                                            color={textColor}
                                                            fontWeight="semibold"
                                                            w="100%"
                                                            style={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {file?.name}
                                                        </Text>
                                                        <HStack gap={2}>
                                                            <Text fontSize="xs" color={subtitleColor}>
                                                                {file ? (file.size / 1024).toFixed(1) : 0} KB
                                                            </Text>
                                                            <Text fontSize="xs" color={subtitleColor}>
                                                                •
                                                            </Text>
                                                            <Text
                                                                fontSize="xs"
                                                                color={isDark ? 'green.300' : 'green.600'}
                                                                fontWeight="medium"
                                                            >
                                                                Tayyor
                                                            </Text>
                                                        </HStack>
                                                    </VStack>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        color={isDark ? 'red.300' : 'red.600'}
                                                        onClick={removeFile}
                                                        disabled={isLoading}
                                                        borderRadius="lg"
                                                        px={2}
                                                        aria-label="Faylni olib tashlash"
                                                        _hover={{
                                                            bg: isDark
                                                                ? 'rgba(239,68,68,0.15)'
                                                                : 'red.50',
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </HStack>
                                            </Box>
                                        ) : (
                                            /* Dropzone */
                                            <Box
                                                onDrop={handleDrop}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onClick={() =>
                                                    !isLoading && fileInputRef.current?.click()
                                                }
                                                cursor={isLoading ? 'not-allowed' : 'pointer'}
                                                borderWidth="2px"
                                                borderStyle="dashed"
                                                borderColor={
                                                    isDragging
                                                        ? accentColor
                                                        : isDark
                                                        ? 'whiteAlpha.300'
                                                        : 'gray.300'
                                                }
                                                borderRadius="2xl"
                                                bg={
                                                    isDragging
                                                        ? isDark
                                                            ? 'rgba(250,204,21,0.08)'
                                                            : '#FEFCE8'
                                                        : isDark
                                                        ? 'rgba(148,163,184,0.04)'
                                                        : 'gray.50'
                                                }
                                                py={8}
                                                px={6}
                                                transition="all 0.2s"
                                                _hover={{
                                                    borderColor: accentColor,
                                                    bg: isDark
                                                        ? 'rgba(250,204,21,0.05)'
                                                        : '#FEFCE8',
                                                }}
                                                textAlign="center"
                                            >
                                                <VStack gap={2}>
                                                    <Box
                                                        p={4}
                                                        borderRadius="full"
                                                        bg={
                                                            isDragging
                                                                ? isDark
                                                                    ? 'rgba(250,204,21,0.2)'
                                                                    : '#FEF3C7'
                                                                : isDark
                                                                ? 'rgba(148,163,184,0.12)'
                                                                : 'white'
                                                        }
                                                        color={
                                                            isDragging ? accentColor : subtitleColor
                                                        }
                                                        borderWidth="1px"
                                                        borderColor={
                                                            isDragging
                                                                ? accentColor
                                                                : isDark
                                                                ? 'whiteAlpha.200'
                                                                : 'gray.200'
                                                        }
                                                        transition="all 0.2s"
                                                    >
                                                        <Upload size={28} />
                                                    </Box>
                                                    <VStack gap={0.5}>
                                                        <Text
                                                            fontSize="sm"
                                                            fontWeight="semibold"
                                                            color={
                                                                isDragging ? accentColor : textColor
                                                            }
                                                        >
                                                            {isDragging
                                                                ? 'Rasmni bu yerga tashlang'
                                                                : 'Rasm yuklash uchun bosing'}
                                                        </Text>
                                                        <Text fontSize="xs" color={subtitleColor}>
                                                            yoki faylni bu yerga sudrab tashlang
                                                        </Text>
                                                    </VStack>
                                                    <HStack
                                                        gap={2}
                                                        fontSize="10px"
                                                        color={subtitleColor}
                                                        pt={1}
                                                        flexWrap="wrap"
                                                        justify="center"
                                                    >
                                                        <Box
                                                            px={1.5}
                                                            py={0.5}
                                                            borderRadius="md"
                                                            bg={
                                                                isDark
                                                                    ? 'whiteAlpha.100'
                                                                    : 'gray.100'
                                                            }
                                                            fontWeight="medium"
                                                        >
                                                            PNG
                                                        </Box>
                                                        <Box
                                                            px={1.5}
                                                            py={0.5}
                                                            borderRadius="md"
                                                            bg={
                                                                isDark
                                                                    ? 'whiteAlpha.100'
                                                                    : 'gray.100'
                                                            }
                                                            fontWeight="medium"
                                                        >
                                                            JPG
                                                        </Box>
                                                        <Box
                                                            px={1.5}
                                                            py={0.5}
                                                            borderRadius="md"
                                                            bg={
                                                                isDark
                                                                    ? 'whiteAlpha.100'
                                                                    : 'gray.100'
                                                            }
                                                            fontWeight="medium"
                                                        >
                                                            WEBP
                                                        </Box>
                                                        <Text>· maks. 5 MB</Text>
                                                    </HStack>
                                                </VStack>
                                            </Box>
                                        )}
                                    </Field.Root>
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
                                    onClick={handleClose}
                                    color={subtitleColor}
                                    borderWidth="1px"
                                    borderStyle="solid"
                                    borderColor={isDark ? 'transparent' : '#CBD5E1'}
                                    _hover={{
                                        bg: isDark
                                            ? 'rgba(148, 163, 184, 0.16)'
                                            : 'gray.100',
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
                                            <span>
                                                {uploading
                                                    ? 'Logotip yuklanmoqda...'
                                                    : 'Saqlanmoqda...'}
                                            </span>
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