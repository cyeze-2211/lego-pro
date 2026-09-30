import { useEffect, useState, useRef } from 'react';
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
    Image,
} from '@chakra-ui/react';
import { Check, Tag, X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { LuPen } from 'react-icons/lu';
import { 
    useUpdateBrandMutation, 
    useUploadBrandLogoMutation, 
    useDeleteBrandLogoMutation 
} from '../../../../store/services/brand.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import $api from '../../../../store/api';

export default function Edit({ brand }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState(brand.name || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
    const fileInputRef = useRef(null);
    
    const [updateBrand, { isLoading }] = useUpdateBrandMutation();
    const [uploadLogo, { isLoading: isUploading }] = useUploadBrandLogoMutation();
    const [deleteLogo, { isLoading: isDeleting }] = useDeleteBrandLogoMutation();
    
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';

    // Load current logo via axios (with token)
    useEffect(() => {
        if (!open || !brand.logoUrl) {
            setCurrentLogoUrl(null);
            return;
        }

        let mounted = true;
        
        $api.get(brand.logoUrl.replace('/api/v1', ''), { responseType: 'blob' })
            .then((response) => {
                if (mounted) {
                    const url = URL.createObjectURL(response.data);
                    setCurrentLogoUrl(url);
                }
            })
            .catch((err) => {
                console.error('Failed to load current logo:', err);
            });

        return () => {
            mounted = false;
            if (currentLogoUrl) URL.revokeObjectURL(currentLogoUrl);
        };
    }, [open, brand.logoUrl, brand.id]);

    // Modal ochilganda formani brand ma'lumotlari bilan sinxronlash
    useEffect(() => {
        if (open) {
            setName(brand.name || '');
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    }, [open, brand]);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // File type check
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            Alert('Faqat PNG, JPEG yoki WEBP formatdagi rasmlar', 'error');
            return;
        }

        // File size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            Alert('Fayl hajmi 5 MB dan oshmasligi kerak', 'error');
            return;
        }

        setSelectedFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUploadLogo = async () => {
        if (!selectedFile) return;

        try {
            await uploadLogo({ id: brand.id, file: selectedFile }).unwrap();
            Alert('Logo yuklandi', 'success');
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            Alert(error?.data?.message || 'Logo yuklanmadi', 'error');
            throw error;
        }
    };

    const handleDeleteLogo = async () => {
        try {
            await deleteLogo(brand.id).unwrap();
            Alert('Logo o\'chirildi', 'success');
        } catch (error) {
            Alert(error?.data?.message || 'Logo o\'chirilmadi', 'error');
        }
    };

    const handleSubmit = async () => {
        if (isLoading || isUploading) return;

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
            // 1. Update name if changed
            if (trimmed !== brand.name) {
                await updateBrand({
                    id: brand.id,
                    data: { name: trimmed },
                }).unwrap();
            }

            // 2. Upload logo if selected
            if (selectedFile) {
                await handleUploadLogo();
            }

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
                            maxW="520px"
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
                                        borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'}
                                        borderWidth="1px"
                                        color={accentColor}
                                    >
                                        <Tag size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>Brendni tahrirlash</span>
                                        <Box fontSize="sm" fontWeight="normal" color={subtitleColor}>
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

                            <Dialog.Body py={6} px={6}>
                                <VStack gap={5} align="stretch" w="full">
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
                                            disabled={isLoading || isUploading}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSubmit();
                                            }}
                                        />
                                        <Field.HelperText color={subtitleColor}>
                                            Maksimal 255 belgi
                                        </Field.HelperText>
                                    </Field.Root>

                                    {/* Logo section */}
                                    <Field.Root w="full">
                                        <Field.Label color={textColor} fontWeight="medium">
                                            <HStack gap={2}>
                                                <ImageIcon size={16} />
                                                <span>Logo</span>
                                            </HStack>
                                        </Field.Label>
                                        
                                        <VStack gap={3} align="stretch" w="full">
                                            {/* Current or preview logo */}
                                            <Box
                                                w="full"
                                                borderWidth="1px"
                                                borderColor={cardBorder}
                                                borderRadius="xl"
                                                p={8}
                                                bg={isDark ? 'rgba(148,163,184,0.06)' : 'gray.50'}
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                minH="240px"
                                            >
                                                {previewUrl ? (
                                                    <Image src={previewUrl} alt="Preview" maxH="200px" maxW="100%" objectFit="contain" />
                                                ) : currentLogoUrl ? (
                                                    <img 
                                                        src={currentLogoUrl} 
                                                        alt="Current logo" 
                                                        style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <Box color={subtitleColor} textAlign="center">
                                                        <ImageIcon size={56} />
                                                        <Text fontSize="sm" mt={3}>Logo yuklanmagan</Text>
                                                    </Box>
                                                )}
                                            </Box>

                                            {/* Upload button */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={handleFileSelect}
                                                style={{ display: 'none' }}
                                            />
                                            
                                            <HStack gap={2}>
                                                <Button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    variant="outline"
                                                    size="sm"
                                                    flex="1"
                                                    disabled={isLoading || isUploading || isDeleting}
                                                >
                                                    <HStack gap={2}>
                                                        <Upload size={16} />
                                                        <span>{selectedFile ? 'Boshqa rasm' : 'Yuklash'}</span>
                                                    </HStack>
                                                </Button>
                                                
                                                {(currentLogoUrl || previewUrl) && (
                                                    <Button
                                                        onClick={previewUrl ? () => { setSelectedFile(null); setPreviewUrl(null); } : handleDeleteLogo}
                                                        variant="outline"
                                                        size="sm"
                                                        colorPalette="red"
                                                        disabled={isLoading || isUploading || isDeleting}
                                                    >
                                                        {isDeleting ? <Spinner size="sm" /> : <Trash2 size={16} />}
                                                    </Button>
                                                )}
                                            </HStack>

                                            {selectedFile && (
                                                <Text fontSize="xs" color={subtitleColor}>
                                                    Tanlangan: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                                </Text>
                                            )}
                                        </VStack>
                                        
                                        <Field.HelperText color={subtitleColor}>
                                            PNG, JPEG yoki WEBP, maksimal 5 MB
                                        </Field.HelperText>
                                    </Field.Root>
                                </VStack>
                            </Dialog.Body>

                            <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
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
                                    disabled={isLoading || isUploading}
                                >
                                    Bekor qilish
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading || isUploading || !name.trim()}
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
                                    {isLoading || isUploading ? (
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
        logoUrl: PropTypes.string,
    }).isRequired,
};
