import PropTypes from 'prop-types';
import { Button, HStack, useDisclosure } from '@chakra-ui/react';
import { LuPen } from 'react-icons/lu';
import { useGetExpenseByIdQuery, useUpdateExpenseMutation } from '../../../../store/services/expense.api';
import { useAppTheme } from '../../../../theme/tokens';
import { Alert } from '../../../Other/UI/Alert/Alert';
import ExpenseForm from './ExpenseForm';

export default function Edit({ expense, label }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [updateExpense, { isLoading }] = useUpdateExpenseMutation();
    // Oyna ochilganda xarajatni serverdan to‘liq olamiz — kategoriya, valyuta, kurs va sana aniq kelsin
    const { data: expenseDetail } = useGetExpenseByIdQuery(expense.id, { skip: !open });
    const { isDark, accentColor } = useAppTheme();
    const accentSoft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';

    const save = async (data) => {
        try {
            await updateExpense({ id: expense.id, data }).unwrap();
            Alert('Xarajat yangilandi', 'success');
            onClose();
        } catch (error) {
            Alert(error?.data?.message || 'Xarajatni yangilashda xatolik', 'error');
        }
    };

    return (
        <>
            {label ? (
                <Button variant="outline" borderRadius="xl" h="42px" px={4} color={accentColor} borderColor={isDark ? 'rgb(var(--accent-400) / .4)' : 'rgb(var(--accent-warm-200))'} _hover={{ bg: accentSoft }} onClick={onOpen}>
                    <HStack gap={2}><LuPen size={16} /><span>{label}</span></HStack>
                </Button>
            ) : (
                <Button onClick={onOpen} variant="ghost" size="sm" w="34px" h="34px" p={0} minW={0} borderRadius="lg" color={accentColor} aria-label="Tahrirlash" _hover={{ bg: accentSoft }}>
                    <LuPen size={16} />
                </Button>
            )}
            <ExpenseForm open={open} onClose={onClose} cashboxes={[]} expense={expenseDetail ?? expense} onSubmit={save} isLoading={isLoading} />
        </>
    );
}

Edit.propTypes = { expense: PropTypes.object.isRequired, label: PropTypes.string };
