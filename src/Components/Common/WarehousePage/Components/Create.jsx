// Components/Create.jsx
import { useState } from 'react';
import {
  Button,
  Dialog,
  Field,
  Input,
  Textarea,
  VStack,
  useDisclosure,
  Spinner,
  HStack,
  Box,
  Portal,
} from '@chakra-ui/react';
import { LuPlus, LuWarehouse, LuTag, LuFileText, LuCheck, LuPackage, LuWheat } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import { useCreateWarehouseMutation } from '../../../../store/services/warehouse.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { Warehouse, X } from 'lucide-react';

export default function Create() {
  const { open, onOpen, onClose } = useDisclosure();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('PRODUCT');
  const [createWarehouse, { isLoading }] = useCreateWarehouseMutation();
  const {
    isDark,
    accentColor,
    cardBg,
    cardBorder,
    inputBg,
    inputBorder,
    inputHoverBorder,
    textColor,
    subtitleColor,
  } = useAppTheme();
  const modalBorder = isDark ? cardBorder : '#94A3B8';
  const fieldBg = isDark ? inputBg : '#F1F5F9';
  const fieldBorder = isDark ? inputBorder : '#475569';
  const fieldHoverBorder = isDark ? inputHoverBorder : '#334155';
  const fieldFocusShadow = `0 0 0 3px ${accentColor}55`;

  const handleSubmit = async () => {
    if (isLoading) return;

    if (!name.trim()) {
      Alert('Ombor nomi majburiy', 'error');
      return;
    }
    try {
      await createWarehouse({
        name: name.trim(),
        summary: summary.trim() || undefined,
        category,
      }).unwrap();
      Alert('Ombor muvaffaqiyatli yaratildi', 'success');
      onClose();
      setName('');
      setSummary('');
      setCategory('PRODUCT');
    } catch (err) {
      Alert(err?.data?.message || 'Ombor yaratishda xatolik', 'error');
    }
  };

  return (
    <>
      <Button
        onClick={onOpen}
        bg={accentColor}
        color="black"
        _hover={{ bg: isDark ? 'yellow.300' : 'yellow.500', transform: 'translateY(-1px)', boxShadow: 'lg' }}
        transition="all 0.2s"
        fontWeight="semibold"
        px={4}
        py={4}
        borderRadius="xl"
        boxShadow="md"
      >
        <HStack gap={2}>
          <LuPlus size={20} />
          <span>Ombor qo‘shish</span>
        </HStack>
      </Button>

      <Dialog.Root open={open} onOpenChange={(event) => event.open ? onOpen() : onClose()} size="md" placement="center">
        <Portal>
          <Dialog.Backdrop backdropFilter="blur(6px)" bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'} />
          <Dialog.Positioner>
            <Dialog.Content
              bg={cardBg}
              borderColor={modalBorder}
              borderWidth="1px"
              borderRadius="2xl"
              boxShadow="2xl"
              overflow="hidden"
              maxW="520px"
              w="calc(100% - 32px)"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                height="4px"
                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`}
              />

              <Dialog.Header color={textColor} fontSize="2xl" fontWeight="bold" pt={7} pb={5} borderBottomWidth="1px" borderColor={modalBorder}>
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#fefce8'}
                    borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'}
                    borderWidth="1px"
                  >
                    <Warehouse size={24} color={accentColor} />
                  </Box>
                  <span>Yangi ombor</span>
                </HStack>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  color={subtitleColor}
                  size="sm"
                  position="absolute"
                  top="3"
                  right="3"
                  aria-label="Yopish"
                  transition="all 0.2s"
                >
                  <X />
                </Button>
              </Dialog.CloseTrigger>

              <Dialog.Body py={6}>
                <VStack gap={6}>
                  <Field.Root required>
                    <Field.Label color={textColor} fontWeight="medium">
                      <HStack spacing={2}>
                        <LuTag size={16} />
                        <span>Nomi</span>
                      </HStack>
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ombor nomini kiriting"
                      bg={fieldBg}
                      borderColor={fieldBorder}
                      borderWidth="1px"
                      borderStyle="solid"
                      color={textColor}
                      _placeholder={{ color: isDark ? 'gray.500' : 'gray.500', opacity: 1 }}
                      px={4}
                      py={3}
                      minH="52px"
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: fieldFocusShadow,
                      }}
                      _hover={{
                        borderColor: fieldHoverBorder,
                        bg: isDark ? fieldBg : 'white',
                        boxShadow: isDark ? '0 0 0 1px rgba(148, 163, 184, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.12)',
                      }}
                      transition="all 0.2s"
                      size="lg"
                      borderRadius="xl"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label color={textColor} fontWeight="medium">
                      <HStack spacing={2}>
                        <LuWarehouse size={16} />
                        <span>Ombor turi</span>
                      </HStack>
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <HStack gap={3} width="100%" align="stretch">
                      <Button
                        type="button"
                        onClick={() => setCategory('PRODUCT')}
                        flex={1}
                        minH="52px"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderStyle="solid"
                        borderColor={category === 'PRODUCT' ? accentColor : fieldBorder}
                        bg={category === 'PRODUCT' ? (isDark ? 'rgba(250, 204, 21, 0.16)' : '#FEF3C7') : fieldBg}
                        color={isDark ? textColor : '#0F172A'}
                        boxShadow={category === 'PRODUCT' ? `0 0 0 2px ${accentColor}33` : 'none'}
                        _hover={{ borderColor: accentColor }}
                      >
                        <HStack gap={2}>
                          <LuPackage size={18} />
                          <span>Tovar ombori</span>
                        </HStack>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCategory('RAW_MATERIAL')}
                        flex={1}
                        minH="52px"
                        borderRadius="xl"
                        borderWidth="1px"
                        borderStyle="solid"
                        borderColor={category === 'RAW_MATERIAL' ? accentColor : fieldBorder}
                        bg={category === 'RAW_MATERIAL' ? (isDark ? 'rgba(250, 204, 21, 0.16)' : '#FEF3C7') : fieldBg}
                        color={isDark ? textColor : '#0F172A'}
                        boxShadow={category === 'RAW_MATERIAL' ? `0 0 0 2px ${accentColor}33` : 'none'}
                        _hover={{ borderColor: accentColor }}
                      >
                        <HStack gap={2}>
                          <LuWheat size={18} />
                          <span>Xom ashyo</span>
                        </HStack>
                      </Button>
                    </HStack>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color={textColor} fontWeight="medium">
                      <HStack spacing={2}>
                        <LuFileText size={16} />
                        <span>Tavsifi</span>
                      </HStack>
                    </Field.Label>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Tavsif (ixtiyoriy)"
                      bg={fieldBg}
                      borderColor={fieldBorder}
                      borderWidth="1px"
                      borderStyle="solid"
                      color={textColor}
                      _placeholder={{ color: isDark ? 'gray.500' : 'gray.500', opacity: 1 }}
                      px={4}
                      py={3}
                      minH="120px"
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: fieldFocusShadow,
                      }}
                      _hover={{
                        borderColor: fieldHoverBorder,
                        bg: isDark ? fieldBg : 'white',
                        boxShadow: isDark ? '0 0 0 1px rgba(148, 163, 184, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.12)',
                      }}
                      transition="all 0.2s"
                      size="lg"
                      borderRadius="xl"
                      rows={4}
                    />
                  </Field.Root>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  color={subtitleColor}
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor={isDark ? 'transparent' : '#CBD5E1'}
                  _hover={{ bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100', color: textColor }}
                  size="lg"
                  paddingX={6}
                  borderRadius="xl"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  bg={accentColor}
                  color="black"
                  _hover={{
                    bg: 'yellow.500',
                    transform: 'scale(1.02)',
                    boxShadow: 'lg',
                  }}
                  _active={{ transform: 'scale(0.98)' }}
                  transition="all 0.2s"
                  size="lg"
                  borderRadius="xl"
                  px={8}
                  fontWeight="semibold"
                >
                  {isLoading ? (
                    <HStack gap={2}>
                      <Spinner size="sm" color="black" />
                      <span>Saqlanmoqda...</span>
                    </HStack>
                  ) : (
                    <HStack gap={2}>
                      <LuCheck size={20} />
                      <span>Saqlash</span>
                    </HStack>
                  )}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}