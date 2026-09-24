// Stanokchi/MachineDetail/index.jsx — mode-aware wrapper
import { useStanokchiMode } from '../../../context/StanokchiModeContext';
import HeadMachineDetail from './HeadMachineDetail';
import WorkerMachineDetail from '../Worker/WorkerMachineDetail';

export default function StanokchiMachineDetail() {
    const { mode } = useStanokchiMode();
    return mode === 'worker' ? <WorkerMachineDetail /> : <HeadMachineDetail />;
}
