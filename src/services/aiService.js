import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== "your_gemini_api_key_here") {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * Calls the Google Gemini API to generate accessible help for a specific step.
 *
 * @param {object} plan - The entire plan object containing all steps.
 * @param {number} currentStepIndex - The index of the current step.
 * @returns {Promise<string>} - The AI-generated help text.
 */
export const getTaskHelp = async (plan, currentStepIndex) => {
  const currentStep = plan.steps[currentStepIndex];
  if (!genAI) {
    console.warn("No valid Gemini API key found.");
    return "I'm sorry, the AI assistant is currently asleep. Please ask your coach for help with this step!";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a supportive, patient, and highly accessible task assistant helping individuals with ASD or cognitive challenges complete everyday tasks independently. 
    
The user is currently trying to complete the overall activity: "${plan.title}".
This task has the following steps:
${plan.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.instruction}`).join('\n')}

The user is currently stuck on Step ${currentStepIndex + 1}: "${currentStep.instruction}".

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
 * @param {object} plan - The entire plan object
 * @param {number} currentStepIndex - The index of the step the user is stuck on.
 * @param {string} base64Audio - The base64 string of the recorded audio question.
 * @param {string} mimeType - The mime type of the audio.
 * @returns {Promise<string>} - The AI-generated help text.
 */
export const getTaskHelpWithAudio = async (plan, currentStepIndex, base64Audio, mimeType) => {
  const currentStep = plan.steps[currentStepIndex];
  if (!genAI) {
    console.warn("No valid Gemini API key found.");
    return "I'm sorry, the AI assistant is currently asleep. Please ask your coach for help with this step!";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a supportive, patient, and highly accessible task assistant helping individuals with ASD or cognitive challenges complete everyday tasks independently. 
    
The user is currently trying to complete the overall activity: "${plan.title}".
This task has the following steps:
${plan.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.instruction}`).join('\n')}

The user is currently stuck on Step ${currentStepIndex + 1}: "${currentStep.instruction}".

Listen to the attached audio file. This is the user verbally asking a specific question about what they should do next or what they are stuck on. Their question might reference previous or future steps in this plan.

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

/**
 * Generates a proactive social script based on the coach's configured Social Cue.
 * If the cue is an exact script, it returns it instantly.
 * If the cue is an AI prompt, it uses Gemini to generate a context-aware response.
 */
export const getProactiveSocialScript = async (plan, currentStepIndex) => {
  const currentStep = plan.steps[currentStepIndex];
  if (!currentStep || !currentStep.socialCue) return null;

  const { type, content } = currentStep.socialCue;

  // 1. If it's an exact script, bypass AI entirely and just return it to be spoken.
  if (type === "exact_script") {
    return content;
  }

  // 2. If it's an AI prompt, generate a personalized voiceover
  if (!genAI) {
    console.warn("No valid Gemini API key found for proactive cue.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are acting as the voice of an assistive job coach speaking through an earpiece/app to an employee with ASD.
    
They are currently doing the task: "${plan.title}".
They just arrived at Step ${currentStepIndex + 1}: "${currentStep.title} - ${currentStep.instruction}".

Their human coach has left the following behavioral instructions for how you should guide them socially on this specific step: 
"${content}"

Generate exactly what you will say to the employee right now. Speak directly to them in a brief, encouraging tone. 
Keep it VERY short (1-2 sentences max). Do NOT use quotes or formatting, just the raw spoken text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating proactive social script:", error);
    return null; // Fail silently so we don't disrupt the user if AI fails
  }
};

