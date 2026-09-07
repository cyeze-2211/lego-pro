import PropTypes from 'prop-types';
import { Button, HStack, useDisclosure } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useCreateExpenseMutation } from '../../../../store/services/expense.api';
import { useAppTheme } from '../../../../theme/tokens';
import { Alert } from '../../../Other/UI/Alert/Alert';
import ExpenseForm from './ExpenseForm';

export default function Create({ cashboxes }) {
    const { open, onOpen, onClose } = useDisclosure();
    const [createExpense, { isLoading }] = useCreateExpenseMutation();
    const { accentColor, isDark } = useAppTheme();
    const save = async (data) => { try { await createExpense(data).unwrap(); Alert('Xarajat muvaffaqiyatli yaratildi', 'success'); onClose(); } catch (error) { Alert(error?.data?.message || 'Xarajat yaratishda xatolik', 'error'); } };
    return <><Button onClick={onOpen} bg={accentColor} color="black" borderRadius="xl" px={4} py={4} _hover={{ bg: isDark ? 'yellow.300' : 'yellow.500' }}><HStack gap={2}><LuPlus size={20}/><span>Xarajat qo‘shish</span></HStack></Button><ExpenseForm open={open} onClose={onClose} cashboxes={cashboxes} onSubmit={save} isLoading={isLoading}/></>;
}
Create.propTypes = { cashboxes: PropTypes.array.isRequired };
