import { useNavigate, useParams } from 'react-router-dom';
import { LuArrowLeft, LuCircleAlert } from 'react-icons/lu';
import { useGetSalesOrderByIdQuery } from '../../../store/services/salesOrder.api';
import Loading from '../../Other/UI/Loadings/Loading';
import OrderForm from '../__components/OrderForm';

export default function ZayavkachiOrderEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: order, isLoading, isError } = useGetSalesOrderByIdQuery(id, { skip: !id });

    const backToList = () => navigate('/zayavkachi/orders');

    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Buyurtmani yuklashda xatolik</p>
                <button type="button" onClick={backToList}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Buyurtmalar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    return <OrderForm order={order} onCancel={backToList} onSaved={backToList} />;
}
