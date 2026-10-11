import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Field, HStack } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { LuArrowDownLeft, LuCalendarDays, LuStickyNote, LuUserRound } from 'react-icons/lu';
import { useAppTheme } from '../../../theme/tokens';
import { useGetCashboxesQuery } from '../../../store/services/cashbox.api';
import { useGetCustomersQuery } from '../../../store/services/customer.api';
import { useCreatePaymentMutation } from '../../../store/services/payment.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import FormControl from '../../ui/FormControl';
import CurrencyAmountField from '../../ui/CurrencyAmountField';
import { buildCurrencyPayload, currencyUzsAmount, emptyCurrencyValue, validateCurrencyValue } from '../../ui/currency';
import { formatNumber } from '../../ui/number-format';
import { todayIso } from '../../ui/date-format';
import EntityPicker from './EntityPicker';
import { BalanceNote, CashboxSelect, QuickDialog } from './QuickCashShared';
import { rememberCashbox, useDebounced, useQuickCashbox } from './quickCash';

/** Kirim — mijozdan to‘lov qabul qilish (POST /payments) */
export default function QuickIncomeModal({ open, onClose }) {
    const { textColor } = useAppTheme();
    const [customer, setCustomer] = useState(null);
    const [search, setSearch] = useState('');
    const [money, setMoney] = useState(emptyCurrencyValue);
    const [paidAt, setPaidAt] = useState(todayIso());
    const [summary, setSummary] = useState('');

    const query = useDebounced(search.trim());
    const { data: cashboxes = [], isLoading: cashboxesLoading, isError: cashboxesError } = useGetCashboxesQuery(undefined, { skip: !open });
    const { data: customerResult, isFetching: customersLoading, isError: customersError } = useGetCustomersQuery(
        { name: query || undefined, page: 0, size: 20, sort: ['name,ASC'] },
        { skip: !open },
    );
    const customers = customerResult?.items ?? [];
    const [cashboxId, setCashboxId] = useQuickCashbox(open, cashboxes);
    const [createPayment, { isLoading }] = useCreatePaymentMutation();

    useEffect(() => {
        if (open) {
            setCustomer(null);
            setSearch('');
            setMoney(emptyCurrencyValue());
            setPaidAt(todayIso());
            setSummary('');
        }
    }, [open]);

    const amount = currencyUzsAmount(money);

    const submit = async (event) => {
        event.preventDefault();
        if (isLoading) return;
        if (!customer) return Alert('Mijozni tanlang', 'error');
        if (!cashboxId) return Alert('Kassani tanlang', 'error');
        const moneyError = validateCurrencyValue(money);
        if (moneyError) return Alert(moneyError, 'error');
        if (!paidAt || paidAt > todayIso()) return Alert('Sana bugun yoki undan oldingi kun bo‘lishi kerak', 'error');
        const note = summary.trim();
        if (note.length > 500) return Alert('Izoh 500 belgidan oshmasligi kerak', 'error');

        try {
            await createPayment({
                customerId: customer.id,
                cashboxId,
                ...buildCurrencyPayload(money),
                paidAt,
                ...(note ? { summary: note } : {}),
            }).unwrap();
            rememberCashbox(cashboxId);
            Alert(`Kirim: ${formatNumber(amount)} so‘m — ${customer.name}`, 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Kirimni saqlashda xatolik', 'error');
        }
    };

    return (
        <QuickDialog
            open={open}
            onClose={onClose}
            tone="in"
            icon={LuArrowDownLeft}
            title="Kirim"
            subtitle="Mijozdan pul qabul qilish"
            formId="kassir-quick-income"
            onSubmit={submit}
            isSaving={isLoading}
            submitLabel={<HStack gap={2}><Check size={18} /><span>Kirimni saqlash</span></HStack>}
        >
            <EntityPicker
                label="Mijoz"
                icon={LuUserRound}
                value={customer}
                onChange={setCustomer}
                items={customers}
                isLoading={customersLoading}
                isError={customersError}
                search={search}
                onSearchChange={setSearch}
                placeholder="Mijoz nomi yoki telefonini yozing..."
                emptyText="Bunday mijoz topilmadi"
                autoFocus
                disabled={isLoading}
                renderMeta={(item) => <BalanceNote balance={item.balance} positiveLabel="Avans" negativeLabel="Qarz" />}
            />

            <CashboxSelect value={cashboxId} onChange={setCashboxId} cashboxes={cashboxes} isLoading={cashboxesLoading} isError={cashboxesError} disabled={isLoading} />

            <CurrencyAmountField value={money} onChange={setMoney} disabled={isLoading} />

            <Field.Root required>
                <Field.Label color={textColor}>
                    <HStack gap={2}><LuCalendarDays size={16} /><span>Sana</span></HStack>
                    <Field.RequiredIndicator />
                </Field.Label>
                <FormControl type="date" value={paidAt} max={todayIso()} onChange={(event) => setPaidAt(event.target.value)} disabled={isLoading} />
            </Field.Root>

            <Field.Root>
                <Field.Label color={textColor}>
                    <HStack gap={2}><LuStickyNote size={16} /><span>Izoh (ixtiyoriy)</span></HStack>
                </Field.Label>
                <FormControl as="textarea" rows={2} value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={500} placeholder="Masalan: naqd, karta orqali..." disabled={isLoading} />
            </Field.Root>
        </QuickDialog>
    );
}

QuickIncomeModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
