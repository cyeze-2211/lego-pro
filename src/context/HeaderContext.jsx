import { createContext, useContext, useState, useCallback } from 'react';

const HeaderContext = createContext(null);

/**
 * Sahifa komponentidan AdminHeader ga sarlavha va back button uzatish uchun context.
 *
 * Ishlatish:
 *   const { setPageHeader } = useHeaderContext();
 *   useEffect(() => {
 *     setPageHeader({ title: 'Retsept nomi', backTo: '/mixer' });
 *     return () => setPageHeader(null);
 *   }, [recipe?.name]);
 */
export function HeaderProvider({ children }) {
    const [pageHeader, setPageHeaderState] = useState(null);

    const setPageHeader = useCallback((value) => {
        setPageHeaderState(value);
    }, []);

    return (
        <HeaderContext.Provider value={{ pageHeader, setPageHeader }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeaderContext() {
    const ctx = useContext(HeaderContext);
    if (!ctx) throw new Error('useHeaderContext must be used inside HeaderProvider');
    return ctx;
}
