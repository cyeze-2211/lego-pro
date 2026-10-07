import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Badge,
    Box,
    Button,
    Dialog,
    Field,
    HStack,
    Portal,
    Spinner,
    SimpleGrid,
    Text,
    VStack,
    useDisclosure,
} from '@chakra-ui/react';
import { Check, Layers3, Package, Palette, X } from 'lucide-react';
import {
    LuDollarSign,
    LuPlus,
    LuWarehouse,
    LuHash,
    LuRuler,
    LuTriangleAlert,
    LuTag,
    LuClipboardPaste,
    LuBoxes,
} from 'react-icons/lu';
import { useCreateProductMutation } from '../../../../store/services/product.api';
import { useGetBrandsQuery } from '../../../../store/services/brand.api';
import { useGetProductColorsQuery } from '../../../../store/services/productColor.api';
import { useGetProductCategoriesQuery } from '../../../../store/services/productCategory.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormattedNumberInput from '../../../ui/FormattedNumberInput';
import FormControl from '../../../ui/FormControl';

const CLIPBOARD_EVENT = 'product-clipboard-changed';

const EMPTY_FORM = {
    name: '',
    price: '',
    warehouseId: '',
    article: '',
    size: '',
    minimumLine: '',
    piecesPerPack: '',
    brandId: '',
    colorId: '',
    categoryId: '',
};

/* ── Clipboard helpers (faqat xotirada) ── */
const readClipboard = () => window.__productClipboard || null;

const clearClipboard = () => {
    delete window.__productClipboard;
    window.dispatchEvent(new Event(CLIPBOARD_EVENT));
};

const buildFromClipboard = (clip) => ({
    name: clip.name ? `${clip.name} (nusxa)` : '',
    price: String(clip.price ?? ''),
    warehouseId: clip.warehouseId || '',
    article: clip.article || '',
    size: clip.size || '',
    minimumLine:
        clip.minimumLine !== null &&
        clip.minimumLine !== undefined &&
        clip.minimumLine !== ''
            ? String(clip.minimumLine)
            : '',
    piecesPerPack:
        clip.piecesPerPack !== null &&
        clip.piecesPerPack !== undefined &&
        clip.piecesPerPack !== ''
            ? String(clip.piecesPerPack)
            : '',
    brandId: clip.brandId || '',
    colorId: clip.colorId || '',
    categoryId: clip.categoryId || '',
});

/* "25 000" → 25000 ; "" / "abc" → NaN */
const parseNumber = (raw) => {
    const cleaned = String(raw ?? '')
        .replace(/\s+/g, '')
        .replace(/,/g, '')
        .replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
    return Number(cleaned);
};

