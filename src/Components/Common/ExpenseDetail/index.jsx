import PropTypes from 'prop-types';
import { useParams, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Badge, Box, Button, HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import {
    LuArrowLeft, LuBanknote, LuCalendar, LuCircleAlert, LuClock3, LuExternalLink, LuHash,
    LuLayers, LuReceiptText, LuStickyNote, LuTag, LuWallet,
} from 'react-icons/lu';
import { useGetExpenseByIdQuery } from '../../../store/services/expense.api';
import { ROLES } from '../../../app/permissions/roles';
import { useAppSelector } from '../../../store/hooks';
import { useAppTheme } from '../../../theme/tokens';
import { formatNumber } from '../../ui/number-format';
import Loading from '../../Other/UI/Loadings/Loading';
import { formatDate, formatDateTime } from '../../ui/date-format';
import { CurrencyNote } from '../../ui/CurrencyAmountField';
import Edit from '../Expense/__components/Edit';
import Delete from '../Expense/__components/Delete';


/* ── Kichik UI bloklari ────────────────────────────────────────────────── */
function Card({ children, ...props }) {
    const { isDark, cardBg, cardBorder } = useAppTheme();
    return (
        <Box bg={cardBg} borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" overflow="hidden" boxShadow={isDark ? '0 12px 30px rgba(0,0,0,.16)' : '0 8px 22px rgba(15,23,42,.06)'} {...props}>
            {children}
        </Box>
    );
}
Card.propTypes = { children: PropTypes.node };

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, valueColor, to }) {
    const { textColor, subtitleColor, accentColor } = useAppTheme();
    return (
        <Card p={{ base: 4, md: 5 }} minW={0}>
            <HStack gap={3} align="start">
                <Box p={2.5} borderRadius="xl" bg={iconBg} color={iconColor} flexShrink={0}><Icon size={20} /></Box>
                <Box minW={0} flex={1}>
                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>{label}</Text>
                    {to ? (
                        <Text as={RouterLink} to={to} display="inline-flex" alignItems="center" gap={1.5} fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={textColor} lineHeight="1.2" mt={1} _hover={{ color: accentColor }}>
                            <Text as="span" truncate>{value}</Text><LuExternalLink size={14} />
                        </Text>
                    ) : (
                        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color={valueColor || textColor} lineHeight="1.2" mt={1} truncate>{value}</Text>
                    )}
                    {sub && <Text fontSize="sm" color={subtitleColor} mt={1}>{sub}</Text>}
                </Box>
            </HStack>
        </Card>
    );
}
StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node.isRequired, sub: PropTypes.node,
    iconBg: PropTypes.string.isRequired, iconColor: PropTypes.string.isRequired, valueColor: PropTypes.string, to: PropTypes.string,
};

function InfoRow({ icon: Icon, label, value, mono = false, emptyText = 'Ko‘rsatilmagan' }) {
    const { textColor, subtitleColor } = useAppTheme();
    const empty = value === null || value === undefined || value === '';
    return (
        <HStack gap={3} px={{ base: 4, md: 5 }} py={3} align="start">
            <Box color={subtitleColor} mt="2px" flexShrink={0}><Icon size={15} /></Box>
            <Box minW={0} flex={1}>
                <Text fontSize="xs" color={subtitleColor} fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">{label}</Text>
                {empty
                    ? <Text color={subtitleColor} fontSize="sm" mt={0.5}>{emptyText}</Text>
                    : <Text color={textColor} fontWeight="medium" fontSize="sm" mt={0.5} fontFamily={mono ? 'mono' : undefined} whiteSpace="pre-wrap" wordBreak="break-word">{value}</Text>}
            </Box>
        </HStack>
    );
}
InfoRow.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired, value: PropTypes.node, mono: PropTypes.bool, emptyText: PropTypes.string };

