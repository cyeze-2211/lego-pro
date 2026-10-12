import { useLayoutEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { setPreferencesUser } from './preferences';

/**
 * Login/logout bo‘lganda joriy foydalanuvchining interfeys sozlamalarini yuklaydi.
 * useLayoutEffect — yangi sahifa avvalgi foydalanuvchi ranglari bilan chizilmasligi uchun.
 */
export default function PreferencesSync() {
    const userId = useAppSelector((state) => state.auth.userId);

    useLayoutEffect(() => {
        setPreferencesUser(userId);
    }, [userId]);

    return null;
}
