import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_api_key_here") {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Calls the Google Gemini API to generate accessible help for a specific step.
 *
 * @param {string} taskTitle - The title of the overall plan/task.
 * @param {string} stepDescription - The instruction text of the step the user is stuck on.
 * @returns {Promise<string>} - The AI-generated help text.
 */
export const getTaskHelp = async (taskTitle, stepDescription) => {
  if (!genAI) {
    console.warn("No valid Gemini API key found.");
    return "I'm sorry, the AI assistant is currently asleep. Please ask your coach for help with this step!";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a supportive, patient, and highly accessible task assistant helping individuals with ASD or cognitive challenges complete everyday tasks independently. 
    
The user is currently trying to complete the overall activity: "${taskTitle}".
They are stuck on the specific step: "${stepDescription}".

Provide a extremely short, highly encouraging, and simplified 1 to 2 sentence tip to help them figure out what to do. Speak directly to the user in a warm, conversational, and guiding tone. Do not use complex language, lists, or formatting. Keep the response under 30 words so it is easy to read out loud.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error fetching AI help:", error);
    return "I ran into a problem thinking of a tip. Take a deep breath and try reading the step one more time!";
  }
};

/**
 * Calls the Google Gemini API to generate accessible help for a specific step based on an audio question.
 *
 * @param {string} taskTitle - The title of the overall plan/task.
 * @param {string} stepDescription - The instruction text of the step the user is stuck on.
 * @param {string} base64Audio - The base64 string of the recorded audio question.
 * @param {string} mimeType - The mime type of the audio.
 * @returns {Promise<string>} - The AI-generated help text.
 */
export const getTaskHelpWithAudio = async (taskTitle, stepDescription, base64Audio, mimeType) => {
  if (!genAI) {
    console.warn("No valid Gemini API key found.");
    return "I'm sorry, the AI assistant is currently asleep. Please ask your coach for help with this step!";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a supportive, patient, and highly accessible task assistant helping individuals with ASD or cognitive challenges complete everyday tasks independently. 
    
The user is currently trying to complete the overall activity: "${taskTitle}".
They are stuck on the specific step: "${stepDescription}".

Listen to the attached audio file. This is the user verbally asking a specific question about what they should do next or what they are stuck on.

Answer their exact question using an extremely short, highly encouraging, and simplified 1 to 2 sentence tip to help them figure out what to do. Speak directly to the user in a warm, conversational, and guiding tone. Do not use complex language, lists, or formatting. Keep the response under 30 words so it is easy to read out loud.`;

    const audioData = {
      inlineData: {
        data: base64Audio,
        mimeType: mimeType || "audio/m4a"
      }
    };

    const result = await model.generateContent([prompt, audioData]);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error fetching AI audio help:", error);
    return "I ran into a problem listening to your question. Take a deep breath and try reading the step one more time!";
  }
};

