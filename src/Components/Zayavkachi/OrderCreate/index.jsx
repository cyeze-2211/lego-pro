import { useNavigate } from 'react-router-dom';
import OrderForm from '../__components/OrderForm';

export default function ZayavkachiOrderCreate() {
    const navigate = useNavigate();
    const backToList = () => navigate('/zayavkachi/orders');

    return <OrderForm order={null} onCancel={backToList} onSaved={backToList} />;
}
