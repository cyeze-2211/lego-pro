import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Field, HStack, Image, Text, VStack } from '@chakra-ui/react';
import { LuImagePlus, LuRefreshCw, LuTrash2, LuUpload } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import { Alert } from '../../../Other/UI/Alert/Alert';
import ProductImage from '../../../ui/ProductImage';
import { IMAGE_TYPES, validateImageFile } from '../../../ui/auth-image';

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

/**
 * Mahsulot rasmi tanlash maydoni.
 * file — tanlangan yangi fayl (null bo‘lsa o‘zgarmaydi); currentUrl — mavjud rasm (tahrirlashda).
 */
export default function ImageField({ file, onChange, currentUrl, currentVersion, disabled = false }) {
    const { isDark, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (!file) { setPreview(null); return undefined; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const pick = (candidate) => {
        const error = validateImageFile(candidate);
        if (error) { Alert(error, 'error'); return; }
        onChange(candidate);
    };

    const onInput = (event) => {
        const candidate = event.target.files?.[0];
        event.target.value = '';
        if (candidate) pick(candidate);
    };

    const onDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        const candidate = event.dataTransfer?.files?.[0];
        if (candidate) pick(candidate);
    };

    const hasCurrent = Boolean(currentUrl);
    const accentSoft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';

    return (
        <Field.Root>
            <Field.Label color={textColor} fontWeight="medium">
                <HStack gap={2}><LuImagePlus size={16} /><span>Mahsulot rasmi</span></HStack>
                <Text as="span" fontSize="xs" color={subtitleColor} fontWeight="normal" ml={1}>ixtiyoriy</Text>
            </Field.Label>

            <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(',')} hidden onChange={onInput} disabled={disabled} />

            <HStack
                w="100%"
                gap={4}
                align="center"
                p={3}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={dragging ? accentColor : cardBorder}
                borderRadius="xl"
                bg={dragging ? accentSoft : 'transparent'}
                transition="all .15s"
                onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
            >
                <Box w="96px" h="96px" minW="96px" borderRadius="xl" overflow="hidden" bg={isDark ? 'whiteAlpha.100' : 'gray.100'} display="flex" alignItems="center" justifyContent="center">
                    {preview
                        ? <Image src={preview} alt="Tanlangan rasm" w="100%" h="100%" objectFit="cover" />
                        : <ProductImage imageUrl={currentUrl} version={currentVersion} size={96} radius="xl" iconSize={30} />}
                </Box>

                <VStack align="start" gap={2} flex={1} minW={0}>
                    {file ? (
                        <>
                            <Text fontSize="sm" fontWeight="semibold" color={textColor} noOfLines={1}>{file.name}</Text>
                            <Text fontSize="xs" color={subtitleColor}>{formatSize(file.size)} · saqlaganda {hasCurrent ? 'eski rasm almashtiriladi' : 'yuklanadi'}</Text>
                        </>
                    ) : (
                        <>
                            <Text fontSize="sm" fontWeight="semibold" color={textColor}>{hasCurrent ? 'Joriy rasm' : 'Rasm tanlanmagan'}</Text>
                            <Text fontSize="xs" color={subtitleColor}>PNG, JPEG yoki WEBP, 5 MB gacha. Faylni shu yerga tashlang yoki tanlang.</Text>
                        </>
                    )}
                    <HStack gap={2} flexWrap="wrap">
                        <Button type="button" size="sm" h="34px" px={3} borderRadius="lg" variant="outline" color={accentColor} borderColor={isDark ? 'rgb(var(--accent-400) / .4)' : 'rgb(var(--accent-warm-200))'} _hover={{ bg: accentSoft }} disabled={disabled} onClick={() => inputRef.current?.click()}>
                            <HStack gap={1.5}>{file || hasCurrent ? <LuRefreshCw size={14} /> : <LuUpload size={14} />}<span>{file || hasCurrent ? 'Almashtirish' : 'Rasm tanlash'}</span></HStack>
                        </Button>
                        {file && (
                            <Button type="button" size="sm" h="34px" px={3} borderRadius="lg" variant="ghost" color={subtitleColor} disabled={disabled} onClick={() => onChange(null)}>
                                <HStack gap={1.5}><LuTrash2 size={14} /><span>Bekor qilish</span></HStack>
                            </Button>
                        )}
                    </HStack>
                </VStack>
            </HStack>
        </Field.Root>
    );
}

ImageField.propTypes = {
    file: PropTypes.instanceOf(File),
    onChange: PropTypes.func.isRequired,
    currentUrl: PropTypes.string,
    currentVersion: PropTypes.string,
    disabled: PropTypes.bool,
};
