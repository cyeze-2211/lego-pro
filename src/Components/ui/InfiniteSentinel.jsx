import PropTypes from 'prop-types';
import { Box, Button, HStack, Spinner, Text } from '@chakra-ui/react';
import { useAppTheme } from '../../theme/tokens';

/** Ro‘yxat pastidagi belgi: yuklanmoqda / yana yuklash / hammasi yuklandi */
export default function InfiniteSentinel({ sentinelRef, hasMore, loadingMore, loaded, total, unit = 'ta', onLoadMore }) {
    const { subtitleColor, accentColor } = useAppTheme();
    return (
        <Box ref={sentinelRef} py={5} textAlign="center">
            {loadingMore ? (
                <HStack justify="center" gap={2} color={subtitleColor} fontSize="sm"><Spinner size="sm" color={accentColor} /><span>Yana yuklanmoqda...</span></HStack>
            ) : hasMore ? (
                <Button size="sm" variant="ghost" borderRadius="xl" h="36px" px={4} color={subtitleColor} onClick={onLoadMore}>
                    Pastga aylantiring yoki bosing — yana yuklash ({loaded} / {total} {unit})
                </Button>
            ) : (
                <Text fontSize="xs" color={subtitleColor}>Hammasi yuklandi · {loaded} {unit}</Text>
            )}
        </Box>
    );
}

InfiniteSentinel.propTypes = {
    sentinelRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.any })]),
    hasMore: PropTypes.bool,
    loadingMore: PropTypes.bool,
    loaded: PropTypes.number,
    total: PropTypes.number,
    unit: PropTypes.string,
    onLoadMore: PropTypes.func,
};
