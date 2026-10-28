import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, HStack } from '@chakra-ui/react';
import { LuPrinter } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import LabelPrintDialog from './LabelPrintDialog';

/** «Yorliq chop etish» tugmasi + oyna. `label` berilsa matnli, bo‘lmasa ikonka-tugma. */
export default function LabelPrintButton({ productId, productName, label }) {
    const [open, setOpen] = useState(false);
    const { isDark, accentColor } = useAppTheme();
    const soft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';
    return (
        <>
            {label ? (
                <Button variant="outline" borderRadius="xl" h="42px" px={4} color={accentColor} borderColor={isDark ? 'rgb(var(--accent-400) / .4)' : 'rgb(var(--accent-warm-200))'} _hover={{ bg: soft }} onClick={() => setOpen(true)}>
                    <HStack gap={2}><LuPrinter size={16} /><span>{label}</span></HStack>
                </Button>
            ) : (
                <Button onClick={() => setOpen(true)} variant="ghost" size="sm" w="34px" h="34px" p={0} minW={0} borderRadius="lg" color={accentColor} aria-label="Yorliq chop etish" title="Yorliq chop etish" _hover={{ bg: soft }}>
                    <LuPrinter size={16} />
                </Button>
            )}
            <LabelPrintDialog open={open} onClose={() => setOpen(false)} productId={productId} productName={productName} />
        </>
    );
}

LabelPrintButton.propTypes = {
    productId: PropTypes.string.isRequired,
    productName: PropTypes.string,
    label: PropTypes.string,
};
