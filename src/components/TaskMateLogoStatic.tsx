import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

type Props = {
    size?: "small" | "medium" | "large";
    variant?: "normal" | "light";
    // Legacy props to prevent breaking auth screens if they still use them
    scale?: number;
    showText?: boolean;
};

export default function TaskMateLogoStatic({ size, variant = "normal", scale: customScale, showText = true }: Props) {
    const scaleMap = {
        small: 0.5,
        medium: 0.65,
        large: 0.9,
    };

    // If a custom scale is provided, use it, else fallback to size map
    const scale = customScale !== undefined ? customScale : (size ? scaleMap[size] : scaleMap.medium);

    const isLight = variant === "light";

    // Colors
    const primaryTeal = isLight ? "#FFFFFF" : "#17B8B8";
    const primaryGreen = isLight ? "#FFFFFF" : "#24C46A";
    const leafPrimary = isLight ? "#FFFFFF" : "#35D07F";
    const leafAccent = isLight ? "#E2F2E9" : "#D6FF8A";
    const notchOpacity = isLight ? 0.4 : 0.18;

    const svgWidth = 92 * scale;
    const svgHeight = 110 * scale;
    const fontSize = 38 * scale;
    const marginLeft = 6 * scale;

    return (
        <View style={styles.wrap}>
            <Svg width={svgWidth} height={svgHeight} viewBox="0 0 92 110">
                <Rect x={16} y={8} width={56} height={94} rx={12} stroke={primaryTeal} strokeWidth={4} fill="transparent" />
                <Rect x={34} y={8} width={20} height={6} rx={3} fill={primaryTeal} opacity={notchOpacity} />
                <Rect x={28} y={30} width={32} height={24} rx={6} stroke={primaryTeal} strokeWidth={3} fill="transparent" />
                <Rect x={28} y={60} width={32} height={24} rx={6} stroke={primaryTeal} strokeWidth={3} fill="transparent" />
                <Path d="M34 42 L41 49 L55 35" stroke={primaryTeal} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M34 72 L41 79 L55 65" stroke={primaryTeal} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M16 54 C6 42, 6 66, 16 54 C26 42, 26 66, 16 54 Z" fill={leafPrimary} opacity={isLight ? 1 : 0.95} />
                <Path d="M14 54 C10 50, 10 58, 14 54" stroke={leafAccent} strokeWidth={2.5} strokeLinecap="round" opacity={isLight ? 0.4 : 0.75} />
            </Svg>
            {showText && (
                <View style={{ justifyContent: "center", marginLeft }}>
                    <Text style={{ fontSize, fontWeight: "900", letterSpacing: 0.2 }}>
                        <Text style={{ color: primaryTeal }}>Task</Text>
                        <Text style={{ color: primaryGreen }}>Mate</Text>
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
    },
});
