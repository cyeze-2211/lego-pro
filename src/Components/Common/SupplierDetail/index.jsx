import { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import {
    LuArrowLeft, LuCalendar, LuCircleAlert, LuClock3, LuHash, LuHistory, LuMapPin,
    LuPen, LuPhone, LuReceipt, LuScale, LuStickyNote, LuTruck, LuWallet,
} from 'react-icons/lu';
import { useGetSupplierByIdQuery } from '../../../store/services/supplier.api';
import { useGetSupplierPaymentsQuery } from '../../../store/services/supplierPayment.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import Loading from '../../Other/UI/Loadings/Loading';
import { formatDetailDate } from '../EntityDetail';
import Form from '../Supplier/__components/Form';
import PaymentModal from '../Supplier/__components/PaymentModal';
import SupplierPaymentHistory from '../SupplierPaymentHistory';

/* ── Balans holati ─────────────────────────────────────────────────────── */
function getBalanceMeta(balance, isDark) {
    if (balance > 0) {
        return {
            tone: 'green',
            color: isDark ? 'green.300' : 'green.600',
            soft: isDark ? 'rgba(34,197,94,.12)' : '#ECFDF5',
            border: isDark ? 'rgba(34,197,94,.3)' : '#A7F3D0',
            label: 'Oldindan to‘langan',
            hint: 'Yetkazib beruvchiga avans berilgan. Keyingi kirimlar shu summadan yopiladi.',
        };
    }
    if (balance < 0) {
        return {
            tone: 'red',
            color: isDark ? 'red.300' : 'red.600',
            soft: isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2',
            border: isDark ? 'rgba(239,68,68,.3)' : '#FECACA',
            label: 'Biz qarzdormiz',
            hint: 'Yetkazib beruvchiga to‘lanishi kerak bo‘lgan summa. Balansni to‘ldirib qarzni yoping.',
        };
    }
    return {
        tone: 'gray',
        color: isDark ? 'gray.200' : 'gray.700',
        soft: isDark ? 'rgba(148,163,184,.12)' : '#F1F5F9',
        border: isDark ? 'rgba(148,163,184,.3)' : '#E2E8F0',
        label: 'Hisob tenglashgan',
        hint: 'Qarz ham, avans ham yo‘q.',
    };
}

function formatPaidDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ── Kichik UI bloklari ────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, valueColor }) {
    const { isDark, cardBg, cardBorder, textColor, subtitleColor } = useAppTheme();
    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            p={{ base: 4, md: 5 }}
            boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'}
            minW={0}
        >
            <HStack gap={3} align="start">
                <Box p={2.5} borderRadius="xl" bg={iconBg} color={iconColor} flexShrink={0}>
                    <Icon size={20} />
                </Box>
                <Box minW={0} flex={1}>
                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>
                        {label}
                    </Text>
                    <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color={valueColor || textColor} lineHeight="1.2" mt={1} truncate>
                        {value}
                    </Text>
                    {sub && <Text fontSize="sm" color={subtitleColor} mt={1}>{sub}</Text>}
                </Box>
            </HStack>
        </Box>
    );
}

StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.node.isRequired,
    sub: PropTypes.node,
    iconBg: PropTypes.string.isRequired,
    iconColor: PropTypes.string.isRequired,
    valueColor: PropTypes.string,
};

function InfoCard({ icon: Icon, title, children }) {
    const { isDark, cardBg, cardBorder, textColor, accentColor } = useAppTheme();
    return (
        <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'}
        >
            <HStack gap={2} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                <Icon size={17} color={accentColor} />
                <Heading size="sm" color={textColor}>{title}</Heading>
            </HStack>
            <VStack align="stretch" gap={0} css={{ '& > * + *': { borderTopWidth: '1px', borderTopColor: cardBorder } }}>
                {children}
            </VStack>
        </Box>
    );
}

InfoCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
};

function InfoRow({ icon: Icon, label, value, mono = false, href }) {
    const { textColor, subtitleColor, accentColor } = useAppTheme();
    const empty = value === null || value === undefined || value === '';
    return (
        <HStack gap={3} px={{ base: 4, md: 5 }} py={3} align="start">
            <Box color={subtitleColor} mt="2px" flexShrink={0}><Icon size={15} /></Box>
            <Box minW={0} flex={1}>
                <Text fontSize="xs" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                    {label}
                </Text>
                {empty ? (
                    <Text color={subtitleColor} fontSize="sm" mt={0.5}>Ko‘rsatilmagan</Text>
                ) : href ? (
                    <Text as="a" href={href} display="block" color={accentColor} fontWeight="semibold" fontSize="sm" mt={0.5} _hover={{ textDecoration: 'underline' }}>
                        {value}
                    </Text>
                ) : (
                    <Text color={textColor} fontWeight="medium" fontSize="sm" mt={0.5} fontFamily={mono ? 'mono' : undefined} whiteSpace="pre-wrap" wordBreak="break-word">
                        {value}
                    </Text>
                )}
            </Box>
        </HStack>
    );
}

