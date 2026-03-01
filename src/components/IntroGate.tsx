import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import TaskMateLogoAnimated from "./TaskMateLogoAnimated";

export default function IntroGate({ children }: { children: React.ReactNode }) {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setShow(false), 2100);
        return () => clearTimeout(t);
    }, []);

    if (!show) return <>{children}</>;

    return (
        <View className="flex-1 items-center justify-center bg-background">
            <TaskMateLogoAnimated mode="intro" loop />
        </View>
    );
}
