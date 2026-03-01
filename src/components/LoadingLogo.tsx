import React from "react";
import { View, StyleSheet } from "react-native";
import TaskMateLogoAnimated from "./TaskMateLogoAnimated";

export default function LoadingLogo() {
    return (
        <View style={styles.container}>
            <TaskMateLogoAnimated mode="loading" loop={true} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});
