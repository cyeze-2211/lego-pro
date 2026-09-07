import PropTypes from 'prop-types';
import {
    Box,
    Button,
    HStack,
    IconButton,
    Text,
    VStack,
} from '@chakra-ui/react';
import { LuArrowDown, LuArrowUp, LuPackage, LuPlus, LuScale, LuTrash2 } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import FormattedNumberInput from '../../../ui/FormattedNumberInput';
import FormControl from '../../../ui/FormControl';

export const UNITS = [
    { value: 'GRAM', label: 'Gramm' },
    { value: 'KG', label: 'Kilogramm' },
    { value: 'TON', label: 'Tonna' },
];

const emptyItem = (stepOrder) => ({
    rawMaterialId: '',
    quantity: '',
    unit: 'KG',
    stepOrder,
});

// Retsept qatorlari muharriri: Create va Edit tomonidan ulanadi
export default function RecipeItemsForm({ items, setItems, rawMaterials }) {
    const { isDark, textColor, subtitleColor, cardBorder, accentColor } = useAppTheme();
    const rowBg = isDark ? 'rgba(148, 163, 184, 0.06)' : '#F8FAFC';
    const rowBorder = isDark ? cardBorder : '#CBD5E1';

    const renumber = (list) => list.map((item, index) => ({ ...item, stepOrder: index + 1 }));

    const updateItem = (index, patch) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const addItem = () => setItems((prev) => [...prev, emptyItem(prev.length + 1)]);

    const removeItem = (index) => {
        setItems((prev) => renumber(prev.filter((_, i) => i !== index)));
    };

    const moveItem = (index, direction) => {
        setItems((prev) => {
            const next = [...prev];
            const target = index + direction;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return renumber(next);
        });
    };

    return (
        <VStack align="stretch" gap={4}>
            <HStack justify="space-between">
                <Text fontWeight="semibold" color={textColor}>Retsept tarkibi</Text>
                <Text fontSize="sm" color={subtitleColor}>{items.length} ta qator</Text>
            </HStack>

            <VStack align="stretch" gap={3}>
                {items.map((item, index) => (
                    <Box
                        key={item._key || index}
                        p={4}
                        borderRadius="xl"
                        bg={rowBg}
                        borderWidth="1px"
                        borderColor={rowBorder}
                    >
                        <HStack justify="space-between" mb={3}>
                            <HStack gap={2}>
                                <Box p={2} borderRadius="lg" bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEF3C7'} color={accentColor} fontSize="sm" fontWeight="bold" minW="32px" textAlign="center">
                                    {item.stepOrder}
                                </Box>
                                <Text fontSize="sm" color={subtitleColor}>Qadam {item.stepOrder}</Text>
                            </HStack>
                            <HStack gap={1}>
                                <IconButton aria-label="Yuqoriga" size="xs" variant="ghost" disabled={index === 0} onClick={() => moveItem(index, -1)} color={subtitleColor}><LuArrowUp size={14} /></IconButton>
                                <IconButton aria-label="Pastga" size="xs" variant="ghost" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} color={subtitleColor}><LuArrowDown size={14} /></IconButton>
                                <IconButton aria-label="O‘chirish" size="xs" variant="ghost" onClick={() => removeItem(index)} color={isDark ? 'red.300' : 'red.600'}><LuTrash2 size={14} /></IconButton>
                            </HStack>
                        </HStack>

                        <VStack align="stretch" gap={3}>
                            <FormControl
                                as="select"
                                value={item.rawMaterialId}
                                onChange={(event) => updateItem(index, { rawMaterialId: event.target.value })}
                                minH="46px"
                            >
                                <option value="">Xom ashyoni tanlang</option>
                                {rawMaterials.map((raw) => (
                                    <option key={raw.id} value={raw.id}>{raw.name}</option>
                                ))}
                            </FormControl>
                            <HStack gap={3} flexDirection={{ base: 'column', sm: 'row' }}>
                                <Box flex="1" w="100%">
                                    <HStack gap={2} mb={1}><LuScale size={14} color={subtitleColor} /><Text fontSize="xs" color={subtitleColor}>Miqdor</Text></HStack>
                                    <FormattedNumberInput value={item.quantity} onChange={(value) => updateItem(index, { quantity: value })} placeholder="Masalan, 2" min="1" step="1" minH="46px" />
                                </Box>
                                <Box w={{ base: '100%', sm: '160px' }}>
                                    <HStack gap={2} mb={1}><LuPackage size={14} color={subtitleColor} /><Text fontSize="xs" color={subtitleColor}>Birlik</Text></HStack>
                                    <FormControl as="select" value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })} minH="46px">
                                        {UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                                    </FormControl>
                                </Box>
                            </HStack>
                        </VStack>
                    </Box>
                ))}

                <Button
                    onClick={addItem}
                    variant="outline"
                    borderColor={accentColor}
                    color={accentColor}
                    borderRadius="xl"
                    minH="46px"
                    _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.08)' : 'yellow.50' }}
                >
                    <HStack gap={2}><LuPlus size={18} /><span>Qator qo‘shish</span></HStack>
                </Button>
            </VStack>
        </VStack>
    );
}

RecipeItemsForm.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        rawMaterialId: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        unit: PropTypes.string,
        stepOrder: PropTypes.number,
    })).isRequired,
    setItems: PropTypes.func.isRequired,
    rawMaterials: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
};
