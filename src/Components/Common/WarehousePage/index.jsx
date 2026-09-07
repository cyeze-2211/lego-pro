import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Card,
  Text,
  HStack,
  VStack,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { Warehouse, Calendar, Package, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetWarehousesQuery } from '../../../store/services/warehouse.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../theme/tokens';
import Create from './Components/Create';
import Delete from './Components/Delete';
import Edit from './Components/Edit';
import Loading from '../../Other/UI/Loadings/Loading';
import EmptyData from '../../Other/UI/NoData/EmptyData';

export default function WarehousePage() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState('');
  const { data: warehouses, isLoading, error } = useGetWarehousesQuery(categoryFilter || undefined);
  const {
    isDark,
    pageBg,
    cardBg,
    cardBorder,
    cardShadow,
    textColor,
    subtitleColor,
    accentColor,
  } = useAppTheme();

  const warehouseCardBorder = isDark ? cardBorder : '#CBD5E1';
  const warehouseCardShadow = isDark
    ? cardShadow
    : '0 8px 24px rgba(15, 23, 42, 0.10)';

  const filterOptions = [
    { value: '', label: 'Barcha omborlar' },
    { value: 'PRODUCT', label: 'Tovar omborlari' },
    { value: 'RAW_MATERIAL', label: 'Xom ashyo omborlari' },
  ];

  // Определяем цвета для категорий
  const categoryBadgeMap = {
    PRODUCT: { label: 'Tovar', colorScheme: 'blue', icon: Package },
    RAW_MATERIAL: { label: 'Xom ashyo', colorScheme: 'orange', icon: Layers },
  };

  useEffect(() => {
    if (error) {
      Alert(error?.data?.message || 'Omborlarni yuklashda xatolik', 'error');
    }
  }, [error]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Box bg={pageBg} p={6} textAlign="center" color={isDark ? 'red.300' : 'red.600'}>
        Ma&apos;lumotlarni yuklashda xatolik
      </Box>
    );
  }

  // Общий компонент для фильтра и заголовка (вынесем, чтобы не дублировать)
  const renderHeader = () => (
    <Box my={2} className="flex justify-between items-center" flexWrap="wrap" gap={4}>
      <Heading className="text-[35px] font-semibold" color={textColor}>
        Omborlar
      </Heading>
      <HStack
        gap={1}
        p={1}
        borderWidth="1px"
        borderStyle="solid"
        borderColor={warehouseCardBorder}
        borderRadius="full"
        bg={isDark ? 'rgba(20, 28, 43, 0.6)' : '#FFFFFF'}
        boxShadow={isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'}
      >
        {filterOptions.map((option) => {
          const isActive = categoryFilter === option.value;
          return (
            <Button
              key={option.value || 'all'}
              size="sm"
              borderRadius="full"
              px={4}
              py={1}
              fontWeight="medium"
              transition="all 0.2s"
              onClick={() => setCategoryFilter(option.value)}
              bg={isActive ? accentColor : 'transparent'}
              color={isActive ? 'black' : textColor}
              _hover={{
                bg: isActive ? accentColor : (isDark ? 'whiteAlpha.100' : 'gray.50'),
              }}
              border="none"
              boxShadow={isActive ? '0 2px 8px rgba(250,204,21,0.3)' : 'none'}
            >
              {option.label}
            </Button>
          );
        })}
        <Create />
      </HStack>
    </Box>
  );

  if (!warehouses || warehouses.length === 0) {
    return (
      <Box bg={pageBg} color={textColor} minH="100%">
        {renderHeader()}
        <Box mt={8}>
          <EmptyData
            text="Hozircha omborlar yo‘q"
            description="Omborlar ro‘yxatini boshlash uchun yangi ombor qo‘shing."
            action={<Create />}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} color={textColor} minH="100%">
      {renderHeader()}

      <SimpleGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-[20px]" gap={3}>
        {warehouses.map((wh) => {
          const categoryInfo = categoryBadgeMap[wh.category] || { label: wh.category, colorScheme: 'gray', icon: Warehouse };
          const BadgeIcon = categoryInfo.icon;

          return (
            <Card.Root
                key={wh.id}
                bg={cardBg}
                borderColor={warehouseCardBorder}
                boxShadow={warehouseCardShadow}
                borderWidth="1px"
                borderRadius="2xl"
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => navigate(`/warehouses/${wh.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/warehouses/${wh.id}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${wh.name} omborining tafsilotlarini ochish`}
              _hover={{
                boxShadow: isDark ? 'xl' : '0 14px 30px rgba(15, 23, 42, 0.14)',
                transform: 'translateY(-4px)',
                borderColor: isDark ? accentColor : '#94A3B8',
              }}
              borderTop={`4px solid ${accentColor}`}
            >
              <Card.Header pb={0}>
                <HStack justify="space-between" align="start">
                  <HStack gap={3} alignItems="center" minW={0}>
                    <Box
                      p={2.5}
                      borderRadius="xl"
                      bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#fefce8'}
                      borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'}
                      borderWidth="1px"
                      flexShrink={0}
                    >
                      <Warehouse size={22} color={accentColor} />
                    </Box>
                    <Heading size="md" noOfLines={1} color={textColor}>
                      {wh.name}
                    </Heading>
                  </HStack>
                  <HStack gap={1} flexShrink={0} onClick={(event) => event.stopPropagation()}>
                    <Edit id={wh.id} name={wh.name} summary={wh.summary} />
                    <Delete id={wh.id} name={wh.name} />
                  </HStack>
                </HStack>
              </Card.Header>

              <Card.Body
                pt={2}
              >
                {/* Улучшенный бейдж категории с иконкой */}


                <Text
                  noOfLines={2}
                  color={subtitleColor}
                  mb={2}
                  fontSize="sm"
                >
                  {wh.summary || 'Tavsifsiz'}
                </Text>
                <Badge
                  display="inline-flex"
                  alignItems="center"
                  gap={1.5}
                  px={2}
                  py={1}
                  borderRadius="10px"
                  colorScheme={categoryInfo.colorScheme}
                  fontSize="xs"
                  fontWeight="semibold"

                  bg={
                    isDark
                      ? `${categoryInfo.colorScheme}.900`
                      : `${categoryInfo.colorScheme}.50`
                  }
                  color={
                    isDark
                      ? `${categoryInfo.colorScheme}.200`
                      : `${categoryInfo.colorScheme}.700`
                  }
                  borderWidth="1px"
                  minW={'100px'}
                  maxW={'fit-content'}
                  borderColor={
                    isDark
                      ? `${categoryInfo.colorScheme}.700`
                      : `${categoryInfo.colorScheme}.200`
                  }
                  mb={3}
                >
                  <Icon as={BadgeIcon} size={14} />
                  {categoryInfo.label}
                </Badge>

                <VStack align="start" spacing={1} fontSize="xs" color={subtitleColor}>
                  <HStack>
                    <Calendar size={14} />
                    <Text>Yaratilgan: {new Date(wh.createdAt).toLocaleString()}</Text>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}