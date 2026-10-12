import PropTypes from 'prop-types';
import { Box, HStack, Heading, Text } from '@chakra-ui/react';
import { useAppTheme } from '../../../../theme/tokens';

/** Sozlamalar sahifasidagi bo‘lim kartasi: ikonka, sarlavha, tavsif va kontent */
export default function SettingsSection({ id, icon: Icon, title, description, action, children }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor, accentColor } = useAppTheme();

    return (
        <Box
            as="section"
            aria-labelledby={id}
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            boxShadow={isDark ? 'none' : '0 4px 16px rgba(15,23,42,.04)'}
            overflow="hidden"
        >
            <HStack
                justify="space-between"
                align="start"
                flexWrap="wrap"
                gap={3}
                px={{ base: 4, md: 6 }}
                py={4}
                borderBottomWidth="1px"
                borderColor={cardBorder}
            >
                <HStack gap={3} align="start" minW={0}>
                    <Box
                        w="2.25rem"
                        h="2.25rem"
                        flexShrink={0}
                        borderRadius="xl"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="yellow.400/15"
                        color={accentColor}
                    >
                        <Icon size={18} />
                    </Box>
                    <Box minW={0}>
                        <Heading as="h2" id={id} fontSize="md" fontWeight="semibold" color={textColor}>{title}</Heading>
                        {description && <Text fontSize="sm" color={subtitleColor} mt={0.5}>{description}</Text>}
                    </Box>
                </HStack>
                {action}
            </HStack>
            <Box px={{ base: 4, md: 6 }} py={5}>{children}</Box>
        </Box>
    );
}

SettingsSection.propTypes = {
    id: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    action: PropTypes.node,
    children: PropTypes.node,
};
