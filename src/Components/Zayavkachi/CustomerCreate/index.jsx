import { useNavigate, useLocation } from 'react-router-dom';
import CustomerCreateModal from '../../Common/Customer/__components/Create';

export default function ZayavkachiCustomerCreate() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '/zayavkachi';
    const backToList = () => navigate(`${base}/customers`);

    return (
        <CustomerCreateModal
            openOnMount
            hideTrigger
            onCreated={backToList}
            onClosed={backToList}
        />
    );
}
