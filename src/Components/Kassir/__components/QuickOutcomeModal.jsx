import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Field, HStack, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { LuArrowUpRight, LuCalendarDays, LuClock3, LuLayers, LuReceiptText, LuStickyNote, LuTag, LuTruck } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetCashboxesQuery } from '../../../store/services/cashbox.api';
import { useGetExpenseCategoriesQuery } from '../../../store/services/expenseCategory.api';
import { useGetSuppliersQuery } from '../../../store/services/supplier.api';
import { useCreateExpenseMutation } from '../../../store/services/expense.api';
import { useCreateSupplierPaymentMutation } from '../../../store/services/supplierPayment.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import CurrencyAmountField from '../../ui/CurrencyAmountField';
import { buildCurrencyPayload, currencyUzsAmount, emptyCurrencyValue, validateCurrencyValue } from '../../ui/currency';
import { formatNumber } from '../../ui/number-format';
import { nowTime, todayIso } from '../../ui/date-format';
import EntityPicker from './EntityPicker';
import { BalanceNote, CashboxSelect, ModeSwitch, QuickDialog } from './QuickCashShared';
import { rememberCashbox, useDebounced, useQuickCashbox } from './quickCash';

const MODES = [
    { key: 'expense', label: 'Xarajat', icon: LuReceiptText, color: '#EF4444' },
    { key: 'supplier', label: 'Yetkazib beruvchiga', icon: LuTruck, color: '#EF4444' },
];
const MODE_KEY = 'kassir_quick_outcome_mode';
const loadMode = () => { try { const m = localStorage.getItem(MODE_KEY); return MODES.some((x) => x.key === m) ? m : 'expense'; } catch { return 'expense'; } };

