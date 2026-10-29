/** Stanokchi (operator) obyektidan ko‘rsatiladigan nomni olish. */
export const operatorLabel = (operator) => operator?.username || operator?.fullName || operator?.name || operatorId(operator) || '—';

/** Backend kategoriya javobida operator { userId, username } ko‘rinishida keladi; foydalanuvchi ro‘yxatida esa { id, username }. */
export const operatorId = (operator) => operator?.userId ?? operator?.id ?? null;
