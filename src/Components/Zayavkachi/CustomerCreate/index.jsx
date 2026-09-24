import { useNavigate, useLocation } from 'react-router-dom';
import CustomerForm from '../__components/CustomerForm';

export default function ZayavkachiCustomerCreate() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '/zayavkachi';
    const backToList = () => navigate(`${base}/customers`);

    return <CustomerForm customer={null} onCancel={backToList} onSaved={backToList} />;
}
