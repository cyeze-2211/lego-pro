import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { Inbox } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAppTheme } from '../../../../theme/tokens';

export default function EmptyData({
    text = 'Ma’lumot mavjud emas',
    description = 'Bu yerda hozircha hech qanday ma’lumot yo‘q.',
    action,
}) {
    const {
        isDark,
        cardBorder,
        subtitleColor,
        textColor,
        accentColor,
    } = useAppTheme();

    return (
        <Box
            w="100%"
            minH="360px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor={cardBorder}
            borderRadius="2xl"
            bg={isDark ? 'rgba(20, 28, 43, 0.45)' : '#FFFFFF'}
            boxShadow={isDark ? 'none' : '0 8px 24px rgba(15, 23, 42, 0.06)'}
            color={textColor}
            px={{ base: 6, md: 10 }}
            py={12}
        >
            <VStack gap={4} textAlign="center" maxW="420px">
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="76px"
                    h="76px"
                    borderRadius="2xl"
                    bg={isDark ? 'rgba(250, 204, 21, 0.12)' : '#FEFCE8'}
                    borderWidth="1px"
                    borderColor={isDark ? 'rgba(250, 204, 21, 0.24)' : '#FDE68A'}
                    color={accentColor}
                >
                    <Inbox size={36} strokeWidth={1.8} />
                </Box>
                <VStack gap={1}>
                    <Heading size="md" color={textColor}>
                        {text}
                    </Heading>
                    <Text color={subtitleColor} fontSize="sm" lineHeight="1.6">
                        {description}
                    </Text>
                </VStack>
                {action}
            </VStack>
        </Box>
    );
}

EmptyData.propTypes = {
    text: PropTypes.string,
    description: PropTypes.string,
    action: PropTypes.node,
};
