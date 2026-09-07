import ReactLoading from 'react-loading';
import { useAppTheme } from '../../../../theme/tokens';

export default function Loading() {
    const { accentColor } = useAppTheme();

    return (
        <div className="flex items-center justify-center h-[500px]">
            <ReactLoading type="spinningBubbles" color={accentColor} height={80} width={80} />
        </div>
    );
}
