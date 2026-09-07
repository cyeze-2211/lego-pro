import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Dialog,
  Field,
  HStack,
  Portal,
  Spinner,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { Check, FileText, Package, X } from 'lucide-react';
import { LuPlus, LuTag, LuWarehouse } from 'react-icons/lu';
import { useCreateRawMaterialMutation } from '../../../../store/services/raw.api';
import { Alert } from '../../../Other/UI/Alert/Alert';
import { useAppTheme } from '../../../../theme/tokens';
import FormControl from '../../../ui/FormControl';

export default function Create({ warehouses }) {
  const { open, onOpen, onClose } = useDisclosure();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [createRawMaterial, { isLoading }] = useCreateRawMaterialMutation();
  const { isDark, accentColor, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();

  const modalBorder = isDark ? cardBorder : '#94A3B8';

  const resetForm = () => {
    setName('');
    setSummary('');
    setWarehouseId('');
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!name.trim() || !warehouseId) {
      Alert('Xom ashyo nomi va ombori majburiy', 'error');
      return;
    }
    try {
      await createRawMaterial({
        name: name.trim(),
        summary: summary.trim() || undefined,
        warehouseId,
      }).unwrap();
      Alert('Xom ashyo muvaffaqiyatli yaratildi', 'success');
      onClose();
      resetForm();
    } catch (error) {
      Alert(error?.data?.message || 'Xom ashyo yaratishda xatolik', 'error');
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <>
      <Button
        onClick={onOpen}
        bg={accentColor}
        color="black"
        borderRadius="xl"
        fontWeight="semibold"
        px={4}
        py={4}
        boxShadow="md"
        _hover={{
          bg: isDark ? 'yellow.300' : 'yellow.500',
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        }}
      >
        <HStack gap={2}>
          <LuPlus size={20} />
          <span>Xom ashyo qo‘shish</span>
        </HStack>
      </Button>

      <Dialog.Root
        open={open}
        onOpenChange={(event) => (event.open ? onOpen() : handleClose())}
        size="md"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop
            backdropFilter="blur(6px)"
            bg={isDark ? 'blackAlpha.700' : 'blackAlpha.400'}
          />
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
              {/* Верхняя полоса */}
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                h="4px"
                bgGradient={`linear(to-r, ${accentColor}, yellow.300)`}
              />

              <Dialog.Header
                color={textColor}
                fontSize="2xl"
                fontWeight="bold"
                pt={7}
                pb={5}
                borderBottomWidth="1px"
                borderColor={modalBorder}
              >
                <HStack gap={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={isDark ? 'rgba(250,204,21,.1)' : '#FEFCE8'}
                    borderColor={isDark ? 'rgba(250,204,21,.2)' : '#FDE68A'}
                    borderWidth="1px"
                    color={accentColor}
                  >
                    <Package size={24} />
                  </Box>
                  <span>Yangi xom ashyo</span>
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
                >
                  <X />
                </Button>
              </Dialog.CloseTrigger>

              <Dialog.Body py={6}>
                <VStack gap={6} align="stretch">
                  <Field.Root required>
                    <Field.Label color={textColor} fontWeight="medium">
                      <HStack gap={2}>
                        <LuTag size={16} />
                        <span>Nomi</span>
                      </HStack>
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <FormControl
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Xom ashyo nomini kiriting"
                      autoFocus
                      minH="52px"
                    />
                  </Field.Root>

                  <Field.Root required width="100%">
                    <Field.Label color={textColor} fontWeight="medium">
                      <HStack gap={2}>
                        <LuWarehouse size={16} />
                        <span>Ombor</span>
                      </HStack>
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <FormControl
                      as="select"
                      value={warehouseId}
                      onChange={(event) => setWarehouseId(event.target.value)}
                      w="100%"
                      minH="52px"
                    >
                      <option value="">Xom ashyo omborini tanlang</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </FormControl>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color={textColor} fontWeight="medium">
                      <HStack gap={2}>
                        <FileText size={16} />
                        <span>Tavsifi</span>
                      </HStack>
                    </Field.Label>
                    <FormControl
                      as="textarea"
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="Tavsif (ixtiyoriy)"
                      minH="120px"
                      rows={4}
                    />
                  </Field.Root>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer
                gap={3}
                pt={5}
                pb={6}
                borderTopWidth="1px"
                borderColor={modalBorder}
              >
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  color={subtitleColor}
                  borderWidth="1px"
                  borderStyle="solid"
                  borderColor={isDark ? 'transparent' : '#CBD5E1'}
                  size="lg"
                  px={6}
                  borderRadius="xl"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  bg={accentColor}
                  color="black"
                  size="lg"
                  px={8}
                  borderRadius="xl"
                >
                  {isLoading ? (
                    <HStack>
                      <Spinner size="sm" />
                      <span>Saqlanmoqda...</span>
                    </HStack>
                  ) : (
                    <HStack>
                      <Check size={20} />
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

Create.propTypes = {
  warehouses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    })
  ).isRequired,
};