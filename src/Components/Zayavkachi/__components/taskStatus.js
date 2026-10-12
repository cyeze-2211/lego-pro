export const TASK_STATUS_LABEL = {
    SENT:     'Yuborildi',
    ACCEPTED: 'Qabul qilindi',
};

export const taskStatusCx = (status) => {
    if (status === 'ACCEPTED') return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
    return 'bg-yellow-400/10 text-yellow-500 border-yellow-400/30';
};
