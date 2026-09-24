// Stanokchi/Machines/index.jsx — mode-aware wrapper
import { useStanokchiMode } from '../../../context/StanokchiModeContext';
import HeadMachines from './HeadMachines';
import WorkerMachines from '../Worker/WorkerMachines';

export default function StanokchiMachines() {
    const { mode } = useStanokchiMode();
    return mode === 'worker' ? <WorkerMachines /> : <HeadMachines />;
}
