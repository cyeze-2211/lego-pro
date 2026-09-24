import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LuArrowLeft, LuCircleAlert } from 'react-icons/lu';
import { useGetCustomerByIdQuery } from '../../../store/services/customer.api';
import Loading from '../../Other/UI/Loadings/Loading';
import CustomerForm from '../__components/CustomerForm';

export default function ZayavkachiCustomerEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '/zayavkachi';
    const { data: customer, isLoading, isError } = useGetCustomerByIdQuery(id, { skip: !id });

    const backToDetail = () => navigate(`${base}/customers/${id}`);

    if (isLoading) {
        return <div className="flex min-h-[60vh] items-center justify-center"><Loading /></div>;
    }

    if (isError || !customer) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-[#f43f5e]">
                <LuCircleAlert size={34} />
                <p className="text-lg">Mijozni yuklashda xatolik</p>
                <button type="button" onClick={() => navigate(`${base}/customers`)}
                    className="flex h-12 items-center gap-2 rounded-xl border border-[#f43f5e]/30 px-5 text-sm font-bold">
                    <LuArrowLeft size={16} /> Mijozlar ro&apos;yxatiga qaytish
                </button>
            </div>
        );
    }

    return <CustomerForm customer={customer} onCancel={backToDetail} onSaved={backToDetail} />;
}
