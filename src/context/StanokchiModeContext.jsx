// context/StanokchiModeContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'stanokchi_mode';

const StanokchiModeContext = createContext(null);

export function StanokchiModeProvider({ children }) {
    const [mode, setMode] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || 'head';
    });

    const switchToWorker = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, 'worker');
        setMode('worker');
    }, []);

    const switchToHead = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, 'head');
        setMode('head');
    }, []);

    // Called on logout — reset to head so next login starts fresh
    const resetMode = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setMode('head');
    }, []);

    return (
        <StanokchiModeContext.Provider value={{ mode, switchToWorker, switchToHead, resetMode }}>
            {children}
        </StanokchiModeContext.Provider>
    );
}

export function useStanokchiMode() {
    const ctx = useContext(StanokchiModeContext);
    if (!ctx) throw new Error('useStanokchiMode must be used inside StanokchiModeProvider');
    return ctx;
}