/** Chiqim — xarajat (POST /expenses) yoki yetkazib beruvchiga to‘lov (POST /supplier-payments) */
export default function QuickOutcomeModal({ open, onClose }) {
    const { textColor, subtitleColor } = useAppTheme();
    const [mode, setMode] = useState(loadMode);

    // umumiy
    const [money, setMoney] = useState(emptyCurrencyValue);
    const [date, setDate] = useState(todayIso());
    const [summary, setSummary] = useState('');
    // xarajat
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [time, setTime] = useState(nowTime());
    // yetkazib beruvchi
    const [supplier, setSupplier] = useState(null);
    const [search, setSearch] = useState('');

    const isExpense = mode === 'expense';
    const query = useDebounced(search.trim());

    const { data: cashboxes = [], isLoading: cashboxesLoading, isError: cashboxesError } = useGetCashboxesQuery(undefined, { skip: !open });
    const { data: categoryResult, isLoading: categoriesLoading, isError: categoriesError } = useGetExpenseCategoriesQuery({ page: 0, size: 200 }, { skip: !open || !isExpense });
    const { data: supplierResult, isFetching: suppliersLoading, isError: suppliersError } = useGetSuppliersQuery(
        { name: query || undefined, page: 0, size: 20, sort: ['name,ASC'] },
        { skip: !open || isExpense },
    );
    const categories = categoryResult?.items ?? [];
    const suppliers = supplierResult?.items ?? [];
    const [cashboxId, setCashboxId] = useQuickCashbox(open, cashboxes);
    const [createExpense, { isLoading: savingExpense }] = useCreateExpenseMutation();
    const [createSupplierPayment, { isLoading: savingSupplier }] = useCreateSupplierPaymentMutation();
    const isSaving = savingExpense || savingSupplier;

    useEffect(() => {
        if (open) {
            setMode(loadMode());
            setMoney(emptyCurrencyValue());
            setDate(todayIso());
            setTime(nowTime());
            setSummary('');
            setName('');
            setCategoryId('');
            setSupplier(null);
            setSearch('');
        }
    }, [open]);

    const changeMode = (next) => {
        setMode(next);
        try { localStorage.setItem(MODE_KEY, next); } catch { /* xotira yo‘q */ }
    };

    const amount = currencyUzsAmount(money);
    const today = todayIso();

    const submit = async (event) => {
        event.preventDefault();
        if (isSaving) return;
        const note = summary.trim();
        if (note.length > 500) return Alert('Izoh 500 belgidan oshmasligi kerak', 'error');
        if (!cashboxId) return Alert('Kassani tanlang', 'error');
        const moneyError = validateCurrencyValue(money);
        if (moneyError) return Alert(moneyError, 'error');
        if (!date || date > today) return Alert('Sana bugun yoki undan oldingi kun bo‘lishi kerak', 'error');

        try {
            if (isExpense) {
                const trimmedName = name.trim();
                if (!trimmedName) return Alert('Xarajat nomini kiriting', 'error');
                if (trimmedName.length > 255) return Alert('Xarajat nomi 255 belgidan oshmasligi kerak', 'error');
                if (!categoryId) return Alert('Xarajat kategoriyasini tanlang', 'error');
                if (!/^\d{2}:\d{2}$/.test(time)) return Alert('Xarajat vaqtini kiriting', 'error');
                if (date === today && time > nowTime()) return Alert('Xarajat vaqti hozirgi vaqtdan keyin bo‘lmasligi kerak', 'error');
                // expenseTime faqat UI uchun — expense.api uni yubormaydi
                await createExpense({
                    name: trimmedName,
                    summary: note || null,
                    ...buildCurrencyPayload(money),
                    categoryId,
                    cashboxId,
                    expenseDate: date,
                    expenseTime: time,
                }).unwrap();
                Alert(`Chiqim: ${formatNumber(amount)} so‘m — ${trimmedName}`, 'success');
            } else {
                if (!supplier) return Alert('Yetkazib beruvchini tanlang', 'error');
                await createSupplierPayment({
                    supplierId: supplier.id,
                    cashboxId,
                    ...buildCurrencyPayload(money),
                    paidAt: date,
                    ...(note ? { summary: note } : {}),
                }).unwrap();
                Alert(`Chiqim: ${formatNumber(amount)} so‘m — ${supplier.name}`, 'success');
            }
            rememberCashbox(cashboxId);
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Chiqimni saqlashda xatolik', 'error');
        }
    };

    return (
        <QuickDialog
            open={open}
            onClose={onClose}
            tone="out"
            icon={LuArrowUpRight}
            title="Chiqim"
            subtitle={isExpense ? 'Kassadan xarajat chiqarish' : 'Yetkazib beruvchiga pul berish'}
            formId="kassir-quick-outcome"
            onSubmit={submit}
            isSaving={isSaving}
            submitLabel={<HStack gap={2}><Check size={18} /><span>Chiqimni saqlash</span></HStack>}
        >
            <ModeSwitch value={mode} onChange={changeMode} options={MODES} disabled={isSaving} />

            {isExpense ? (
                <>
                    <Field.Root required>
                        <Field.Label color={textColor}>
                            <HStack gap={2}><LuTag size={16} /><span>Xarajat nomi</span></HStack>
                            <Field.RequiredIndicator />
                        </Field.Label>
                        <FormControl value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="Masalan, Ijara to‘lovi" maxLength={255} disabled={isSaving} />
                    </Field.Root>
                    <Field.Root required>
                        <Field.Label color={textColor}>
                            <HStack gap={2}><LuLayers size={16} /><span>Xarajat kategoriyasi</span></HStack>
                            <Field.RequiredIndicator />
                        </Field.Label>
                        <FormControl as="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={isSaving || categoriesLoading || categoriesError || categories.length === 0}>
                            <option value="">
                                {categoriesLoading ? 'Kategoriyalar yuklanmoqda...' : categoriesError ? 'Kategoriyalarni yuklashda xatolik' : categories.length === 0 ? 'Avval kategoriya qo‘shing' : 'Kategoriyani tanlang'}
                            </option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </FormControl>
                        {!categoriesLoading && !categoriesError && categories.length === 0 && (
                            <Text fontSize="xs" color={subtitleColor}>Xarajat kiritishdan oldin «Xarajat kategoriyalari» bo‘limida kategoriya qo‘shing.</Text>
                        )}
                    </Field.Root>
                </>
            ) : (
                <EntityPicker
                    label="Yetkazib beruvchi"
                    icon={LuTruck}
                    value={supplier}
                    onChange={setSupplier}
                    items={suppliers}
                    isLoading={suppliersLoading}
                    isError={suppliersError}
                    search={search}
                    onSearchChange={setSearch}
                    placeholder="Yetkazib beruvchi nomini yozing..."
                    emptyText="Bunday yetkazib beruvchi topilmadi"
                    autoFocus
                    disabled={isSaving}
                    renderMeta={(item) => <BalanceNote balance={item.balance} positiveLabel="Avans" negativeLabel="Bizning qarzimiz" />}
                />
            )}

            <CashboxSelect value={cashboxId} onChange={setCashboxId} cashboxes={cashboxes} isLoading={cashboxesLoading} isError={cashboxesError} amount={amount} outgoing disabled={isSaving} />

            <CurrencyAmountField value={money} onChange={setMoney} disabled={isSaving} />

            <HStack align="end" gap={4} flexWrap="wrap" flexDirection={{ base: 'column', sm: 'row' }}>
                <Field.Root required flex="1" w="100%" minW="180px">
                    <Field.Label color={textColor}>
                        <HStack gap={2}><LuCalendarDays size={16} /><span>Sana</span></HStack>
                        <Field.RequiredIndicator />
                    </Field.Label>
                    <FormControl type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} disabled={isSaving} />
                </Field.Root>
                {isExpense && (
                    <>
                        <Field.Root required w={{ base: '100%', sm: '150px' }}>
                            <Field.Label color={textColor}>
                                <HStack gap={2}><LuClock3 size={16} /><span>Vaqt</span></HStack>
                                <Field.RequiredIndicator />
                            </Field.Label>
                            <FormControl type="time" value={time} step={60} onChange={(event) => setTime(event.target.value)} disabled={isSaving} />
                        </Field.Root>
                        <Button type="button" variant="outline" borderRadius="xl" h="50px" px={4} color={subtitleColor} flexShrink={0} onClick={() => { setDate(today); setTime(nowTime()); }} disabled={isSaving}>
                            Hozir
                        </Button>
                    </>
                )}
            </HStack>

            <Field.Root>
                <Field.Label color={textColor}>
                    <HStack gap={2}><LuStickyNote size={16} /><span>Izoh (ixtiyoriy)</span></HStack>
                </Field.Label>
                <FormControl as="textarea" rows={2} value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={500} placeholder={isExpense ? 'Xarajat haqida izoh' : 'To‘lov haqida izoh'} disabled={isSaving} />
            </Field.Root>
        </QuickDialog>
    );
}

QuickOutcomeModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
