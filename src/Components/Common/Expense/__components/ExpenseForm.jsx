import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Dialog, Field, HStack, Portal, Spinner, Text, VStack } from '@chakra-ui/react';
import { Check, ReceiptText, X } from 'lucide-react';
import { LuCalendarDays, LuClock3, LuStickyNote, LuTag, LuWallet, LuLayers } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import { useGetExpenseCategoriesQuery } from '../../../../store/services/expenseCategory.api';
import FormControl from '../../../ui/FormControl';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { formatTypedAmount } from '../../../ui/UsdCalculator';
import CurrencyAmountField from '../../../ui/CurrencyAmountField';
import { buildCurrencyPayload, currencyValueFrom, emptyCurrencyValue, validateCurrencyValue } from '../../../ui/currency';
import { formatTime, nowTime, todayIso } from '../../../ui/date-format';

const today = todayIso;

export default function ExpenseForm({ open, onClose, cashboxes, expense = null, onSubmit, isLoading }) {
    const [name, setName] = useState('');
    const [summary, setSummary] = useState('');
    const [money, setMoney] = useState(emptyCurrencyValue);
    const [cashboxId, setCashboxId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [expenseDate, setExpenseDate] = useState(today());
    const [expenseTime, setExpenseTime] = useState(nowTime());
    const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    const modalBorder = isDark ? cardBorder : '#94A3B8';
    const isEdit = Boolean(expense);
    const { data: categoryResult, isLoading: categoriesLoading, isError: categoriesError } =
        useGetExpenseCategoriesQuery({ page: 0, size: 200 }, { skip: !open });
    const categories = categoryResult?.items ?? [];

    useEffect(() => {
        if (open) {
            setName(expense?.name || '');
            setSummary(expense?.summary || '');
            setMoney(expense ? currencyValueFrom(expense, formatTypedAmount) : emptyCurrencyValue());
            setCashboxId(expense?.cashboxId || '');
            setCategoryId(expense?.category?.id || expense?.categoryId || '');
            setExpenseDate(expense?.expenseDate || today());
            setExpenseTime(expense ? (formatTime(expense.createdAt) || '00:00') : nowTime());
        }
    }, [open, expense]);

    const save = async () => {
        const trimmedName = name.trim();
        const trimmedSummary = summary.trim();
        if (!trimmedName || (!isEdit && !cashboxId) || !categoryId) return Alert('Nomi, summa, kategoriya va kassa majburiy', 'error');
        if (trimmedName.length > 255 || trimmedSummary.length > 500) return Alert('Nom 255, izoh esa 500 belgidan oshmasligi kerak', 'error');
        const moneyError = validateCurrencyValue(money);
        if (moneyError) return Alert(moneyError, 'error');
        if (!expenseDate || expenseDate > today()) return Alert('Xarajat sanasi bugun yoki undan oldingi kun bo‘lishi kerak', 'error');
        if (!/^\d{2}:\d{2}$/.test(expenseTime)) return Alert('Xarajat vaqtini kiriting', 'error');
        if (expenseDate === today() && expenseTime > nowTime()) return Alert('Xarajat vaqti hozirgi vaqtdan keyin bo‘lmasligi kerak', 'error');
        // Backend `expenseDate` ni faqat yyyy-MM-dd ko‘rinishida qabul qiladi; vaqt qismi alohida uzatiladi
        await onSubmit({ name: trimmedName, summary: trimmedSummary || null, ...buildCurrencyPayload(money), categoryId, ...(isEdit ? {} : { cashboxId }), expenseDate, expenseTime });
    };

    return (
        <Dialog.Root open={open} onOpenChange={(event) => !event.open && onClose()} size="lg" placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
                <Dialog.Positioner>
                    <Dialog.Content
                        bg={cardBg}
                        borderColor={modalBorder}
                        borderWidth="1px"
                        borderRadius="2xl"
                        overflow="hidden"
                        maxW="600px"
                        w="calc(100% - 32px)"
                    >
                        <Box position="absolute" top="0" left="0" right="0" h="4px" bgGradient={`linear(to-r, ${accentColor}, yellow.300)`} />
                        <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                            <HStack gap={3}>
                                <Box p={3} borderRadius="xl" bg={isDark ? 'rgb(var(--accent-400) / .1)' : 'rgb(var(--accent-50))'} color={accentColor}>
                                    <ReceiptText size={24} />
                                </Box>
                                <span>{isEdit ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</span>
                            </HStack>
                        </Dialog.Header>
                        <Dialog.CloseTrigger asChild>
                            <Button variant="ghost" color={subtitleColor} size="sm" w="32px" h="32px" p={0} minW={0} position="absolute" top="3" right="3" aria-label="Yopish"><X /></Button>
                        </Dialog.CloseTrigger>
                        <Dialog.Body py={6}>
                            <VStack gap={5} align="stretch">
                                <Field.Root required>
                                    <Field.Label color={textColor}>
                                        <HStack gap={2}><LuTag size={16} /><span>Xarajat nomi</span></HStack>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <FormControl value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Masalan, Ijara to‘lovi" maxLength={255} />
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label color={textColor}>
                                        <HStack gap={2}><LuLayers size={16} /><span>Xarajat kategoriyasi</span></HStack>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <FormControl as="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={categoriesLoading || categoriesError || categories.length === 0}>
                                        <option value="">
                                            {categoriesLoading ? 'Kategoriyalar yuklanmoqda...' : categoriesError ? 'Kategoriyalarni yuklashda xatolik' : categories.length === 0 ? 'Avval kategoriya qo‘shing' : 'Kategoriyani tanlang'}
                                        </option>
                                        {categoryId && !categories.some((category) => category.id === categoryId) && (
                                            <option value={categoryId}>{expense?.category?.name || 'Mavjud xarajat kategoriyasi'}</option>
                                        )}
                                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                    </FormControl>
                                    {!categoriesLoading && !categoriesError && categories.length === 0 && (
                                        <Text fontSize="xs" color={subtitleColor}>Xarajat kiritishdan oldin kategoriyalar bo‘limida kategoriya qo‘shing.</Text>
                                    )}
                                </Field.Root>
                                <Field.Root required>
                                    <Field.Label color={textColor}>
                                        <HStack gap={2}><LuWallet size={16} /><span>Kassa</span></HStack>
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    {isEdit
                                        ? <Box px={4} py={3} borderWidth="1px" borderColor={modalBorder} borderRadius="xl" color={textColor}>{expense.cashboxName}</Box>
                                        : (
                                            <FormControl as="select" value={cashboxId} onChange={(e) => setCashboxId(e.target.value)}>
                                                <option value="">Kassani tanlang</option>
                                                {cashboxes.map((cashbox) => <option key={cashbox.id} value={cashbox.id}>{cashbox.name}</option>)}
                                            </FormControl>
                                        )}
                                    {isEdit && <Text fontSize="xs" color={subtitleColor} mt={1}>Xarajat kassasini o‘zgartirib bo‘lmaydi.</Text>}
                                </Field.Root>
                                <CurrencyAmountField value={money} onChange={setMoney} disabled={isLoading} />
                                <HStack align="end" gap={4} flexWrap="wrap" flexDirection={{ base: 'column', sm: 'row' }}>
                                    <Field.Root required flex="1" w="100%" minW="180px">
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuCalendarDays size={16} /><span>Sana</span></HStack>
                                            <Field.RequiredIndicator />
                                        </Field.Label>
                                        <FormControl type="date" value={expenseDate} max={today()} onChange={(e) => setExpenseDate(e.target.value)} />
                                    </Field.Root>
                                    <Field.Root required w={{ base: '100%', sm: '160px' }}>
                                        <Field.Label color={textColor}>
                                            <HStack gap={2}><LuClock3 size={16} /><span>Vaqt</span></HStack>
                                            <Field.RequiredIndicator />
                                        </Field.Label>
                                        <FormControl type="time" value={expenseTime} step={60} onChange={(e) => setExpenseTime(e.target.value)} />
                                    </Field.Root>
                                    <Button type="button" variant="outline" borderRadius="xl" h="50px" px={4} color={subtitleColor} flexShrink={0} onClick={() => { setExpenseDate(today()); setExpenseTime(nowTime()); }}>
                                        Hozir
                                    </Button>
                                </HStack>
                                <Field.Root>
                                    <Field.Label color={textColor}>
                                        <HStack gap={2}><LuStickyNote size={16} /><span>Izoh (ixtiyoriy)</span></HStack>
                                    </Field.Label>
                                    <FormControl as="textarea" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} placeholder="Xarajat haqida izoh" />
                                </Field.Root>
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                            <Button variant="ghost" onClick={onClose} color={subtitleColor} borderRadius="xl" h="44px" px={5}>Bekor qilish</Button>
                            <Button onClick={save} disabled={isLoading} bg={accentColor} color="black" borderRadius="xl" h="44px" px={8} fontWeight="semibold" _hover={{ bg: 'rgb(var(--accent-500))' }}>
                                {isLoading
                                    ? <HStack><Spinner size="sm" /><span>Saqlanmoqda...</span></HStack>
                                    : <HStack><Check size={18} /><span>Saqlash</span></HStack>}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

ExpenseForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    cashboxes: PropTypes.array.isRequired,
    expense: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
};
