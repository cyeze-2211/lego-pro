import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, HStack } from '@chakra-ui/react';
import { LuPrinter } from 'react-icons/lu';
import { useAppTheme } from '../../theme/tokens';
import LabelPrintDialog from './LabelPrintDialog';
import PackLabelDialog from './PackLabelDialog';

/**
 * «Yorliq chop etish» tugmasi + oyna. `label` berilsa matnli, bo‘lmasa ikonka-tugma.
 * transactionId — kirim yozuvi pachkalari (stanokdan kirim); bo‘lmasa productId (+warehouseId) bo‘yicha
 * omborda turgan pachkalar ro‘yxati ochiladi — kerakligini tanlab chop etiladi.
 */
export default function LabelPrintButton({ transactionId, productId, warehouseId, productName, label }) {
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
            {transactionId
                ? <LabelPrintDialog open={open} onClose={() => setOpen(false)} transactionId={transactionId} productId={productId} productName={productName} />
                : <PackLabelDialog open={open} onClose={() => setOpen(false)} productId={productId} warehouseId={warehouseId} productName={productName} />}
        </>
    );
}

LabelPrintButton.propTypes = {
    transactionId: PropTypes.string,
    productId: PropTypes.string,
    warehouseId: PropTypes.string,
    productName: PropTypes.string,
    label: PropTypes.string,
};
