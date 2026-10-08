import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
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
    LuPen,
    LuTag,
    LuHash,
    LuRuler,
    LuTriangleAlert,
    LuBoxes,
    LuWarehouse,
    LuGift,
} from 'react-icons/lu';
import { useUpdateProductMutation } from '../../../../store/services/product.api';
import { useGetWarehousesQuery } from '../../../../store/services/warehouse.api';
import { useGetBrandsQuery } from '../../../../store/services/brand.api';
import { useGetProductColorsQuery } from '../../../../store/services/productColor.api';
import { useGetProductCategoriesQuery } from '../../../../store/services/productCategory.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormattedNumberInput from '../../../ui/FormattedNumberInput';
import FormControl from '../../../ui/FormControl';

/* ── helpers ── */
const toStr = (v) => (v === null || v === undefined ? '' : String(v));

/** "25 000", "25,000", "25 000.50" → 25000 / 25000.5 ; "" / "abc" → NaN */
const parseNumber = (raw) => {
    const cleaned = toStr(raw)
        .replace(/\s+/g, '')      // пробелы-разделители
        .replace(/,/g, '')        // запятые-разделители
        .replace(/[^\d.-]/g, ''); // всё остальное — прочь
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
    return Number(cleaned);
};

const buildInitial = (product) => ({
    name: toStr(product?.name),
    price: toStr(product?.price),
    bonusPrice: toStr(product?.bonusPrice),
    warehouseId: product?.warehouseId || '',
    article: toStr(product?.article),
    size: toStr(product?.size),
    minimumLine: toStr(product?.minimumLine),
    piecesPerPack: toStr(product?.piecesPerPack),
    lowProductAlert: Boolean(product?.lowProductAlert),
    brandId: product?.brand?.id || product?.brandId || '',
    colorId: product?.color?.id || product?.colorId || '',
    categoryId: product?.category?.id || product?.categoryId || '',
});