export default function Create({ warehouses }) {
    const { open, onOpen, onClose } = useDisclosure();

    const [form, setForm] = useState(EMPTY_FORM);
    const [copiedFrom, setCopiedFrom] = useState(null);
    const [hasClipboard, setHasClipboard] = useState(() => !!readClipboard());

    const [createProduct, { isLoading }] = useCreateProductMutation();
    const {
        data: brandsData,
        isLoading: brandsLoading,
        isError: brandsError,
    } = useGetBrandsQuery({ page: 0, size: 200 }, { skip: !open });
    const {
        data: colorsData,
        isLoading: colorsLoading,
        isError: colorsError,
    } = useGetProductColorsQuery({ page: 0, size: 200 }, { skip: !open });
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
        isError: categoriesError,
    } = useGetProductCategoriesQuery({ page: 0, size: 200 }, { skip: !open });

    const {
        isDark,
        accentColor,
        cardBg,
        cardBorder,
        textColor,
        subtitleColor,
    } = useAppTheme();

    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const brands = brandsData?.items ?? [];
    const colors = colorsData?.items ?? [];
    const categories = categoriesData?.items ?? [];

    // Clipboard o'zgarishlarini kuzatish (faqat shu sahifa ichida)
    useEffect(() => {
        const sync = () => setHasClipboard(!!readClipboard());
        window.addEventListener(CLIPBOARD_EVENT, sync);
        return () => window.removeEventListener(CLIPBOARD_EVENT, sync);
    }, []);

    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    // Modal ochilganda clipboard'ni tekshiramiz va avtomatik to'ldiramiz
    const handleOpen = () => {
        const clip = readClipboard();
        if (clip) {
            setForm(buildFromClipboard(clip));
            setCopiedFrom(clip.sourceName || clip.name || 'Noma’lum');
        } else {
            setForm(EMPTY_FORM);
            setCopiedFrom(null);
        }
        onOpen();
    };

    const handleClose = () => {
        if (isLoading) return;
        onClose();
    };

    const handleClearClipboard = () => {
        clearClipboard();
        setCopiedFrom(null);
        setForm(EMPTY_FORM);
        setHasClipboard(false);
    };

    const handleReset = () => {
        // Nusxa saqlanib qoladi, faqat forma tozalanadi
        setForm(EMPTY_FORM);
        setCopiedFrom(null);
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        const trimmedName = form.name.trim();
        if (!trimmedName) {
            Alert('Mahsulot nomi majburiy', 'error');
            return;
        }
        if (!form.warehouseId) {
            Alert('Omborni tanlang', 'error');
            return;
        }
        if (!form.colorId) {
            Alert('Mahsulot rangini tanlang', 'error');
            return;
        }
        if (!form.categoryId) {
            Alert('Mahsulot kategoriyasini tanlang', 'error');
            return;
        }

        /* ── Narx — ixtiyoriy ── */
        const priceNum = parseNumber(form.price);
        if (form.price !== '' && !Number.isNaN(priceNum) && priceNum < 0) {
            Alert('Narx manfiy bo‘lishi mumkin emas', 'error');
            return;
        }

        const payload = {
            name: trimmedName,
            warehouseId: form.warehouseId,
            colorId: form.colorId,
            categoryId: form.categoryId,
        };

        // Narx faqat kiritilgan bo'lsa yuboriladi
        if (form.price !== '' && !Number.isNaN(priceNum)) {
            payload.price = priceNum;
        }

        if (form.article.trim()) payload.article = form.article.trim();
        if (form.size.trim()) payload.size = form.size.trim();
        if (form.minimumLine !== '' && !Number.isNaN(Number(form.minimumLine))) {
            payload.minimumLine = Number(form.minimumLine);
        }
        if (form.piecesPerPack !== '' && !Number.isNaN(Number(form.piecesPerPack))) {
            payload.piecesPerPack = Number(form.piecesPerPack);
        }
        if (form.brandId) payload.brandId = form.brandId;

        try {
            await createProduct(payload).unwrap();
            Alert('Mahsulot muvaffaqiyatli yaratildi', 'success');
            onClose();
            setForm(EMPTY_FORM);
            setCopiedFrom(null);
        } catch (error) {
            Alert(error?.data?.message || 'Mahsulot yaratishda xatolik', 'error');
        }
    };

    const sectionHeader = (icon, label) => (
        <HStack
            gap={2}
            color={accentColor}
            fontWeight="semibold"
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={3}
        >
            {icon}
            <span>{label}</span>
            <Box flex="1" h="1px" bg={modalBorder} />
        </HStack>
    );

    return (
        <>
            <Button
                onClick={handleOpen}
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
                    <span>Mahsulot qo‘shish</span>
                    {hasClipboard && (
                        <Badge
                            bg={isDark ? 'blue.400' : 'blue.500'}
                            color="white"
                            borderRadius="full"
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            ml={1}
                        >
                            nusxa bor
                        </Badge>
                    )}
                </HStack>
            </Button>

            <Dialog.Root
                open={open}
                onOpenChange={(event) => (event.open ? handleOpen() : handleClose())}
                size="xl"
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
                            maxW="720px"
                            w="calc(100% - 32px)"
                            maxH="92vh"
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
                                        <Package size={24} />
                                    </Box>
                                    <VStack align="start" gap={0}>
                                        <span>Yangi mahsulot</span>
                                        <Box
                                            fontSize="sm"
                                            fontWeight="normal"
                                            color={subtitleColor}
                                        >
                                            Mahsulot ma’lumotlarini to‘ldiring
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

                            <Dialog.Body py={6} overflowY="auto">
                                {/* ── Nusxa banner ── */}
                                {copiedFrom && (
                                    <Box
                                        mb={5}
                                        p={3}
                                        borderRadius="lg"
                                        bg={
                                            isDark
                                                ? 'rgba(96, 165, 250, 0.12)'
                                                : 'blue.50'
                                        }
                                        borderWidth="1px"
                                        borderColor={
                                            isDark
                                                ? 'rgba(96, 165, 250, 0.30)'
                                                : 'blue.200'
                                        }
                                    >
                                        <HStack justify="space-between" align="center" gap={3}>
                                            <HStack
                                                gap={2}
                                                color={isDark ? 'blue.200' : 'blue.700'}
                                                minW={0}
                                            >
                                                <LuClipboardPaste
                                                    size={16}
                                                    style={{ flexShrink: 0 }}
                                                />
                                                <Text
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    noOfLines={1}
                                                >
                                                    Nusxa:{' '}
                                                    <Text as="span" fontWeight="bold">
                                                        {copiedFrom}
                                                    </Text>
                                                </Text>
                                            </HStack>
                                            <Button
                                                size="xs"
                                                variant="ghost"
                                                color={isDark ? 'blue.200' : 'blue.700'}
                                                onClick={handleClearClipboard}
                                                _hover={{
                                                    bg: isDark
                                                        ? 'rgba(96, 165, 250, 0.2)'
                                                        : 'blue.100',
                                                }}
                                                flexShrink={0}
                                            >
                                                <HStack gap={1}>
                                                    <X size={12} />
                                                    <span>Tozalash</span>
                                                </HStack>
                                            </Button>
                                        </HStack>
                                        <Text fontSize="xs" color={subtitleColor} mt={1}>
                                            Maydonlar avtomatik to‘ldirildi. Kerak bo‘lsa tahrirlab,
                                            saqlang.
                                        </Text>
                                    </Box>
                                )}

                                <VStack gap={7} align="stretch">
                                    {/* ═══ Asosiy ma'lumotlar ═══ */}
                                    <Box>
                                        {sectionHeader(<Package size={16} />, 'Asosiy ma’lumotlar')}
                                        <VStack gap={5} align="stretch">
                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <Package size={16} />
                                                        <span>Mahsulot nomi</span>
                                                    </HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormControl
                                                    value={form.name}
                                                    onChange={(e) => setField('name', e.target.value)}
                                                    placeholder="Masalan, Shakar"
                                                    autoFocus
                                                    size="lg"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                />
                                            </Field.Root>

                                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                                <Field.Root>
                                                    <Field.Label color={textColor} fontWeight="medium">
                                                        <HStack gap={2}>
                                                            <LuHash size={16} />
                                                            <span>Artikul</span>
                                                        </HStack>
                                                    </Field.Label>
                                                    <FormControl
                                                        value={form.article}
                                                        onChange={(e) => setField('article', e.target.value)}
                                                        placeholder="SH-500-01"
                                                        minH="52px"
                                                        disabled={isLoading}
                                                    />
                                                    <Field.HelperText color={subtitleColor}>
                                                        Unikal kod
                                                    </Field.HelperText>
                                                </Field.Root>

                                                <Field.Root>
                                                    <Field.Label color={textColor} fontWeight="medium">
                                                        <HStack gap={2}>
                                                            <LuRuler size={16} />
                                                            <span>O‘lcham / Hajm</span>
                                                        </HStack>
                                                    </Field.Label>
                                                    <FormControl
                                                        value={form.size}
                                                        onChange={(e) => setField('size', e.target.value)}
                                                        placeholder="500ml, 1kg, XL..."
                                                        minH="52px"
                                                        disabled={isLoading}
                                                    />
                                                    <Field.HelperText color={subtitleColor}>
                                                        Masalan: 500ml, 1kg
                                                    </Field.HelperText>
                                                </Field.Root>
                                            </SimpleGrid>

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuTag size={16} />
                                                        <span>Brend</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormControl
                                                    as="select"
                                                    value={form.brandId}
                                                    onChange={(e) => setField('brandId', e.target.value)}
                                                    minH="52px"
                                                    disabled={isLoading || brandsLoading}
                                                >
                                                    <option value="">
                                                        {brandsLoading
                                                            ? 'Yuklanmoqda...'
                                                            : brandsError
                                                            ? 'Brendlarni yuklashda xatolik'
                                                            : 'Brendni tanlang (ixtiyoriy)'}
                                                    </option>
                                                    {brands.map((brand) => (
                                                        <option key={brand.id} value={brand.id}>
                                                            {brand.name}
                                                        </option>
                                                    ))}
                                                </FormControl>
                                                {!brandsLoading && !brandsError && brands.length === 0 && (
                                                    <Field.HelperText color={subtitleColor}>
                                                        Hozircha brendlar yo‘q
                                                    </Field.HelperText>
                                                )}
                                            </Field.Root>
                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <Palette size={16} />
                                                        <span>Mahsulot rangi</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormControl
                                                    as="select"
                                                    value={form.colorId}
                                                    onChange={(e) => setField('colorId', e.target.value)}
                                                    minH="52px"
                                                    disabled={isLoading || colorsLoading || colorsError || colors.length === 0}
                                                >
                                                    <option value="">
                                                        {colorsLoading
                                                            ? 'Ranglar yuklanmoqda...'
                                                            : colorsError
                                                            ? 'Ranglarni yuklashda xatolik'
                                                            : colors.length === 0
                                                            ? 'Avval rang qo‘shing'
                                                            : 'Rangni tanlang'}
                                                    </option>
                                                    {form.colorId && !colors.some((color) => color.id === form.colorId) && (
                                                        <option value={form.colorId}>Mavjud mahsulot rangi</option>
                                                    )}
                                                    {colors.map((color) => (
                                                        <option key={color.id} value={color.id}>{color.name}</option>
                                                    ))}
                                                </FormControl>
                                                {!colorsLoading && !colorsError && colors.length === 0 && (
                                                    <Field.HelperText color={subtitleColor}>
                                                        Mahsulot yaratishdan oldin ranglar bo‘limida rang qo‘shing.
                                                    </Field.HelperText>
                                                )}
                                            </Field.Root>
                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <Layers3 size={16} />
                                                        <span>Mahsulot kategoriyasi</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormControl
                                                    as="select"
                                                    value={form.categoryId}
                                                    onChange={(e) => setField('categoryId', e.target.value)}
                                                    minH="52px"
                                                    disabled={isLoading || categoriesLoading || categoriesError || categories.length === 0}
                                                >
                                                    <option value="">
                                                        {categoriesLoading
                                                            ? 'Kategoriyalar yuklanmoqda...'
                                                            : categoriesError
                                                            ? 'Kategoriyalarni yuklashda xatolik'
                                                            : categories.length === 0
                                                            ? 'Avval kategoriya qo‘shing'
                                                            : 'Kategoriyani tanlang'}
                                                    </option>
                                                    {form.categoryId && !categories.some((category) => category.id === form.categoryId) && (
                                                        <option value={form.categoryId}>Mavjud mahsulot kategoriyasi</option>
                                                    )}
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>{category.name}</option>
                                                    ))}
                                                </FormControl>
                                                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                                                    <Field.HelperText color={subtitleColor}>
                                                        Mahsulot yaratishdan oldin kategoriyalar bo‘limida kategoriya qo‘shing.
                                                    </Field.HelperText>
                                                )}
                                            </Field.Root>
                                        </VStack>
                                    </Box>

                                    {/* ═══ Narx va ombor ═══ */}
                                    <Box>
                                        {sectionHeader(<LuDollarSign size={16} />, 'Narx va ombor')}
                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                            {/* Narx — ixtiyoriy */}
                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuDollarSign size={16} />
                                                        <span>Narxi (so‘m)</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormattedNumberInput
                                                    value={form.price}
                                                    onChange={(v) => setField('price', v)}
                                                    placeholder="25 000 (ixtiyoriy)"
                                                    size="lg"
                                                    min="0"
                                                    step="0.01"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                />
                                                <Field.HelperText color={subtitleColor}>
                                                    Bo‘sh qoldirsangiz ham bo‘ladi
                                                </Field.HelperText>
                                            </Field.Root>

                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuWarehouse size={16} />
                                                        <span>Ombor</span>
                                                    </HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormControl
                                                    as="select"
                                                    value={form.warehouseId}
                                                    onChange={(e) => setField('warehouseId', e.target.value)}
                                                    w="100%"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                >
                                                    <option value="">Omborni tanlang</option>
                                                    {warehouses.map((warehouse) => (
                                                        <option key={warehouse.id} value={warehouse.id}>
                                                            {warehouse.name}
                                                        </option>
                                                    ))}
                                                </FormControl>
                                            </Field.Root>
                                        </SimpleGrid>
                                    </Box>

                                    {/* ═══ Qadoq ═══ */}
                                    <Box>
                                        {sectionHeader(<LuBoxes size={16} />, 'Qadoq')}
                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuBoxes size={16} />
                                                        <span>Qadoqdagi dona</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormControl
                                                    type="number"
                                                    value={form.piecesPerPack}
                                                    onChange={(e) => setField('piecesPerPack', e.target.value)}
                                                    placeholder="12"
                                                    min="1"
                                                    step="1"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                />
                                                <Field.HelperText color={subtitleColor}>
                                                    1 qadoqda nechta dona bor
                                                </Field.HelperText>
                                            </Field.Root>

                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuTriangleAlert size={16} />
                                                        <span>Minimum qoldiq (dona)</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormControl
                                                    type="number"
                                                    value={form.minimumLine}
                                                    onChange={(e) => setField('minimumLine', e.target.value)}
                                                    placeholder="10"
                                                    min="0"
                                                    step="1"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                />
                                                <Field.HelperText color={subtitleColor}>
                                                    Qoldiq shu miqdordan tushsa — ogohlantirish
                                                </Field.HelperText>
                                            </Field.Root>
                                        </SimpleGrid>
                                    </Box>

                                    <Text fontSize="sm" color={subtitleColor}>
                                        Shtrix-kod server tomonidan avtomatik yaratiladi.
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
                                {copiedFrom && (
                                    <Button
                                        variant="ghost"
                                        onClick={handleReset}
                                        color={subtitleColor}
                                        size="lg"
                                        px={4}
                                        borderRadius="xl"
                                        disabled={isLoading}
                                        _hover={{
                                            bg: isDark
                                                ? 'rgba(148, 163, 184, 0.16)'
                                                : 'gray.100',
                                            color: textColor,
                                        }}
                                    >
                                        Formani tozalash
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={handleClose}
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
                                    disabled={
                                        isLoading ||
                                        !form.name.trim() ||
                                        !form.warehouseId ||
                                        !form.colorId ||
                                        !form.categoryId
                                    }
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

Create.propTypes = {
    warehouses: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
        }),
    ).isRequired,
};