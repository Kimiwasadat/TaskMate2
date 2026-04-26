import * as FileSystem from 'expo-file-system/legacy';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

/**
 * Calls the OpenAI API to generate accessible help for a specific step.
 * Using OpenAI as a robust fallback since Gemini API quotas were exceeded.
 */
export const getTaskHelp = async (plan, currentStepIndex) => {
  const currentStep = plan.steps[currentStepIndex];
  if (!OPENAI_API_KEY) {
    console.warn("No valid OpenAI API key found.");
    return "I'm sorry, the AI assistant is asleep right now. Please ask your coach!";
  }

  try {
    const prompt = `You are a supportive, patient, and highly accessible task assistant helping individuals with ASD or cognitive challenges complete everyday tasks independently. 
    
The user is currently trying to complete the overall activity: "${plan.title}".
This task has the following steps:
${plan.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.instruction}`).join('\n')}

The user is currently stuck on Step ${currentStepIndex + 1}: "${currentStep.instruction}".

Provide a extremely short, highly encouraging, and simplified 1 to 2 sentence tip to help them figure out what to do. Speak directly to the user in a warm, conversational, and guiding tone. Do not use complex language, lists, or formatting. Keep the response under 30 words so it is easy to read out loud.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching AI help:", error);
    return "I ran into a problem thinking of a tip. Take a deep breath and try reading the step one more time!";
  }
};

/**
 * Uses OpenAI Whisper and GPT-4o-mini to generate accessible help from audio.
 */
export const getTaskHelpWithAudio = async (plan, currentStepIndex, base64Audio, mimeType) => {
  const currentStep = plan.steps[currentStepIndex];
  if (!OPENAI_API_KEY) {
    console.warn("No valid OpenAI API key found.");
    return "I'm sorry, the AI assistant is asleep right now. Please ask your coach!";
  }

  try {
    // 1. Write the base64 audio to a temporary file so we can send it via FormData
    const tempUri = FileSystem.cacheDirectory + 'temp_audio.m4a';
    await FileSystem.writeAsStringAsync(tempUri, base64Audio, { encoding: 'base64' });

    const formData = new FormData();
    formData.append('file', {
      uri: tempUri,
      name: 'audio.m4a',
      type: mimeType || 'audio/m4a'
    });
    formData.append('model', 'whisper-1');

    // 2. Transcribe the audio using Whisper
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });
    
    const whisperData = await whisperResponse.json();
    const transcript = whisperData.text || "I need help with this step.";

    // 3. Get the answer from GPT
    const prompt = `You are a supportive, patient, and highly accessible task assistant helping individuals with ASD or cognitive challenges complete everyday tasks independently. 
    
The user is currently trying to complete the overall activity: "${plan.title}".
This task has the following steps:
${plan.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.instruction}`).join('\n')}

The user is currently stuck on Step ${currentStepIndex + 1}: "${currentStep.instruction}".

Listen to the attached audio file. This is the user verbally asking a specific question about what they should do next or what they are stuck on. Their question was transcribed as: "${transcript}"

Answer their exact question using an extremely short, highly encouraging, and simplified 1 to 2 sentence tip to help them figure out what to do. Speak directly to the user in a warm, conversational, and guiding tone. Do not use complex language, lists, or formatting. Keep the response under 30 words so it is easy to read out loud.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching AI audio help:", error);
    return "I ran into a problem listening to your question. Take a deep breath and try reading the step one more time!";
  }
};

/**
 * Generates a proactive social script using GPT-4o-mini
 */
export const getProactiveSocialScript = async (plan, currentStepIndex) => {
  const currentStep = plan.steps[currentStepIndex];
  if (!currentStep || !currentStep.socialCue) return null;

  const { type, content } = currentStep.socialCue;

  // 1. If it's an exact script, bypass AI entirely and just return it.
  if (type === "exact_script") {
    return content;
  }

  // 2. Generate script using OpenAI
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    const prompt = `You are acting as the voice of an assistive job coach speaking through an earpiece/app to an employee with ASD.
    
They are currently doing the task: "${plan.title}".
They just arrived at Step ${currentStepIndex + 1}: "${currentStep.title} - ${currentStep.instruction}".

Their human coach has left the following behavioral instructions for how you should guide them socially on this specific step: 
"${content}"

Generate exactly what you will say to the employee right now. Speak directly to them in a brief, encouraging tone. 
Keep it VERY short (1-2 sentences max). Do NOT use quotes or formatting, just the raw spoken text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating proactive social script:", error);
    return null; // Fail silently so we don't disrupt the user
  }
};
