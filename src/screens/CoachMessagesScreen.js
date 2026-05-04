import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { getAssignedClientsForCoach, subscribeToCoachChats } from "../services/firestoreService";

export default function CoachMessagesScreen({ navigation }) {
  const { user } = useUser();
  const [clients, setClients] = useState([]);
  const [chats, setChats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
    
    if (user) {
      const unsubscribe = subscribeToCoachChats(user.id, (fetchedChats) => {
        const chatsMap = {};
        fetchedChats.forEach(chat => {
          chatsMap[chat.clientId] = chat;
        });
        setChats(chatsMap);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedClients = await getAssignedClientsForCoach(user.id);
      setClients(fetchedClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderClientItem = ({ item }) => {
    const displayName = item.username || item.firstName || "Messenger";
    const displayInitial = displayName[0]?.toUpperCase() || "?";
    
    const chat = chats[item.id];
    const unreadCount = chat?.unreadByCoach || 0;
    const hasUnread = unreadCount > 0;
    
    let previewText = "No messages yet";
    if (chat?.lastMessageText) {
      if (chat.lastMessageSenderId === user.id) {
        previewText = `You: ${chat.lastMessageText}`;
      } else {
        previewText = chat.lastMessageText;
      }
    } else if (item.email) {
      previewText = item.email;
    }
    
    return (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() =>
          navigation.navigate("Chat", {
            coachId: user.id,
            clientId: item.id,
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayInitial}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.clientName, hasUnread && styles.boldText]} numberOfLines={1}>
              {displayName} {item.lastName || ""}
            </Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
          <Text 
            style={[styles.clientEmail, hasUnread && styles.boldMessageText]}
            numberOfLines={1}
          >
            {previewText}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#14B8B8" />
          </View>
        ) : clients.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No assigned messengers yet.</Text>
            <Text style={styles.emptySubtext}>
              Assign a plan to a messenger to start chatting.
            </Text>
          </View>
        ) : (
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id}
            renderItem={renderClientItem}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  clientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0F2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0E7C7C",
  },
  clientInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingRight: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  boldText: {
    fontWeight: "800",
    color: "#000",
  },
  boldMessageText: {
    fontWeight: "700",
    color: "#1F2937",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#14B8B8",
    marginLeft: 8,
  },
  clientEmail: {
    fontSize: 14,
    color: "#6B7280",
    paddingRight: 8,
  },
});
