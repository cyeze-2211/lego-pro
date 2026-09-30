// Stanokchi/MachineDetail/index.jsx — mode-aware wrapper
import { useStanokchiMode } from '../../../context/StanokchiModeContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import HeadMachineDetail from './HeadMachineDetail';

export default function StanokchiMachineDetail() {
    const { mode } = useStanokchiMode();
    const navigate = useNavigate();

    useEffect(() => {
        // Worker mode bo'lsa detail pagega kirish mumkin emas
        if (mode === 'worker') {
            navigate('/stanokchi', { replace: true });
        }
    }, [mode, navigate]);

    // Faqat head mode da detail ko'rsatamiz
    return mode === 'head' ? <HeadMachineDetail /> : null;
}
