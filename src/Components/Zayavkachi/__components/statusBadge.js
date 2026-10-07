// ../__components/statusBadge.js

export const STATUS_LABEL = {
    CREATED:    'Yaratilgan',
    LOADED:     'Ortildi',
    CONFIRMED:  'Tasdiqlangan',
    REJECTED:   'Rad etilgan',
};

export const statusCx = (status) => {
    switch (status) {
        case 'CREATED':
            return 'bg-[#94a3b8]/10 text-[#94a3b8] border-[#94a3b8]/30';
        case 'LOADED':
            return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30';
        case 'CONFIRMED':
            return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
        case 'REJECTED':
            return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20';
        default:
            return 'bg-[#94a3b8]/10 text-[#94a3b8] border-[#94a3b8]/30';
    }
};

// Ruxsat etilgan status o'tishlari (state machine)
export const NEXT_STATUS = {
    CREATED:    ['LOADED', 'REJECTED'],
    LOADED:     ['CONFIRMED'],
    CONFIRMED:  [],
    REJECTED:   [],
};

// Yakuniy (o'zgartirib bo'lmaydigan) statuslar
export const FINAL_STATUSES = ['CONFIRMED', 'REJECTED'];