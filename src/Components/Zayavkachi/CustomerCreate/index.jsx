import { useNavigate } from 'react-router-dom';
import CustomerForm from '../__components/CustomerForm';

export default function ZayavkachiCustomerCreate() {
    const navigate = useNavigate();
    const backToList = () => navigate('/zayavkachi/customers');

    return <CustomerForm customer={null} onCancel={backToList} onSaved={backToList} />;
}
