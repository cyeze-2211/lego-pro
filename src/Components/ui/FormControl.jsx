import PropTypes from 'prop-types';
import { Box, Input, Textarea } from '@chakra-ui/react';
import { useAppTheme } from '../../theme/tokens';

export default function FormControl({ as = 'input', ...props }) {
    const { isDark, accentColor, inputBg, inputBorder, inputHoverBorder, textColor } = useAppTheme();
    const styles = {
        bg: isDark ? inputBg : '#F1F5F9',
        borderColor: isDark ? inputBorder : '#475569',
        borderWidth: '1px',
        borderStyle: 'solid',
        color: textColor,
        borderRadius: 'xl',
        px: 4,
        py: 3,
        _placeholder: { color: 'gray.500', opacity: 1 },
        _focus: { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}55` },
        _hover: {
            borderColor: isDark ? inputHoverBorder : '#334155',
            bg: isDark ? inputBg : 'white',
            boxShadow: isDark ? '0 0 0 1px rgba(148, 163, 184, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.12)',
        },
        transition: 'all 0.2s',
        ...(as === 'select' ? { width: '100%', minHeight: '52px', cursor: 'pointer', fontSize: 'md' } : {}),
    };
    const Component = as === 'select' ? Box : as === 'textarea' ? Textarea : Input;
    const componentProps = as === 'select' ? { as: 'select', ...props } : props;

    return <Component {...styles} {...componentProps} />;
}

FormControl.propTypes = {
    as: PropTypes.oneOf(['input', 'select', 'textarea']),
};