/* ── Sahifa ────────────────────────────────────────────────────────────── */
export default function ExpenseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const base = pathname.startsWith('/kassir') ? '/kassir' : '';
    const backTo = `${base}/expenses`;
    const role = useAppSelector((state) => state.auth.role);
    const canManage = role !== ROLES.XIMIK;

    const { data: expense, isLoading, isError } = useGetExpenseByIdQuery(id, { skip: !id });
    const { isDark, pageBg, cardBg, cardBorder, textColor, subtitleColor, accentColor, cardShadow } = useAppTheme();

    if (isLoading) {
        return <Box minH="60vh" display="flex" alignItems="center" justifyContent="center"><Loading /></Box>;
    }
    if (isError || !expense) {
        return (
            <Box minH="60vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} color={isDark ? 'red.300' : 'red.600'}>
                <LuCircleAlert size={34} />
                <Text fontSize="lg">Xarajat ma&apos;lumotini yuklashda xatolik</Text>
                <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}>
                    <HStack gap={2}><LuArrowLeft size={16} /><span>Xarajatlar ro‘yxatiga qaytish</span></HStack>
                </Button>
            </Box>
        );
    }

    const amount = Number(expense.amount) || 0;
    const accentSoft = isDark ? 'rgb(var(--accent-400) / .12)' : 'rgb(var(--accent-warm-100))';
    const dangerColor = isDark ? 'red.300' : 'red.600';
    const dangerSoft = isDark ? 'rgba(239,68,68,.12)' : '#FEF2F2';
    const violetSoft = isDark ? 'rgba(139,92,246,.12)' : '#EDE9FE';
    const violet = isDark ? '#C4B5FD' : '#7C3AED';
    const skySoft = isDark ? 'rgba(14,165,233,.12)' : '#E0F2FE';
    const sky = isDark ? '#7DD3FC' : '#0284C7';
    const greenSoft = isDark ? 'rgba(34,197,94,.12)' : '#ECFDF5';
    const green = isDark ? '#86EFAC' : '#15803D';
    const wasEdited = expense.lastModifiedAt && expense.createdAt && expense.lastModifiedAt !== expense.createdAt;

    return (
        <Box bg={pageBg} color={textColor} minH="100%" w="100%">
            {/* ── Sarlavha ── */}
            <Box overflow="hidden" borderWidth="1px" borderColor={cardBorder} borderRadius="2xl" boxShadow={cardShadow} mb={4}>
                <Box h="5px" bg={`linear-gradient(90deg, ${accentColor}, rgb(var(--accent-warm-200)))`} />
                <Box bg={cardBg} p={{ base: 4, md: 6 }}>
                    <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                        <HStack gap={4} minW={0} align="start">
                            <Box p={3.5} borderRadius="xl" bg={accentSoft} color={accentColor} flexShrink={0}><LuReceiptText size={28} /></Box>
                            <Box minW={0}>
                                <HStack gap={2} flexWrap="wrap" mb={1}>
                                    <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color={subtitleColor}>Xarajat</Text>
                                    {expense.categoryName && (
                                        <Badge borderRadius="full" px={2.5} py={0.5} fontSize="11px" fontWeight="semibold" bg={violetSoft} color={violet}>
                                            <HStack gap={1} display="inline-flex"><LuLayers size={11} /><span>{expense.categoryName}</span></HStack>
                                        </Badge>
                                    )}
                                </HStack>
                                <Heading size={{ base: 'lg', md: 'xl' }} color={textColor} lineHeight="1.15" wordBreak="break-word">{expense.name}</Heading>
                                <HStack gap={4} mt={2} flexWrap="wrap" color={subtitleColor} fontSize="sm">
                                    <HStack gap={1.5}><LuCalendar size={14} /><span>{formatDate(expense.expenseDate)}</span></HStack>
                                    {expense.createdAt && <HStack gap={1.5}><LuClock3 size={14} /><span>Kiritilgan: {formatDateTime(expense.createdAt)}</span></HStack>}
                                    {expense.cashboxName && <HStack gap={1.5}><LuWallet size={14} /><span>{expense.cashboxName}</span></HStack>}
                                </HStack>
                            </Box>
                        </HStack>

                        <HStack gap={2} flexWrap="wrap" flexShrink={0}>
                            <Button variant="outline" borderRadius="xl" h="42px" px={4} onClick={() => navigate(backTo)}>
                                <HStack gap={2}><LuArrowLeft size={16} /><span>Ro‘yxatga</span></HStack>
                            </Button>
                            {canManage && <Edit expense={expense} label="Tahrirlash" />}
                            {canManage && <Delete expense={expense} label="O‘chirish" onDeleted={() => navigate(backTo)} />}
                        </HStack>
                    </HStack>
                </Box>
            </Box>

            {/* ── Ko‘rsatkichlar ── */}
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4} mb={4}>
                <StatCard icon={LuBanknote} label="Summa" value={`-${formatNumber(amount)} so‘m`} sub={expense.currency === 'USD' ? <CurrencyNote currency="USD" usdRate={expense.usdRate} amount={amount} fontSize="sm" /> : 'So‘mda to‘langan'} iconBg={dangerSoft} iconColor={dangerColor} valueColor={dangerColor} />
                <StatCard icon={LuWallet} label="Kassa" value={expense.cashboxName || '—'} sub="Qaysi kassadan to‘langan" iconBg={greenSoft} iconColor={green} to={expense.cashboxId ? `${base}/cashboxes/${expense.cashboxId}` : undefined} />
                <StatCard icon={LuLayers} label="Kategoriya" value={expense.categoryName || '—'} sub="Xarajat turi" iconBg={violetSoft} iconColor={violet} />
                <StatCard icon={LuCalendar} label="Xarajat sanasi" value={formatDate(expense.expenseDate)} sub={`Kiritilgan: ${formatDateTime(expense.createdAt)}`} iconBg={skySoft} iconColor={sky} />
            </SimpleGrid>

            {/* ── Ma'lumotlar ── */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
                <Card>
                    <HStack gap={2} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                        <LuReceiptText size={17} color={accentColor} />
                        <Heading size="sm" color={textColor}>Xarajat ma’lumotlari</Heading>
                    </HStack>
                    <VStack align="stretch" gap={0} css={{ '& > * + *': { borderTopWidth: '1px', borderTopColor: cardBorder } }}>
                        <InfoRow icon={LuTag} label="Nomi" value={expense.name} />
                        <InfoRow icon={LuStickyNote} label="Izoh" value={expense.summary} emptyText="Izoh yo‘q" />
                        <InfoRow icon={LuLayers} label="Kategoriya" value={expense.categoryName} />
                        <InfoRow icon={LuWallet} label="Kassa" value={expense.cashboxName} />
                        <InfoRow icon={LuBanknote} label="Summa" value={`${formatNumber(amount)} so‘m`} />
                        <InfoRow icon={LuBanknote} label="Valyuta" value={expense.currency === 'USD' ? `Dollar (USD) · kurs 1 $ = ${formatNumber(expense.usdRate || 0)} so‘m` : 'So‘m (UZS)'} />
                    </VStack>
                </Card>
                <Card>
                    <HStack gap={2} px={{ base: 4, md: 5 }} py={3.5} borderBottomWidth="1px" borderColor={cardBorder}>
                        <LuClock3 size={17} color={accentColor} />
                        <Heading size="sm" color={textColor}>Tizim ma’lumotlari</Heading>
                    </HStack>
                    <VStack align="stretch" gap={0} css={{ '& > * + *': { borderTopWidth: '1px', borderTopColor: cardBorder } }}>
                        <InfoRow icon={LuCalendar} label="Xarajat sanasi" value={formatDate(expense.expenseDate)} />
                        <InfoRow icon={LuClock3} label="Kiritilgan vaqt" value={formatDateTime(expense.createdAt)} />
                        <InfoRow icon={LuClock3} label="Oxirgi o‘zgarish" value={wasEdited ? formatDateTime(expense.lastModifiedAt) : null} emptyText="O‘zgartirilmagan" />
                        <InfoRow icon={LuHash} label="Tizim ID" value={expense.id} mono />
                    </VStack>
                </Card>
            </SimpleGrid>
        </Box>
    );
}
