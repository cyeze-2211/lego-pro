import { useEffect, useState, useSyncExternalStore } from 'react';
import PropTypes from 'prop-types';
import { Box, Image } from '@chakra-ui/react';
import { LuPackage } from 'react-icons/lu';
import { getImageBust, loadAuthImage, subscribeImageBust } from './auth-image';
import { useAppTheme } from '../../theme/tokens';

/**
 * Himoyalangan (token talab qiladigan) mahsulot rasmi.
 * imageUrl bo‘lmasa yoki yuklanmasa — paket ikonkali o‘rinbosar.
 */
export default function ProductImage({ imageUrl, version, name = '', size = 40, radius = 'lg', iconSize, fit = 'cover', ...props }) {
    const { isDark, accentColor } = useAppTheme();
    const [src, setSrc] = useState(null);
    const [failed, setFailed] = useState(false);
    const bust = useSyncExternalStore(subscribeImageBust, () => getImageBust(imageUrl));

    useEffect(() => {
        let active = true;
        setFailed(false);
        if (!imageUrl) { setSrc(null); return undefined; }
        loadAuthImage(imageUrl, version)
            .then((url) => { if (active) setSrc(url); })
            .catch(() => { if (active) { setSrc(null); setFailed(true); } });
        return () => { active = false; };
    }, [imageUrl, version, bust]);

    const px = typeof size === 'number' ? `${size}px` : size;
    const placeholderBg = isDark ? 'rgb(var(--accent-400) / 0.10)' : 'rgb(var(--accent-warm-100))';

    return (
        <Box
            w={px}
            h={px}
            minW={px}
            borderRadius={radius}
            overflow="hidden"
            bg={src ? (isDark ? 'whiteAlpha.100' : 'gray.100') : placeholderBg}
            borderWidth="1px"
            borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.100'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color={accentColor}
            flexShrink={0}
            {...props}
        >
            {src && !failed
                ? <Image src={src} alt={name} w="100%" h="100%" objectFit={fit} onError={() => setFailed(true)} />
                : <LuPackage size={iconSize || Math.max(14, Math.round((typeof size === 'number' ? size : 40) * 0.4))} />}
        </Box>
    );
}

ProductImage.propTypes = {
    imageUrl: PropTypes.string,
    version: PropTypes.string,
    name: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    radius: PropTypes.string,
    iconSize: PropTypes.number,
    fit: PropTypes.string,
};
