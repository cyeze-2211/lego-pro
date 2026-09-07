import { useColorMode, useColorModeValue } from "../Components/ui/color-mode";

// PLASTPRO Brand Theme Design Tokens
export const BRAND_COLORS = {
    yellow: "#FACC15",
    yellowHover: "#EAB308",
    yellowDarkText: "#0F172A",

    darkBg: "#0B0F17",
    darkCardBg: "#141C2B",
    darkSidebarBg: "#0E1524",
    darkHeaderBg: "rgba(20, 28, 43, 0.85)",
    darkBorder: "rgba(255, 255, 255, 0.08)",
    darkInputBg: "#1D283A",
    darkInputBorder: "#2D3B52",

    lightBg: "#F8FAFC",
    lightCardBg: "#FFFFFF",
    lightSidebarBg: "#FFFFFF",
    lightHeaderBg: "rgba(255, 255, 255, 0.85)",
    lightBorder: "rgba(226, 232, 240, 0.8)",
    lightInputBg: "#F1F5F9",
    lightInputBorder: "#E2E8F0",
};

export function useAppTheme() {
    const { colorMode, toggleColorMode, setColorMode } = useColorMode();
    const isDark = colorMode === "dark";

    const pageBg = useColorModeValue(BRAND_COLORS.lightBg, BRAND_COLORS.darkBg);
    const cardBg = useColorModeValue(BRAND_COLORS.lightCardBg, BRAND_COLORS.darkCardBg);
    const cardBorder = useColorModeValue(BRAND_COLORS.lightBorder, BRAND_COLORS.darkBorder);
    const cardShadow = useColorModeValue(
        "0 20px 60px rgba(15, 23, 42, 0.07)",
        "0 25px 70px rgba(0, 0, 0, 0.55)"
    );

    const sidebarBg = useColorModeValue(BRAND_COLORS.lightSidebarBg, BRAND_COLORS.darkSidebarBg);
    const sidebarBorder = useColorModeValue(BRAND_COLORS.lightBorder, BRAND_COLORS.darkBorder);
    
    const headerBg = useColorModeValue(BRAND_COLORS.lightHeaderBg, BRAND_COLORS.darkHeaderBg);
    const headerBorder = useColorModeValue(BRAND_COLORS.lightBorder, BRAND_COLORS.darkBorder);

    const inputBg = useColorModeValue(BRAND_COLORS.lightInputBg, BRAND_COLORS.darkInputBg);
    const inputBorder = useColorModeValue(BRAND_COLORS.lightInputBorder, BRAND_COLORS.darkInputBorder);
    const inputHoverBorder = useColorModeValue("#CBD5E1", "#3B4D6C");

    const textColor = useColorModeValue("gray.800", "gray.100");
    const subtitleColor = useColorModeValue("gray.500", "gray.400");
    const labelColor = useColorModeValue("gray.700", "gray.300");
    const iconColor = useColorModeValue("gray.400", "gray.500");

    return {
        colorMode,
        isDark,
        toggleColorMode,
        setColorMode,

        pageBg,
        cardBg,
        cardBorder,
        cardShadow,

        sidebarBg,
        sidebarBorder,

        headerBg,
        headerBorder,

        inputBg,
        inputBorder,
        inputHoverBorder,

        textColor,
        subtitleColor,
        labelColor,
        iconColor,

        accentColor: BRAND_COLORS.yellow,
        accentHover: BRAND_COLORS.yellowHover,
        accentDarkText: BRAND_COLORS.yellowDarkText,
    };
}
