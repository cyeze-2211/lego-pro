import PropTypes from 'prop-types';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useAppTheme } from '../../theme/tokens';
import { isLightHex, isValidHex } from './color-utils';

/** Rang doirachasi. code bo‘lmasa — chiziqli bo‘sh doira. */
export function ColorDot({ code, size = 18, ...props }) {
    const { isDark } = useAppTheme();
    const valid = isValidHex(code);
    const light = valid && isLightHex(code);
    return (
        <Box
            w={`${size}px`}
            h={`${size}px`}
            minW={`${size}px`}
            borderRadius="full"
            bg={valid ? code : 'transparent'}
            borderWidth={valid ? (light ? '1.5px' : '1px') : '1.5px'}
            borderStyle={valid ? 'solid' : 'dashed'}
            borderColor={valid ? (light ? (isDark ? 'whiteAlpha.500' : 'gray.400') : 'blackAlpha.200') : (isDark ? 'whiteAlpha.400' : 'gray.400')}
            boxShadow={valid ? 'inset 0 0 0 1px rgba(255,255,255,.25)' : 'none'}
            flexShrink={0}
            title={valid ? code : 'Kod belgilanmagan'}
            {...props}
        />
    );
}
ColorDot.propTypes = { code: PropTypes.string, size: PropTypes.number };

/** Doiracha + nom (+ ixtiyoriy HEX kod). */
export default function ColorSwatch({ code, name, showCode = false, size = 18, fontSize = 'sm', ...props }) {
    const { textColor, subtitleColor } = useAppTheme();
    return (
        <HStack gap={2} minW={0} {...props}>
            <ColorDot code={code} size={size} />
            <Box minW={0}>
                <Text fontSize={fontSize} color={textColor} noOfLines={1}>{name || '—'}</Text>
                {showCode && <Text fontSize="xs" color={subtitleColor} fontFamily="mono">{isValidHex(code) ? code.toUpperCase() : 'Kod yo‘q'}</Text>}
            </Box>
        </HStack>
    );
}
ColorSwatch.propTypes = { code: PropTypes.string, name: PropTypes.string, showCode: PropTypes.bool, size: PropTypes.number, fontSize: PropTypes.string };
