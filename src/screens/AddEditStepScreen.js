import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { updatePlanSteps, getCoachSocialCues, saveSocialCue } from "../services/firestoreService";
import { uploadMediaToStorage } from "../services/storageService";

export default function AddEditStepScreen({ route, navigation }) {
  const { user } = useUser();
  // Determine if we are adding a new step, or editing an existing one
  const { planId, step, stepIndex, currentSteps } = route.params;
  const isEditing = step !== undefined;

  const [title, setTitle] = useState(step?.title || "");
  const [instruction, setInstruction] = useState(step?.instruction || "");
  const [locationUrl, setLocationUrl] = useState(step?.locationUrl || "");
  const [durationMinutes, setDurationMinutes] = useState(
    step?.durationMinutes?.toString() || "",
  );
  // Initialize media URIs from the step array, or fallback to the old single mediaUrl if it exists
  const [localMediaUris, setLocalMediaUris] = useState(
    step?.mediaUrls ? [...step.mediaUrls] : (step?.mediaUrl ? [step.mediaUrl] : [])
  );
  const [loading, setLoading] = useState(false);

  // Social Cues State
  const [socialCues, setSocialCues] = useState([]);
  const [selectedCueId, setSelectedCueId] = useState(step?.socialCue?.id || "");
  const [showModal, setShowModal] = useState(false);
  const [savingCue, setSavingCue] = useState(false);
  const [newCueTitle, setNewCueTitle] = useState("");
  const [newCueType, setNewCueType] = useState("exact_script");
  const [newCueContent, setNewCueContent] = useState("");

  React.useEffect(() => {
    if (user?.id) {
      getCoachSocialCues(user.id).then(cues => setSocialCues(cues));
    }
  }, [user]);

  const isVideo = (url) => {
    if (!url) return false;
    const cleanUrl = url.split("?")[0].toLowerCase();
    return cleanUrl.endsWith(".mp4") || cleanUrl.endsWith(".mov") || cleanUrl.endsWith(".m4v");
  };

  const pickImage = async () => {
    // Request permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You've refused to allow this app to access your photos!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      // Append the newly selected URIs to the existing array
      const newUris = result.assets.map((asset) => asset.uri);
      setLocalMediaUris((prev) => [...prev, ...newUris]);
    }
  };

  const removeMedia = (indexToRemove) => {
    setLocalMediaUris((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleCreateSocialCue = async () => {
    if (!newCueTitle.trim() || !newCueContent.trim()) {
      Alert.alert("Missing Fields", "Please provide a title and script focus.");
      return;
    }
    setSavingCue(true);
    try {
      const newCue = await saveSocialCue(user.id, {
        title: newCueTitle.trim(),
        type: newCueType,
        content: newCueContent.trim()
      });
      setSocialCues(prev => [...prev, newCue]);
      setSelectedCueId(newCue.id);
      setShowModal(false);
      setNewCueTitle("");
      setNewCueContent("");
      setNewCueType("exact_script");
    } catch (err) {
      Alert.alert("Error", "Could not save Social Cue");
    } finally {
      setSavingCue(false);
    }
  };

  const handleSaveStep = async () => {
    if (!title.trim() || !instruction.trim()) {
      Alert.alert(
        "Missing Information",
        "Please provide a title and instruction for this step.",
      );
      return;
    }

    setLoading(true);
    try {
      const stepId = isEditing
        ? step.id
        : Math.random().toString(36).substr(2, 9);
      
      const uploadedMediaUrls = [];

      // Process each URI in the array concurrently
      const uploadPromises = localMediaUris.map(async (uri, index) => {
        // If it's an existing Firebase URL, just keep it
        if (uri.startsWith("http") || uri.startsWith("https")) {
          return uri;
        }

        // Otherwise, it's a new local file that needs uploading
        try {
          // Pass down a unique identifier for the specific file
          const specificStepId = `${stepId}_file${index}`;
          const downloadUrl = await uploadMediaToStorage(uri, planId, specificStepId);
          return downloadUrl;
        } catch (uploadError) {
          console.error(`Failed to upload file at index ${index}:`, uploadError);
          // Return null so we can filter it out, rather than crashing the whole save
          return null;
        }
      });

      // Wait for all uploads to finish
      const results = await Promise.all(uploadPromises);
      
      // Filter out any failed uploads (nulls) and store the final array
      const finalMediaUrls = results.filter(url => url !== null);
      const stepSocialCueRaw = socialCues.find(c => c.id === selectedCueId) || null;
      
      // We must strip out the Firebase serverTimestamp before putting it inside an array
      const stepSocialCue = stepSocialCueRaw ? {
        id: stepSocialCueRaw.id,
        title: stepSocialCueRaw.title,
        type: stepSocialCueRaw.type,
        content: stepSocialCueRaw.content,
      } : null;

      const newStep = {
        id: stepId,
        title: title.trim(),
        instruction: instruction.trim(),
        durationMinutes: parseInt(durationMinutes) || 0,
        isCompleted: false,
        mediaUrls: finalMediaUrls,
        socialCue: stepSocialCue,
        locationUrl: locationUrl.trim() || null,
      };

      const updatedSteps = [...currentSteps];

      if (isEditing) {
        updatedSteps[stepIndex] = newStep;
      } else {
        updatedSteps.push(newStep);
      }

      await updatePlanSteps(planId, updatedSteps);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving step:", error);
      Alert.alert("Error", "Could not save the step. Please try again.");
      setLoading(false);
    }
  };

  const handleDeleteStep = async () => {
    Alert.alert(
      "Delete Step",
      "Are you sure you want to remove this step from the plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const updatedSteps = currentSteps.filter(
                (_, idx) => idx !== stepIndex,
              );
              await updatePlanSteps(planId, updatedSteps);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting step:", error);
              Alert.alert("Error", "Could not delete the step.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 pt-4 pb-2 border-b border-border">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 -ml-2"
          >
            <Text className="text-text-muted font-bold text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-text-primary font-bold text-xl">
            {isEditing ? "Edit Step" : "New Step"}
          </Text>
          <TouchableOpacity
            onPress={handleSaveStep}
            disabled={loading}
            activeOpacity={0.7}
            className="p-2 -mr-2"
          >
            {loading ? (
              <ActivityIndicator color="#14B8B8" />
            ) : (
              <Text
                className={`font-bold text-lg ${title.trim() && instruction.trim() ? "text-primary" : "text-text-muted"}`}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Location / Phase *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Travel to Headquarters"
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary shadow-sm"
              placeholderTextColor="#5B667A"
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Location Link (Optional)
            </Text>
            <TextInput
              value={locationUrl}
              onChangeText={setLocationUrl}
              placeholder="e.g. https://maps.app.goo.gl/..."
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary shadow-sm"
              placeholderTextColor="#5B667A"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Instruction (What to do) *
            </Text>
            <TextInput
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Find the supervisor and deliver the documents."
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary h-24 shadow-sm"
              placeholderTextColor="#5B667A"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="mb-8">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Est. Duration (Minutes)
            </Text>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="e.g. 15"
              className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary shadow-sm"
              placeholderTextColor="#5B667A"
              keyboardType="number-pad"
            />
          </View>

          <View className="mb-8">
            <Text className="text-text-primary font-bold text-sm mb-2 mt-2">
              Media Attachments
            </Text>
            {localMediaUris.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mb-4"
              >
                {localMediaUris.map((uri, index) => (
                  <View key={index} className="relative rounded-xl overflow-hidden mr-4 border border-border shadow-sm w-48">
                    {isVideo(uri) ? (
                      <Video
                        source={{ uri }}
                        style={{ width: "100%", height: 192 }}
                        resizeMode="cover"
                        shouldPlay
                        isLooping
                        isMuted
                      />
                    ) : (
                      <Image
                        source={{ uri }}
                        className="w-full h-48 bg-surface/50"
                        resizeMode="cover"
                      />
                    )}
                    <TouchableOpacity
                      className="absolute top-2 right-2 bg-text-primary/70 p-2 rounded-full"
                      activeOpacity={0.7}
                      onPress={() => removeMedia(index)}
                    >
                      <Text className="text-white font-bold text-xs">✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.7}
              className="bg-primary/5 p-6 rounded-2xl border border-dashed border-primary/30 items-center justify-center shadow-sm"
            >
              <Text className="text-primary-dark font-bold mb-1">
                + Attach Photos or Videos
              </Text>
              <Text className="text-text-muted text-xs">
                Tap to open gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Cues Section */}
          <View className="mb-8 p-4 bg-surface rounded-2xl border border-border">
            <Text className="text-text-primary font-bold text-base mb-1">
              Social Cue (Optional)
            </Text>
            <Text className="text-text-muted text-xs mb-4">
              Attach a saved script that the AI will automatically announce when the messenger reaches this step.
            </Text>

            {socialCues.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <TouchableOpacity
                  onPress={() => setSelectedCueId("")}
                  className={`px-4 py-2 mr-2 rounded-full border ${selectedCueId === "" ? "bg-primary border-primary" : "bg-transparent border-border"}`}
                >
                  <Text className={selectedCueId === "" ? "text-white font-bold" : "text-text-primary"}>None</Text>
                </TouchableOpacity>
                {socialCues.map((cue) => (
                  <TouchableOpacity
                    key={cue.id}
                    onPress={() => setSelectedCueId(cue.id)}
                    className={`px-4 py-2 mr-2 rounded-full border ${selectedCueId === cue.id ? "bg-primary border-primary" : "bg-transparent border-border"}`}
                  >
                    <Text className={selectedCueId === cue.id ? "text-white font-bold" : "text-text-primary"}>
                      {cue.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text className="text-text-muted italic mb-4">No social cues saved yet.</Text>
            )}

            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className="py-3 px-4 border border-dashed border-primary rounded-xl items-center justify-center bg-primary/5"
            >
              <Text className="text-primary-dark font-bold">+ Create New Social Cue</Text>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <TouchableOpacity
              onPress={handleDeleteStep}
              disabled={loading}
              activeOpacity={0.8}
              className="mt-4 mb-12 h-[56px] rounded-[14px] bg-danger/10 items-center justify-center border border-danger/20 shadow-sm"
            >
              <Text className="text-danger font-bold text-lg">
                Delete Step
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Social Cue Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-text-primary">New Social Cue</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} className="p-2 bg-surface rounded-full">
                <Text className="text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="font-bold text-text-primary mb-2">Title</Text>
              <TextInput
                value={newCueTitle}
                onChangeText={setNewCueTitle}
                placeholder="e.g. Chatty Greeting"
                className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary mb-6"
              />

              <Text className="font-bold text-text-primary mb-2">Type</Text>
              <View className="flex-row gap-2 mb-6">
                <TouchableOpacity
                  onPress={() => setNewCueType("exact_script")}
                  className={`flex-1 p-3 rounded-xl border ${newCueType === "exact_script" ? "bg-primary border-primary" : "bg-surface border-border"}`}
                >
                  <Text className={`text-center font-bold ${newCueType === "exact_script" ? "text-white" : "text-text-primary"}`}>Exact Script</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewCueType("ai_prompt")}
                  className={`flex-1 p-3 rounded-xl border ${newCueType === "ai_prompt" ? "bg-primary border-primary" : "bg-surface border-border"}`}
                >
                  <Text className={`text-center font-bold ${newCueType === "ai_prompt" ? "text-white" : "text-text-primary"}`}>AI Prompt</Text>
                </TouchableOpacity>
              </View>

              <Text className="font-bold text-text-primary mb-2">
                {newCueType === "exact_script" ? "What should the AI say out loud?" : "What should the AI encourage them to do?"}
              </Text>
              <TextInput
                value={newCueContent}
                onChangeText={setNewCueContent}
                placeholder={newCueType === "exact_script" ? "e.g. 'Hi, I have a delivery for you. Have a great day!'" : "e.g. 'Remind them to keep the interaction under 1 minute.'"}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-surface border border-border p-4 rounded-xl text-base text-text-primary min-h-[100px] mb-8"
              />

              <TouchableOpacity
                onPress={handleCreateSocialCue}
                disabled={savingCue}
                className="bg-primary py-4 rounded-xl items-center shadow-sm mb-12"
              >
                {savingCue ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save Social Cue</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
