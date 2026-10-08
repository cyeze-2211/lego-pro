import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import Form from './Form';
import { useAppTheme } from '../../../../theme/tokens';

export default function Create() {
    const [open, setOpen] = useState(false);
    const { accentColor } = useAppTheme();
    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                bg={accentColor}
                color="black"
                borderRadius="xl"
                px={5}
                minH="48px"
                fontWeight="bold"
                _hover={{ bg: 'yellow.500', transform: 'translateY(-1px)' }}
            >
                <LuPlus size={18} /> Yetkazib beruvchi qo‘shish
            </Button>
            {open && <Form hideTrigger openOnMount onClosed={() => setOpen(false)} />}
        </>
    );
}
