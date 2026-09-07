import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Button,
    Container,
    Field,
    Heading,
    Input,
    InputGroup,
    Spinner,
    Stack,
    Text,
    VStack,
    HStack,
    Icon,
    IconButton,
} from "@chakra-ui/react";

import {
    LuArrowRight,
    LuLockKeyhole,
    LuMonitor,
    LuEye,
    LuEyeOff,
    LuSun,
    LuMoon,
} from "react-icons/lu";

import { useAppDispatch } from "../../../store/hooks";
import { setAuth, setDeviceAuth } from "../../../store/slices/auth.slice";
import { useGetUsersQuery, useLoginMutation, useUserLoginMutation } from "../../../store/services/auth.api";
import { useAppTheme } from "../../../theme/tokens";

import YellowLogo from "../../../Images/Yellow Unified Lego Outlined.svg";

export default function Login() {
    const [step, setStep] = useState("device");
    const [deviceName, setDeviceName] = useState("");
    const [devicePassword, setDevicePassword] = useState("ChangeMe123!");
    const [userId, setUserId] = useState("");
    const [pin, setPin] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [deviceLogin, deviceResult] = useLoginMutation();
    const [userLogin, userResult] = useUserLoginMutation();
    const usersResult = useGetUsersQuery(undefined, { skip: step !== "user" });
    const users = usersResult.data?.data;
    const isLoading = deviceResult.isLoading || userResult.isLoading || usersResult.isLoading;
    const error = deviceResult.error || userResult.error || usersResult.error;

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        isDark,
        toggleColorMode,
        pageBg,
        cardBg,
        cardBorder,
        cardShadow,
        inputBg,
        inputBorder,
        inputHoverBorder,
        textColor,
        subtitleColor,
        labelColor,
        iconColor,
    } = useAppTheme();

    useEffect(() => {
        if (step === "user" && users?.length === 1) {
            setUserId(String(users[0].id));
        }
    }, [step, users]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (step === "device") {
                const response = await deviceLogin({
                    deviceName: deviceName.trim(),
                    password: devicePassword,
                }).unwrap();

                dispatch(setDeviceAuth({
                    deviceToken: response.data.deviceToken,
                    deviceName: response.data.deviceName,
                }));
                setStep("user");
                return;
            }

            const response = await userLogin({
                userId: userId.trim(),
                code: pin,
            }).unwrap();

            dispatch(setAuth({
                token: response.data.accessToken,
                userId: response.data.id,
            }));
            navigate("/");
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    const goBackToDevice = () => {
        setStep("device");
        setPin("");
    };

    return (
        <Box
            minH="100vh"
            bg={pageBg}
            position="relative"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            transition="background-color 0.3s ease"
        >
            {/* Background Ambient Glow Accent */}
            <Box
                position="absolute"
                w="500px"
                h="500px"
                bg={isDark ? "rgba(250, 204, 21, 0.05)" : "rgba(234, 179, 8, 0.07)"}
                borderRadius="full"
                filter="blur(130px)"
                top="-120px"
                left="-120px"
                pointerEvents="none"
            />

            <Box
                position="absolute"
                w="450px"
                h="450px"
                bg={isDark ? "rgba(30, 41, 59, 0.35)" : "rgba(203, 213, 225, 0.3)"}
                borderRadius="full"
                filter="blur(130px)"
                bottom="-120px"
                right="-120px"
                pointerEvents="none"
            />

            {/* Top-Right Theme Switcher */}
            <Box
                position="absolute"
                top="24px"
                right="24px"
                zIndex={10}
            >
                <Button
                    onClick={toggleColorMode}
                    variant="outline"
                    size="sm"
                    h="40px"
                    px={4}
                    borderRadius="full"
                    bg={isDark ? "#1E293B" : "white"}
                    borderColor={isDark ? "gray.700" : "gray.200"}
                    color={isDark ? "gray.200" : "gray.700"}
                    boxShadow="sm"
                    _hover={{
                        bg: isDark ? "#2D3B52" : "gray.50",
                        transform: "translateY(-1px)",
                    }}
                    transition="all 0.2s"
                >
                    <HStack gap={2}>
                        <Icon color={isDark ? "yellow.400" : "amber.500"}>
                            {isDark ? <LuSun /> : <LuMoon />}
                        </Icon>
                        <Text fontSize="13px" fontWeight="600">
                            {isDark ? "Yorug‘ tema" : "Qorong‘i tema"}
                        </Text>
                    </HStack>
                </Button>
            </Box>

            {/* Single Login Card */}
            <Container maxW="440px" px={4} py={8} position="relative" zIndex={1}>
                <Box
                    w="100%"
                    bg={cardBg}
                    borderRadius="24px"
                    border="1px solid"
                    borderColor={cardBorder}
                    boxShadow={cardShadow}
                    p={{ base: 6, sm: 9 }}
                    transition="all 0.3s ease"
                >
                    <VStack align="stretch" gap={6}>
                        {/* Centered Logo & Header */}
                        <VStack gap={4} textAlign="center">
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                px={6}
                                py={3.5}
                                borderRadius="20px"
                                bg={isDark ? "rgba(255, 255, 255, 0.03)" : "#0F172A"}
                                border="1px solid"
                                borderColor={isDark ? "rgba(250, 204, 21, 0.2)" : "transparent"}
                                boxShadow={isDark ? "0 0 20px rgba(250, 204, 21, 0.08)" : "0 8px 20px rgba(15, 23, 42, 0.15)"}
                                w="max-content"
                                mx="auto"
                            >
                                <img
                                    src={YellowLogo}
                                    alt="PLASTPRO Logo"
                                    style={{ height: "76px", width: "auto", objectFit: "contain" }}
                                />
                            </Box>

                            <Box>
                                <Heading
                                    fontSize="24px"
                                    fontWeight="700"
                                    letterSpacing="-0.5px"
                                    color={textColor}
                                    mb={1}
                                >
                                    {step === "device" ? "Qurilmani ulash" : "Foydalanuvchi kirishi"}
                                </Heading>

                                <Text color={subtitleColor} fontSize="14px">
                                    {step === "device"
                                        ? "Davom etish uchun qurilma ma’lumotlarini kiriting"
                                        : users?.length > 1
                                            ? "Foydalanuvchini tanlang va 6 xonali PIN-kodni kiriting"
                                            : "6 xonali PIN-kodni kiriting"}
                                </Text>
                            </Box>
                        </VStack>

                        {/* Login Form */}
                        <Box as="form" onSubmit={handleSubmit}>
                            <Stack gap={4}>
                                {step === "device" ? (
                                <Field.Root>
                                    <Field.Label
                                        fontSize="13px"
                                        fontWeight="600"
                                        color={labelColor}
                                        mb={1.5}
                                    >
                                        {step === "device" ? "Qurilma nomi" : "Foydalanuvchi ID raqami"}
                                    </Field.Label>

                                    <InputGroup
                                        startElement={
                                            <Icon color={iconColor}>
                                                {step === "device" ? <LuMonitor /> : <LuLockKeyhole />}
                                            </Icon>
                                        }
                                    >
                                        <Input
                                            id={step === "device" ? "device-name" : "user-id"}
                                            type="text"
                                            placeholder={step === "device" ? "Masalan, cashbox-01" : "Foydalanuvchi UUID raqami"}
                                            value={step === "device" ? deviceName : userId}
                                            onChange={(e) => (step === "device" ? setDeviceName(e.target.value) : setUserId(e.target.value))}
                                            required
                                            size="lg"
                                            h="50px"
                                            fontSize="14px"
                                            borderRadius="14px"
                                            bg={inputBg}
                                            borderColor={inputBorder}
                                            color={textColor}
                                            _hover={{
                                                borderColor: inputHoverBorder,
                                            }}
                                            _focus={{
                                                borderColor: "#FACC15",
                                                boxShadow: "0 0 0 2px rgba(250, 204, 21, 0.35)",
                                                bg: isDark ? "#141C2B" : "#FFFFFF",
                                            }}
                                            transition="all 0.2s"
                                        />
                                    </InputGroup>
                                </Field.Root>
                                ) : users?.length > 1 ? (
                                <Field.Root>
                                    <Field.Label
                                        fontSize="13px"
                                        fontWeight="600"
                                        color={labelColor}
                                        mb={1.5}
                                    >
                                        Foydalanuvchi
                                    </Field.Label>

                                    {usersResult.isLoading ? (
                                        <HStack h="50px" color={subtitleColor}>
                                            <Spinner size="sm" />
                                            <Text fontSize="14px">Foydalanuvchilar yuklanmoqda...</Text>
                                        </HStack>
                                    ) : (
                                        <Box
                                            as="select"
                                            id="user-id"
                                            value={userId}
                                            onChange={(e) => setUserId(e.target.value)}
                                            required
                                            h="50px"
                                            w="100%"
                                            px={4}
                                            fontSize="14px"
                                            borderRadius="14px"
                                            border="1px solid"
                                            borderColor={inputBorder}
                                            bg={inputBg}
                                            color={textColor}
                                            _focus={{
                                                borderColor: "#FACC15",
                                                boxShadow: "0 0 0 2px rgba(250, 204, 21, 0.35)",
                                            }}
                                        >
                                            <option value="" disabled>Foydalanuvchini tanlang</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>{user.username}</option>
                                            ))}
                                        </Box>
                                    )}
                                </Field.Root>
                                ) : null}

                                <Field.Root>
                                    <Field.Label
                                        fontSize="13px"
                                        fontWeight="600"
                                        color={labelColor}
                                        mb={1.5}
                                    >
                                        {step === "device" ? "Qurilma paroli" : "6 xonali PIN-kod"}
                                    </Field.Label>

                                    <InputGroup
                                        startElement={
                                            <Icon color={iconColor}>
                                                <LuLockKeyhole />
                                            </Icon>
                                        }
                                        endElement={step === "device" && (
                                            <IconButton
                                                aria-label="Parolni ko‘rsatish yoki yashirish"
                                                variant="ghost"
                                                size="xs"
                                                color={iconColor}
                                                _hover={{ color: textColor, bg: "transparent" }}
                                                onClick={() => setShowPassword(!showPassword)}
                                                tabIndex={-1}
                                            >
                                                <Icon boxSize="16px">
                                                    {showPassword ? <LuEyeOff /> : <LuEye />}
                                                </Icon>
                                            </IconButton>
                                        )}
                                    >
                                        <Input
                                            id="pin"
                                            placeholder={step === "device" ? "Qurilma paroli" : "6 ta raqam kiriting"}
                                            value={step === "device" ? devicePassword : pin}
                                            onChange={(e) => (step === "device" ? setDevicePassword(e.target.value) : setPin(e.target.value.replace(/\D/g, "").slice(0, 6)))}
                                            inputMode={step === "user" ? "numeric" : undefined}
                                            maxLength={step === "user" ? 6 : undefined}
                                            pattern={step === "user" ? "[0-9]{6}" : undefined}
                                            type={step === "user" ? "password" : (showPassword ? "text" : "password")}
                                            required
                                            size="lg"
                                            h="50px"
                                            fontSize="14px"
                                            borderRadius="14px"
                                            bg={inputBg}
                                            borderColor={inputBorder}
                                            color={textColor}
                                            _hover={{
                                                borderColor: inputHoverBorder,
                                            }}
                                            _focus={{
                                                borderColor: "#FACC15",
                                                boxShadow: "0 0 0 2px rgba(250, 204, 21, 0.35)",
                                                bg: isDark ? "#141C2B" : "#FFFFFF",
                                            }}
                                            transition="all 0.2s"
                                        />
                                    </InputGroup>
                                </Field.Root>

                                {error && (
                                    <Box
                                        bg={isDark ? "rgba(239, 68, 68, 0.12)" : "red.50"}
                                        border="1px solid"
                                        borderColor={isDark ? "rgba(239, 68, 68, 0.3)" : "red.200"}
                                        borderRadius="12px"
                                        px={4}
                                        py={3}
                                    >
                                        <Text
                                            color={isDark ? "red.300" : "red.600"}
                                            fontSize="13px"
                                            fontWeight="500"
                                        >
                                                {error?.data?.message || "Kirish amalga oshmadi. Ma’lumotlarni tekshiring."}
                                        </Text>
                                    </Box>
                                )}

                                <Button
                                    type="submit"
                                    h="50px"
                                    borderRadius="14px"
                                    bg="#FACC15"
                                    color="#0F172A"
                                    fontSize="15px"
                                    fontWeight="700"
                                    mt={2}
                                    disabled={isLoading}
                                    transition="all 0.2s ease-in-out"
                                    _hover={{
                                        bg: "#EAB308",
                                        transform: "translateY(-1px)",
                                        boxShadow: "0 10px 25px rgba(250, 204, 21, 0.35)",
                                    }}
                                    _active={{
                                        transform: "translateY(0)",
                                    }}
                                >
                                    {isLoading ? (
                                        <HStack gap={2}>
                                            <Spinner size="sm" color="#0F172A" />
                                            <Text>Tekshirilmoqda...</Text>
                                        </HStack>
                                    ) : (
                                        <HStack gap={2}>
                                            <Text>{step === "device" ? "Davom etish" : "Tizimga kirish"}</Text>
                                            <LuArrowRight boxSize="18px" />
                                        </HStack>
                                    )}
                                </Button>
                                {step === "user" && (
                                    <Button type="button" variant="ghost" onClick={goBackToDevice} color={subtitleColor}>
                                        Qurilmani almashtirish
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
}