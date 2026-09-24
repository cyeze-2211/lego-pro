// app/layout/StanokchiLayout.jsx
import { StanokchiModeProvider, useStanokchiMode } from "../../context/StanokchiModeContext";
import HeadStanokchiLayout from "./HeadStanokchiLayout";
import WorkerStanokchiLayout from "./WorkerStanokchiLayout";

function StanokchiLayoutInner() {
    const { mode } = useStanokchiMode();
    return mode === 'worker' ? <WorkerStanokchiLayout /> : <HeadStanokchiLayout />;
}

export default function StanokchiLayout() {
    return (
        <StanokchiModeProvider>
            <StanokchiLayoutInner />
        </StanokchiModeProvider>
    );
}
