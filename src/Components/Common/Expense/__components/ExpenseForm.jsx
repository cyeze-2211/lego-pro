import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { Check, ReceiptText, X } from 'lucide-react';
import { LuCalendarDays, LuDollarSign, LuStickyNote, LuTag, LuWallet } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';
import { Alert } from '../../../Other/UI/Alert/Alert';

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ open, onClose, cashboxes, expense = null, onSubmit, isLoading }) {
    const [name, setName] = useState('');
    const [summary, setSummary] = useState('');
    const [amount, setAmount] = useState('');
    const [cashboxId, setCashboxId] = useState('');
    const [expenseDate, setExpenseDate] = useState(today());
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const isEdit = Boolean(expense);

    useEffect(() => {
        if (open) {
            setName(expense?.name || ''); setSummary(expense?.summary || ''); setAmount(expense?.amount?.toString() || '');
            setCashboxId(expense?.cashboxId || ''); setExpenseDate(expense?.expenseDate || today());
        }
    }, [open, expense]);

    const save = async () => {
        const trimmedName = name.trim();
        const trimmedSummary = summary.trim();
        const numericAmount = Number(amount);
        if (!trimmedName || (!isEdit && !cashboxId) || !amount) return Alert('Nomi, summa va kassa majburiy', 'error');
        if (trimmedName.length > 255 || trimmedSummary.length > 500) return Alert('Nom 255, izoh esa 500 belgidan oshmasligi kerak', 'error');
        if (!/^\d+(?:[.,]\d{1,2})?$/.test(amount) || !Number.isFinite(numericAmount) || numericAmount <= 0) return Alert('Summa 0 dan katta va 2 kasr xonagacha bo‘lishi kerak', 'error');
        if (!expenseDate || expenseDate > today()) return Alert('Xarajat sanasi bugun yoki undan oldingi kun bo‘lishi kerak', 'error');
        await onSubmit({ name: trimmedName, summary: trimmedSummary || null, amount: numericAmount, ...(isEdit ? {} : { cashboxId }), expenseDate });
    };

    return <Dialog.Root open={open} onOpenChange={(event) => !event.open && onClose()} size="md" placement="center"><Portal><Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} /><Dialog.Positioner><Dialog.Content bg={cardBg} borderColor={modalBorder} borderWidth="1px" borderRadius="2xl" overflow="hidden" maxW="560px" w="calc(100% - 32px)">
        <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`}/>
        <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}><HStack gap={3}><Box p={3} borderRadius="xl" bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'} color={accentColor}><ReceiptText size={24}/></Box><span>{isEdit ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</span></HStack></Dialog.Header>
        <Dialog.CloseTrigger asChild><Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish"><X/></Button></Dialog.CloseTrigger>
        <Dialog.Body py={6}><VStack gap={5} align="stretch">
            <Field.Root required><Field.Label color={textColor}><HStack gap={2}><LuTag size={16}/><span>Xarajat nomi</span></HStack><Field.RequiredIndicator/></Field.Label><FormControl value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Masalan, Ijara to‘lovi" maxLength={255}/></Field.Root>
            <Field.Root required><Field.Label color={textColor}><HStack gap={2}><LuWallet size={16}/><span>Kassa</span></HStack><Field.RequiredIndicator/></Field.Label>{isEdit ? <Box px={4} py={3} borderWidth="1px" borderColor={modalBorder} borderRadius="xl" color={textColor}>{expense.cashboxName}</Box> : <FormControl as="select" value={cashboxId} onChange={(e) => setCashboxId(e.target.value)}><option value="">Kassani tanlang</option>{cashboxes.map((cashbox) => <option key={cashbox.id} value={cashbox.id}>{cashbox.name}</option>)}</FormControl>}{isEdit && <Text fontSize="xs" color={subtitleColor} mt={1}>Xarajat kassasini o‘zgartirib bo‘lmaydi.</Text>}</Field.Root>
            <HStack align="start" flexDirection={{ base: 'column', sm: 'row' }}><Field.Root required flex="1" w="100%"><Field.Label color={textColor}><HStack gap={2}><LuDollarSign size={16}/><span>Summa</span></HStack><Field.RequiredIndicator/></Field.Label><FormControl value={amount} onChange={(e) => setAmount(e.target.value.replace(',', '.'))} inputMode="decimal" placeholder="0"/></Field.Root><Field.Root required flex="1" w="100%"><Field.Label color={textColor}><HStack gap={2}><LuCalendarDays size={16}/><span>Sana</span></HStack><Field.RequiredIndicator/></Field.Label><FormControl type="date" value={expenseDate} max={today()} onChange={(e) => setExpenseDate(e.target.value)}/></Field.Root></HStack>
            <Field.Root><Field.Label color={textColor}><HStack gap={2}><LuStickyNote size={16}/><span>Izoh (ixtiyoriy)</span></HStack></Field.Label><FormControl as="textarea" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} placeholder="Xarajat haqida izoh"/></Field.Root>
        </VStack></Dialog.Body>
        <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}><Button variant="ghost" onClick={onClose} color={subtitleColor}>Bekor qilish</Button><Button onClick={save} disabled={isLoading} bg={accentColor} color="black" borderRadius="xl" px={8}>{isLoading ? <HStack><Spinner size="sm"/><span>Saqlanmoqda...</span></HStack> : <HStack><Check size={18}/><span>Saqlash</span></HStack>}</Button></Dialog.Footer>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>;
}

ExpenseForm.propTypes = { open: PropTypes.bool.isRequired, onClose: PropTypes.func.isRequired, cashboxes: PropTypes.array.isRequired, expense: PropTypes.object, onSubmit: PropTypes.func.isRequired, isLoading: PropTypes.bool.isRequired };
