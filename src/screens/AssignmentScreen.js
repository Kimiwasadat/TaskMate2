import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { coachListPlans, coachAssignPlanToClient, getPrototypeEmployees } from '../services/backend';
import { Picker } from '@react-native-picker/picker';
import LoadingLogo from '../components/LoadingLogo';

export default function AssignmentScreen({ navigation }) {
    const { user } = useUser();
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');

    useEffect(() => {
        coachListPlans(user.id, user.publicMetadata.role).then(data => {
            const published = data.filter(p => p.isPublished);
            setPlans(published);
            if (published.length > 0) setSelectedPlanId(published[0].id);
        });

        getPrototypeEmployees().then(data => {
            setClients(data);
            if (data.length > 0) setSelectedClientId(data[0].id);
        });
    }, [user]);

    const handleAssign = async () => {
        if (!selectedPlanId) {
            Alert.alert("Error", "Please select a plan.");
            return;
        }
        if (!selectedClientId) {
            Alert.alert("Error", "Please select a client.");
            return;
        }

        setLoading(true);
        try {
            await coachAssignPlanToClient(user.id, user.publicMetadata.role, selectedPlanId, selectedClientId);
            Alert.alert("Success", "Plan assigned to client successfully!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-row justify-between items-center mb-8 mt-2">
                <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <Text className="text-text-muted font-bold text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-text-primary">Assign Plan</Text>
                <View style={{ width: 50 }} />
            </View>

            <View className="flex-1">
                <Text className="text-text-primary font-bold mb-2 text-lg">Select Plan</Text>
                <View className="bg-surface border border-border rounded-xl mb-6 p-2 shadow-sm">
                    {/* Primitive dropdown substitution since we don't have standard cross-platform picker installed natively in expo by default */}
                    {plans.length === 0 ? (
                        <Text className="text-text-muted p-2">No published plans available.</Text>
                    ) : (
                        plans.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                activeOpacity={0.7}
                                onPress={() => setSelectedPlanId(p.id)}
                                className={`p-4 rounded-lg mb-1 ${selectedPlanId === p.id ? 'bg-primary/20 border border-primary/30' : ''}`}
                            >
                                <Text className={`font-medium ${selectedPlanId === p.id ? 'text-primary-dark font-bold' : 'text-text-primary'}`}>
                                    {p.title}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <Text className="text-text-primary font-bold mb-2 text-lg">Select Client</Text>
                <Text className="text-text-muted mb-2 text-sm">Choose an employee from the workspace.</Text>

                <View className="bg-surface border border-border rounded-xl mb-8 overflow-hidden shadow-sm">
                    <Picker
                        selectedValue={selectedClientId}
                        onValueChange={(itemValue) => setSelectedClientId(itemValue)}
                    >
                        {clients.map(c => (
                            <Picker.Item key={c.id} label={`${c.name} (${c.email})`} value={c.id} />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity
                    onPress={handleAssign}
                    disabled={loading || plans.length === 0}
                    activeOpacity={0.8}
                    className={`h-[56px] rounded-[14px] items-center justify-center ${loading || plans.length === 0 ? 'bg-surface border border-border' : 'bg-primary active:bg-primary-dark'}`}
                >
                    {loading ? (
                        <ActivityIndicator color={loading || plans.length === 0 ? '#5B667A' : 'white'} />
                    ) : (
                        <Text className={`font-bold text-lg ${loading || plans.length === 0 ? 'text-text-muted' : 'text-white'}`}>Confirm Assignment</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
