import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import TaskMateLogoStatic from './TaskMateLogoStatic';

type Props = {
    rightContent?: ReactNode;
    variant?: "normal" | "light";
};

export default function DashboardHeader({ rightContent, variant = "normal" }: Props) {
    return (
        <View className="flex-row justify-between items-center px-6 py-4 w-full">
            <TaskMateLogoStatic size="medium" variant={variant} />
            {rightContent && (
                <View className="items-center justify-center">
                    {rightContent}
                </View>
            )}
        </View>
    );
}
