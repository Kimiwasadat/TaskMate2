import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
    SharedValue,
    useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
    loop?: boolean;
    onDone?: () => void;
    mode?: "intro" | "loading";
};

const DURATION = {
    check: 260,
    gap: 70,
    afterChecksPause: 140,
    letter: 55,
};

const WORD = "TaskMate";

export default function TaskMateLogoAnimated({ loop = true, onDone, mode = "loading" }: Props) {
    const isIntro = mode === "intro";
    const check1 = useSharedValue(0);
    const check2 = useSharedValue(0);

    const letters = useMemo(() => WORD.split(""), []);
    const letterProg = letters.map(() => useSharedValue(0));

    const cycle = () => {
        check1.value = 0;
        check2.value = 0;
        letterProg.forEach((sv) => (sv.value = 0));

        check1.value = withTiming(1, {
            duration: DURATION.check,
            easing: Easing.out(Easing.cubic),
        });

        check2.value = withDelay(
            DURATION.check + DURATION.gap,
            withTiming(1, {
                duration: DURATION.check,
                easing: Easing.out(Easing.cubic),
            })
        );

        const checksTotal =
            DURATION.check + DURATION.gap + DURATION.check + DURATION.afterChecksPause;

        let total = checksTotal;

        if (isIntro) {
            letterProg.forEach((sv, idx) => {
                const delay = checksTotal + idx * DURATION.letter;
                sv.value = withDelay(
                    delay,
                    withSequence(
                        withTiming(1.12, {
                            duration: 120,
                            easing: Easing.out(Easing.cubic),
                        }),
                        withTiming(1, {
                            duration: 140,
                            easing: Easing.out(Easing.cubic),
                        })
                    )
                );
            });
            total += letters.length * DURATION.letter + 260;
        } else {
            // For loading mode, standard loop duration around ~1.2s - 1.6s.
            // checksTotal is ~710ms. Add an extra 500ms for a breathing pause before the loop restarts.
            total += 500;
        }

        if (loop) {
            setTimeout(() => cycle(), total);
        } else if (onDone) {
            setTimeout(() => onDone(), total);
        }
    };

    useEffect(() => {
        cycle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loop]);

    const CHECK_LEN = 48;

    const check1Props = useAnimatedProps(() => ({
        strokeDashoffset: (1 - check1.value) * CHECK_LEN,
        opacity: check1.value === 0 ? 0 : 1,
    }));

    const check2Props = useAnimatedProps(() => ({
        strokeDashoffset: (1 - check2.value) * CHECK_LEN,
        opacity: check2.value === 0 ? 0 : 1,
    }));

    return (
        <View style={styles.wrap}>
            <View style={styles.left}>
                <Svg width={92} height={110} viewBox="0 0 92 110">
                    {/* Phone outline */}
                    <Rect
                        x={16}
                        y={8}
                        width={56}
                        height={94}
                        rx={12}
                        stroke="#17b6b6"
                        strokeWidth={4}
                        fill="transparent"
                    />
                    {/* Notch */}
                    <Rect x={34} y={8} width={20} height={6} rx={3} fill="#17b6b6" opacity={0.18} />

                    {/* Two boxes */}
                    <Rect x={28} y={30} width={32} height={24} rx={6} stroke="#17b6b6" strokeWidth={3} fill="transparent" />
                    <Rect x={28} y={60} width={32} height={24} rx={6} stroke="#17b6b6" strokeWidth={3} fill="transparent" />

                    {/* Check #1 */}
                    <AnimatedPath
                        animatedProps={check1Props}
                        d="M34 42 L41 49 L55 35"
                        stroke="#17b6b6"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
                    />

                    {/* Check #2 */}
                    <AnimatedPath
                        animatedProps={check2Props}
                        d="M34 72 L41 79 L55 65"
                        stroke="#17b6b6"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
                    />

                    {/* Leaf (placeholder shape; can be replaced with exact logo leaf later) */}
                    <Path
                        d="M16 54 C6 42, 6 66, 16 54 C26 42, 26 66, 16 54 Z"
                        fill="#35d07f"
                        opacity={0.95}
                    />
                    <Path
                        d="M14 54 C10 50, 10 58, 14 54"
                        stroke="#d6ff8a"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        opacity={0.75}
                    />
                </Svg>
            </View>

            {isIntro && (
                <View style={styles.right}>
                    <View style={styles.wordRow}>
                        {letters.map((ch, i) => (
                            <Animated.Text
                                key={`${ch}-${i}`}
                                style={[styles.letter, useLetterStyle(letterProg[i])]}
                            >
                                {ch}
                            </Animated.Text>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

function useLetterStyle(progress: SharedValue<number>) {
    return useAnimatedStyle(() => {
        const scale = progress.value;
        const opacity = Math.min(1, progress.value);
        const translateX = (1 - Math.min(1, progress.value)) * -8;
        return {
            opacity,
            transform: [{ translateX }, { scale }],
        } as any;
    });
}

const styles = StyleSheet.create({
    wrap: { flexDirection: "row", alignItems: "center" },
    left: { marginRight: 10 },
    right: { justifyContent: "center" },
    wordRow: { flexDirection: "row", alignItems: "flex-end" },
    letter: {
        fontSize: 34,
        fontWeight: "800",
        letterSpacing: 0.2,
        color: "#27c66f",
    },
});
