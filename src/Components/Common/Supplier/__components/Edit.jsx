import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@chakra-ui/react';
import { LuPen } from 'react-icons/lu';
import Form from './Form';
import { useAppTheme } from '../../../../theme/tokens';

export default function Edit({ supplier }) {
    const [open, setOpen] = useState(false);
    const { isDark, accentColor } = useAppTheme();
    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                variant="ghost"
                size="sm"
                color={accentColor}
                borderRadius="xl"
                px={3}
                aria-label="Tahrirlash"
                _hover={{ bg: isDark ? 'rgba(250, 204, 21, 0.16)' : 'yellow.50', color: isDark ? 'yellow.200' : 'yellow.700' }}
            >
                <LuPen size={16} />
            </Button>
            {open && <Form supplier={supplier} hideTrigger openOnMount onClosed={() => setOpen(false)} />}
        </>
    );
}

Edit.propTypes = { supplier: PropTypes.object.isRequired };
