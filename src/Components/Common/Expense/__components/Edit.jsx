import PropTypes from 'prop-types';
import { Button, useDisclosure } from '@chakra-ui/react';
import { LuPen } from 'react-icons/lu';
import { useUpdateExpenseMutation } from '../../../../store/services/expense.api';
import { useAppTheme } from '../../../../theme/tokens';
import { Alert } from '../../../Other/UI/Alert/Alert';
import ExpenseForm from './ExpenseForm';

export default function Edit({ expense }) {
    const { open, onOpen, onClose } = useDisclosure(); const [updateExpense, { isLoading }] = useUpdateExpenseMutation(); const { accentColor } = useAppTheme();
    const save = async (data) => { try { await updateExpense({ id: expense.id, data }).unwrap(); Alert('Xarajat yangilandi', 'success'); onClose(); } catch (error) { Alert(error?.data?.message || 'Xarajatni yangilashda xatolik', 'error'); } };
    return <><Button onClick={onOpen} variant="ghost" size="sm" color={accentColor} aria-label="Tahrirlash"><LuPen size={16}/></Button><ExpenseForm open={open} onClose={onClose} cashboxes={[]} expense={expense} onSubmit={save} isLoading={isLoading}/></>;
}
Edit.propTypes = { expense: PropTypes.object.isRequired };
