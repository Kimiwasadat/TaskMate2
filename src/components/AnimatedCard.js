import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    FadeInUp,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedCard({
    children,
    onPress,
    delay = 0,
    className = "",
}) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <AnimatedPressable
            entering={FadeInUp.delay(delay).springify().damping(14)}
            onPressIn={() => {
                scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { damping: 15, stiffness: 200 });
            }}
            onPress={onPress}
            className={`bg-surface-glass p-5 rounded-3xl mb-4 border border-white shadow-sm overflow-hidden ${className}`}
            style={[animatedStyle, styles.glass]}
        >
            {children}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    glass: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    }
});
