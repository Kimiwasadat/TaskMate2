import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { subscribeToMessages, sendMessage, getUserPushToken, markChatAsRead } from "../services/firestoreService";
import { sendPushNotification } from "../services/notificationService";
import { ROLES, normalizeRole } from "../auth/rbac";

export default function ChatScreen({ route, navigation }) {
  const { user } = useUser();
  const { coachId, clientId, taskContext } = route.params;
  const role = normalizeRole(user);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  // We no longer prepopulate the input text with taskContext, 
  // as it is already rendered as a separate context tag above the message bubble.

  useEffect(() => {
    if (!coachId || !clientId) return;

    const unsubscribe = subscribeToMessages(coachId, clientId, (fetchedMessages) => {
      setMessages(fetchedMessages);
      setLoading(false);
      
      // Mark as read whenever new messages load
      markChatAsRead(coachId, clientId, user.id);
    });

    return () => unsubscribe();
  }, [coachId, clientId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText(""); // Optimistic clear

    try {
      await sendMessage(coachId, clientId, user.id, textToSend, taskContext);
      
      try {
        const recipientId = user.id === coachId ? clientId : coachId;
        const recipientToken = await getUserPushToken(recipientId);
        
        if (recipientToken) {
          const senderName = user?.firstName || "Someone";
          await sendPushNotification(
            recipientToken,
            `New message from ${senderName}`,
            textToSend,
            { type: 'chat', coachId, clientId, taskContext }
          );
        }
      } catch (notifErr) {
        console.error("Failed to notify recipient:", notifErr);
      }
      
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
      setInputText(textToSend); // Restore if failed
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}
        >
          {item.taskContext && (
            <Text style={[styles.contextText, isMe ? styles.contextTextMe : styles.contextTextOther]}>
              {item.taskContext}
            </Text>
          )}
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Simple Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {role === ROLES.COACH ? "Chat with Messenger" : "Chat with Coach"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14B8B8" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 8,
  },
  messageWrapperMe: {
    justifyContent: "flex-end",
  },
  messageWrapperOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: "#14B8B8",
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: "#E5E5EA",
    borderBottomLeftRadius: 4,
  },
  contextText: {
    fontSize: 12,
    marginBottom: 4,
    fontStyle: "italic",
  },
  contextTextMe: {
    color: "#E0F2F1",
  },
  contextTextOther: {
    color: "#8E8E93",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextMe: {
    color: "white",
  },
  messageTextOther: {
    color: "black",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: "white",
    borderColor: "#E5E5EA",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 100,
    color: "black",
  },
  sendButton: {
    backgroundColor: "#14B8B8",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 4, 
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
});
