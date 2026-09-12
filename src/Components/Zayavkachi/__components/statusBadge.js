export const STATUS_LABEL = {
    PENDING:  'Kutilmoqda',
    APPROVED: 'Tasdiqlangan',
    REJECTED: 'Rad etilgan',
};

export const statusCx = (status) => {
    if (status === 'APPROVED') return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
    if (status === 'REJECTED') return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20';
    return 'bg-[#FACC15]/10 text-[#EAB308] border-[#FACC15]/30';
};