export default function Edit({ product }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [form, setForm] = useState(() => buildInitial(product));
    const [updateProduct, { isLoading }] = useUpdateProductMutation();
    const {
        data: warehouses = [],
        isLoading: warehousesLoading,
        isError: warehousesError,
    } = useGetWarehousesQuery('PRODUCT', { skip: !open });

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

    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const brands = brandsData?.items ?? [];
    const colors = colorsData?.items ?? [];
    const categories = categoriesData?.items ?? [];

    /* Сброс формы только при открытии */
    const productRef = useRef(product);
    productRef.current = product;
    const wasOpenRef = useRef(false);
    useEffect(() => {
        if (open && !wasOpenRef.current) {
            setForm(buildInitial(productRef.current));
        }
        wasOpenRef.current = open;
    }, [open]);

    const setField = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async () => {
        if (isLoading) return;

        const trimmedName = toStr(form.name).trim();
        const priceNum = parseNumber(form.price);
        const bonusPriceNum = parseNumber(form.bonusPrice);
        const minLineNum = parseNumber(form.minimumLine);
        const piecesNum = parseNumber(form.piecesPerPack);

        if (!trimmedName) {
            Alert('Mahsulot nomi majburiy', 'error');
            return;
        }
        if (Number.isNaN(priceNum) || priceNum <= 0) {
            Alert('Narx 0 dan katta bo‘lishi kerak', 'error');
            return;
        }
        if (
            form.bonusPrice !== '' &&
            !Number.isNaN(bonusPriceNum) &&
            bonusPriceNum < 0
        ) {
            Alert('Bonus narx manfiy bo‘lishi mumkin emas', 'error');
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

        const payload = {
            name: trimmedName,
            price: priceNum,
            warehouseId: form.warehouseId,
            article: toStr(form.article).trim(),
            size: toStr(form.size).trim(),
            minimumLine: Number.isNaN(minLineNum) ? 0 : minLineNum,
            piecesPerPack: Number.isNaN(piecesNum) ? null : piecesNum,
            brandId: form.brandId || null,
            colorId: form.colorId,
            categoryId: form.categoryId,
            lowProductAlert: Boolean(form.lowProductAlert),
        };

        /* Bonus narx — faqat kiritilgan bo'lsa yuboriladi,
         * bo'sh bo'lsa null (backend tozalab qo'yishi uchun). */
        payload.bonusPrice =
            form.bonusPrice !== '' && !Number.isNaN(bonusPriceNum)
                ? bonusPriceNum
                : null;

        try {
            await updateProduct({ id: product.id, data: payload }).unwrap();
            Alert('Mahsulot yangilandi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Mahsulotni yangilashda xatolik', 'error');
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
                                        <span>Mahsulotni tahrirlash</span>
                                        <Box
                                            fontSize="sm"
                                            fontWeight="normal"
                                            color={subtitleColor}
                                        >
                                            {product.name}
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
                                    disabled={isLoading}
                                >
                                    <X />
                                </Button>
                            </Dialog.CloseTrigger>

                            <Dialog.Body py={6} overflowY="auto">
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
                                                        placeholder="SH-500-02"
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
                                                        <option value={form.colorId}>{product.color?.name || 'Mavjud mahsulot rangi'}</option>
                                                    )}
                                                    {colors.map((color) => (
                                                        <option key={color.id} value={color.id}>{color.name}</option>
                                                    ))}
                                                </FormControl>
                                                {!colorsLoading && !colorsError && colors.length === 0 && (
                                                    <Field.HelperText color={subtitleColor}>
                                                        Tahrirlashdan oldin ranglar bo‘limida rang qo‘shing.
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
                                                        <option value={form.categoryId}>{product.category?.name || 'Mavjud mahsulot kategoriyasi'}</option>
                                                    )}
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>{category.name}</option>
                                                    ))}
                                                </FormControl>
                                                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                                                    <Field.HelperText color={subtitleColor}>
                                                        Tahrirlashdan oldin kategoriyalar bo‘limida kategoriya qo‘shing.
                                                    </Field.HelperText>
                                                )}
                                            </Field.Root>
                                        </VStack>
                                    </Box>

                                    {/* ═══ Narx va ombor ═══ */}
                                    <Box>
                                        {sectionHeader(<LuDollarSign size={16} />, 'Narx va ombor')}

                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5} mb={5}>
                                            <Field.Root required>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuDollarSign size={16} />
                                                        <span>Narxi (so‘m)</span>
                                                    </HStack>
                                                    <Field.RequiredIndicator />
                                                </Field.Label>
                                                <FormattedNumberInput
                                                    value={form.price}
                                                    onChange={(v) => setField('price', v)}
                                                    placeholder="25 000"
                                                    size="lg"
                                                    min="0.01"
                                                    step="0.01"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                />
                                            </Field.Root>

                                            {/* Bonus narx — ixtiyoriy */}
                                            <Field.Root>
                                                <Field.Label color={textColor} fontWeight="medium">
                                                    <HStack gap={2}>
                                                        <LuGift size={16} />
                                                        <span>Bonus narx (so‘m)</span>
                                                    </HStack>
                                                </Field.Label>
                                                <FormattedNumberInput
                                                    value={form.bonusPrice}
                                                    onChange={(v) => setField('bonusPrice', v)}
                                                    placeholder="100 (ixtiyoriy)"
                                                    size="lg"
                                                    min="0"
                                                    step="0.01"
                                                    minH="52px"
                                                    disabled={isLoading}
                                                />
                                                <Field.HelperText color={subtitleColor}>
                                                    Bonus ball yig‘ish uchun narx
                                                </Field.HelperText>
                                            </Field.Root>
                                        </SimpleGrid>

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
                                                onChange={(event) => setField('warehouseId', event.target.value)}
                                                minH="52px"
                                                disabled={isLoading || warehousesLoading || warehousesError}
                                            >
                                                <option value="">
                                                    {warehousesLoading
                                                        ? 'Omborlar yuklanmoqda...'
                                                        : warehousesError
                                                        ? 'Omborlarni yuklashda xatolik'
                                                        : 'Omborni tanlang'}
                                                </option>
                                                {form.warehouseId && !warehouses.some((warehouse) => warehouse.id === form.warehouseId) && (
                                                    <option value={form.warehouseId}>Joriy ombor</option>
                                                )}
                                                {warehouses.map((warehouse) => (
                                                    <option key={warehouse.id} value={warehouse.id}>
                                                        {warehouse.name}
                                                    </option>
                                                ))}
                                            </FormControl>
                                        </Field.Root>
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
                                        Saqlashda barcha maydonlar yangilanadi.
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
                                    disabled={isLoading || !toStr(form.name).trim() || !form.price}
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
    product: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        bonusPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        warehouseId: PropTypes.string,
        article: PropTypes.string,
        size: PropTypes.string,
        minimumLine: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        piecesPerPack: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        lowProductAlert: PropTypes.bool,
        brandId: PropTypes.string,
        brand: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
        }),
        colorId: PropTypes.string,
        color: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
        }),
        categoryId: PropTypes.string,
        category: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
        }),
    }).isRequired,
};