import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
	Box,
	Button,
	Dialog,
	Field,
	HStack,
	Input,
	Portal,
	Spinner,
	Textarea,
	useDisclosure,
	VStack,
} from '@chakra-ui/react';
import { LuCheck, LuFileText, LuPen, LuTag } from 'react-icons/lu';
import { Warehouse, X } from 'lucide-react';
import { useAppTheme } from '../../../../theme/tokens';
import { useUpdateWarehouseMutation } from '../../../../store/services/warehouse.api';
import { Alert } from '../../../Other/UI/Alert/Alert';

export default function Edit({ id, name: initialName, summary: initialSummary }) {
	const { open, onOpen, onClose } = useDisclosure();
	const [name, setName] = useState(initialName || '');
	const [summary, setSummary] = useState(initialSummary || '');
	const [updateWarehouse, { isLoading }] = useUpdateWarehouseMutation();
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
	const modalBorder = isDark ? cardBorder : '#CBD5E1';
	const fieldBg = isDark ? inputBg : '#FFFFFF';
	const fieldBorder = isDark ? inputBorder : '#64748B';
	const fieldHoverBorder = isDark ? inputHoverBorder : '#334155';
	const fieldFocusShadow = `0 0 0 3px ${accentColor}55`;

	useEffect(() => {
		if (open) {
			setName(initialName || '');
			setSummary(initialSummary || '');
		}
	}, [open, initialName, initialSummary]);

	const handleSubmit = async () => {
		if (isLoading) return;

		if (!name.trim()) {
			Alert('Ombor nomi majburiy', 'error');
			return;
		}

		try {
			await updateWarehouse({
				id,
				data: { name: name.trim(), summary: summary.trim() || undefined },
			}).unwrap();
			Alert('Ombor muvaffaqiyatli yangilandi', 'success');
			onClose();
		} catch (err) {
			Alert(err?.data?.message || 'Omborni yangilashda xatolik', 'error');
		}
	};

	return (
		<>
			<Button
				onClick={onOpen}
				variant="ghost"
				size="sm"
				color={accentColor}
				borderRadius="xl"
				px={3}
				aria-label="Tahrirlash"
				_hover={{
					bg: isDark ? 'rgba(250, 204, 21, 0.16)' : 'yellow.50',
					color: isDark ? 'yellow.200' : 'yellow.700',
				}}
			>
				<HStack gap={2}>
					<LuPen size={16} />
				</HStack>
			</Button>

			<Dialog.Root
				open={open}
				onOpenChange={(event) => (event.open ? onOpen() : onClose())}
				size="md"
				placement="center"
			>
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
								<HStack gap={3}>
									<Box
										p={3}
										borderRadius="xl"
										bg={isDark ? 'rgba(250, 204, 21, 0.1)' : '#fefce8'}
										borderColor={isDark ? 'rgba(250, 204, 21, 0.2)' : '#FDE68A'}
										borderWidth="1px"
									>
										<Warehouse size={24} color={accentColor} />
									</Box>
									<span>Omborni tahrirlash</span>
								</HStack>
							</Dialog.Header>

							<Dialog.CloseTrigger asChild>
								<Button variant="ghost" color={subtitleColor} size="sm" position="absolute" top="3" right="3" aria-label="Yopish">
									<X />
								</Button>
							</Dialog.CloseTrigger>

							<Dialog.Body py={6}>
								<VStack gap={6}>
									<Field.Root required>
										<Field.Label color={textColor} fontWeight="medium">
											<HStack gap={2}><LuTag size={16} /><span>Nomi</span></HStack>
											<Field.RequiredIndicator />
										</Field.Label>
										<Input
											value={name}
											onChange={(event) => setName(event.target.value)}
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
											borderRadius="xl"
											_hover={{
												borderColor: fieldHoverBorder,
												bg: isDark ? fieldBg : 'white',
												boxShadow: isDark ? '0 0 0 1px rgba(148, 163, 184, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.12)',
											}}
											transition="all 0.2s"
											autoFocus
											_focus={{ borderColor: accentColor, boxShadow: fieldFocusShadow }}
										/>
									</Field.Root>

									<Field.Root>
										<Field.Label color={textColor} fontWeight="medium">
											<HStack gap={2}><LuFileText size={16} /><span>Tavsifi</span></HStack>
										</Field.Label>
										<Textarea
											value={summary}
											onChange={(event) => setSummary(event.target.value)}
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
											borderRadius="xl"
											rows={4}
											_hover={{
												borderColor: fieldHoverBorder,
												bg: isDark ? fieldBg : 'white',
												boxShadow: isDark ? '0 0 0 1px rgba(148, 163, 184, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.12)',
											}}
											transition="all 0.2s"
											_focus={{ borderColor: accentColor, boxShadow: fieldFocusShadow }}
										/>
									</Field.Root>
								</VStack>
							</Dialog.Body>

							<Dialog.Footer gap={3} pt={5} pb={6} borderTopWidth="1px" borderColor={modalBorder}>
								<Button
									variant="ghost"
									onClick={onClose}
									color={subtitleColor}
									size="lg"
									borderRadius="xl"
									_hover={{
										bg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'gray.100',
										color: textColor,
									}}
								>
									Bekor qilish
								</Button>
								<Button
									onClick={handleSubmit}
									disabled={isLoading}
									bg={accentColor}
									color="black"
									size="lg"
									borderRadius="xl"
									px={8}
									_hover={{
										bg: isDark ? 'yellow.300' : 'yellow.500',
										transform: 'translateY(-1px)',
										boxShadow: 'lg',
									}}
									_active={{ transform: 'translateY(0)' }}
								>
									{isLoading ? (
										<HStack gap={2}><Spinner size="sm" color="black" /><span>Saqlanmoqda...</span></HStack>
									) : (
										<HStack gap={2}><LuCheck size={20} /><span>Saqlash</span></HStack>
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

Edit.propTypes = {
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	summary: PropTypes.string,
};
