import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export const generateAndPlayAudio = async (text) => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "your_openai_api_key_here") {
    console.warn("No valid OpenAI API key found.");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "echo", // options: alloy, echo, fable, onyx, nova, shimmer
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64data = reader.result.split(",")[1];
          const fileUri =
            FileSystem.cacheDirectory + `speech_${Date.now()}.mp3`;

          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: 'base64',
          });

          // Ensure audio plays even if phone is on silent (for iOS)
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: fileUri },
            { shouldPlay: true },
          );

          resolve(sound);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = reject;
    });
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    throw error;
  }
};
