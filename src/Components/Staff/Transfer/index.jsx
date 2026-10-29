import StockTransactionForm from '../__components/StockTransactionForm';

/** Omborlar o‘rtasida mahsulot ko‘chirish — POST /product-stock-transfers (omborchi, admin, hisobchi). */
export default function StaffTransfer() {
    return <StockTransactionForm action="TRANSFER" />;
}