InfoRow.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    mono: PropTypes.bool,
    href: PropTypes.string,
};

/* ── Sahifa ────────────────────────────────────────────────────────────── */
export default function SupplierDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const backTo = pathname.startsWith('/kassir') ? '/kassir/suppliers' : '/suppliers';

    const [paymentOpen, setPaymentOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const role = useAppSelector((state) => state.auth.role);
    const canManageSupplier = role === ROLES.MANAGER || role === ROLES.KASSIR;

    const { data: supplier, isLoading, isError } = useGetSupplierByIdQuery(id, { skip: !id });
    const { data: lastPaymentResult } = useGetSupplierPaymentsQuery(
        { supplierId: id, status: 'ACTIVE', page: 0, size: 1, sort: ['paidAt,DESC', 'createdAt,DESC'] },
        { skip: !id },
    );

    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor, cardShadow } = useAppTheme();

    if (isLoading) {
        return <Box minH="60vh" display="flex" alignItems="center" justifyContent="center"><Loading /></Box>;
    }

    if (isError || !supplier) {
        return (
            <Box minH="60vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} color={isDark ? 'red.300' : 'red.600'}>
                <LuCircleAlert size={34} />
                <Text fontSize="lg">Yetkazib beruvchi ma&apos;lumotini yuklashda xatolik</Text>
                <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}>
                    <HStack gap={2}><LuArrowLeft size={16} /><span>Yetkazib beruvchilar ro‘yxatiga qaytish</span></HStack>
                </Button>
            </Box>
        );
    }

    const balance = Number(supplier.balance) || 0;
    const balanceMeta = getBalanceMeta(balance, isDark);
    const lastPayment = lastPaymentResult?.items?.[0] ?? null;
    const activePaymentsCount = lastPaymentResult?.pagination?.totalElements ?? 0;
    const accentSoft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';
    const phoneHref = supplier.phone ? `tel:${String(supplier.phone).replace(/[^\d+]/g, '')}` : undefined;

    return (
        <Box bg={pageBg} color={textColor} minH="100%" w="100%">
            {/* ── Sarlavha ── */}
            <Box overflow="hidden" borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" boxShadow={cardShadow} mb={4}>
                <Box h="5px" bg={`linear-gradient(90deg, ${accentColor}, rgb(var(--accent-warm-200)))`} />
                <Box bg={cardBg} p={{ base: 4, md: 6 }}>
                    <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <HStack gap={4} minW={0} align="start">
                            <Box p={3.5} borderRadius="xl" bg={accentSoft} color={accentColor} flexShrink={0}>
                                <LuTruck size={28} />
                            </Box>
                            <Box minW={0}>
                                <HStack gap={2} flexWrap="wrap" mb={1}>
                                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>
                                        Yetkazib beruvchi
                                    </Text>
                                    <Badge borderRadius="full" px={2.5} py={0.5} fontSize="11px" fontWeight="semibold" bg={balanceMeta.soft} color={balanceMeta.color} borderWidth="1px" borderColor={balanceMeta.border}>
                                        {balanceMeta.label}
                                    </Badge>
                                </HStack>
                                <Heading size={{ base: 'lg', md: 'xl' }} color={textColor} lineHeight="1.15" wordBreak="break-word">
                                    {supplier.name}
                                </Heading>
                                <HStack gap={4} mt={2} flexWrap="wrap" color={subtitleColor} fontSize="sm">
                                    {supplier.phone && (
                                        <HStack gap={1.5}><LuPhone size={14} /><Text as="a" href={phoneHref} _hover={{ color: accentColor }}>{supplier.phone}</Text></HStack>
                                    )}
                                    {supplier.region?.name && (
                                        <HStack gap={1.5}><LuMapPin size={14} /><span>{supplier.region.name}</span></HStack>
                                    )}
                                    {supplier.inn && (
                                        <HStack gap={1.5}><LuHash size={14} /><Text as="span" fontFamily="mono">{supplier.inn}</Text></HStack>
                                    )}
                                </HStack>
                            </Box>
                        </HStack>

                        <HStack gap={2} flexWrap="wrap" flexShrink={0}>
                          
                            {canManageSupplier && (
                                <Button px={'10px'} variant="outline" borderRadius="xl" color={accentColor} borderColor={isDark ? 'rgb(var(--accent-400) / .4)' : 'rgb(var(--accent-warm-200))'} _hover={{ bg: accentSoft }} onClick={() => setEditOpen(true)}>
                                    <HStack gap={2}><LuPen size={16} /><span>Tahrirlash</span></HStack>
                                </Button>
                            )}
                            {canManageSupplier && (
                                <Button bg={accentColor} color="black" borderRadius="xl" h="42px" px={5} fontWeight="semibold" _hover={{ bg: 'rgb(var(--accent-500))' }} onClick={() => setPaymentOpen(true)}>
                                    <HStack gap={2}><LuWallet size={16} /><span>Balansni to‘ldirish</span></HStack>
                                </Button>
                            )}
                        </HStack>
                    </HStack>
                </Box>
            </Box>

            {/* ── Ko‘rsatkichlar ── */}
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={4}>
                <StatCard
                    icon={LuScale}
                    label="Joriy balans"
                    value={`${balance < 0 ? '-' : ''}${formatNumber(Math.abs(balance))} so‘m`}
                    sub={balanceMeta.label}
                    iconBg={balanceMeta.soft}
                    iconColor={balanceMeta.color}
                    valueColor={balanceMeta.color}
                />
                <StatCard
                    icon={LuReceipt}
                    label="Oxirgi to‘lov"
                    value={lastPayment ? `${formatNumber(lastPayment.amount)} so‘m` : '—'}
                    sub={lastPayment ? `${formatPaidDate(lastPayment.paidAt)} · ${lastPayment.cashboxName || 'Kassa ko‘rsatilmagan'}` : 'Hali to‘lov qilinmagan'}
                    iconBg={accentSoft}
                    iconColor={accentColor}
                />
                <StatCard
                    icon={LuHistory}
                    label="Faol to‘lovlar"
                    value={`${formatNumber(activePaymentsCount)} ta`}
                    sub="Bekor qilinmagan to‘lovlar soni"
                    iconBg={isDark ? 'rgba(14,165,233,.12)' : '#E0F2FE'}
                    iconColor={isDark ? '#7DD3FC' : '#0284C7'}
                />
                <StatCard
                    icon={LuClock3}
                    label="Hamkorlik boshlangan"
                    value={formatDetailDate(supplier.createdAt).split(',')[0]}
                    sub={supplier.lastModifiedAt ? `Yangilangan: ${formatDetailDate(supplier.lastModifiedAt)}` : undefined}
                    iconBg={isDark ? 'rgba(139,92,246,.12)' : '#EDE9FE'}
                    iconColor={isDark ? '#C4B5FD' : '#7C3AED'}
                />
            </SimpleGrid>

            {/* ── Balans izohi ── */}
            <Box
                mb={4}
                px={{ base: 4, md: 5 }}
                py={3}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={balanceMeta.border}
                bg={balanceMeta.soft}
            >
                <HStack gap={2.5} align="start">
                    <Box color={balanceMeta.color} mt="2px"><LuCircleAlert size={16} /></Box>
                    <Text fontSize="sm" color={textColor}>
                        <Text as="span" fontWeight="semibold" color={balanceMeta.color}>{balanceMeta.label}.</Text>{' '}
                        {balanceMeta.hint}
                    </Text>
                </HStack>
            </Box>

            {/* ── Ma'lumotlar ── */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mb={4}>
                <InfoCard icon={LuTruck} title="Kontakt ma’lumotlari">
                    <InfoRow icon={LuTruck} label="Nomi" value={supplier.name} />
                    <InfoRow icon={LuPhone} label="Telefon" value={supplier.phone} href={phoneHref} />
                    <InfoRow icon={LuMapPin} label="Viloyat" value={supplier.region?.name} />
                    <InfoRow icon={LuMapPin} label="Manzil" value={supplier.address} />
                    <InfoRow icon={LuHash} label="INN / STIR" value={supplier.inn} mono />
                </InfoCard>
                <InfoCard icon={LuCalendar} title="Qo‘shimcha ma’lumotlar">
                    <InfoRow icon={LuStickyNote} label="Izoh" value={supplier.summary} />
                    <InfoRow icon={LuCalendar} label="Yaratilgan" value={formatDetailDate(supplier.createdAt)} />
                    <InfoRow icon={LuClock3} label="Oxirgi o‘zgarish" value={formatDetailDate(supplier.lastModifiedAt)} />
                    <InfoRow icon={LuHash} label="Tizim ID" value={supplier.id} mono />
                </InfoCard>
            </SimpleGrid>

            {/* ── To'lovlar tarixi ── */}
            <SupplierPaymentHistory supplier={supplier} />

            {/* ── Modallar ── */}
            <PaymentModal
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                supplierId={supplier.id}
                supplierName={supplier.name}
            />
            {editOpen && <Form supplier={supplier} hideTrigger openOnMount onClosed={() => setEditOpen(false)} />}
        </Box>
    );
}
