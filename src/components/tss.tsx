"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { onValue, ref, set } from "firebase/database";
import { database } from "../firebaseConfig";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"; // Import Font Awesome icons
import env from "react-dotenv";

let genAI: GoogleGenerativeAI | null = null;

export async function initializeGeminiApi(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateGeminiResponse(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error(
      "Gemini API not initialized. Call initializeGeminiApi first."
    );
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

const AiAssistant = () => {
  const firebaseData = useRef({});
  const promptTextRef = useRef(""); // Use ref instead of state for prompt text
  const [aiResponse, setAiResponse] = useState(""); // Store AI response
  const aiResponseRef = useRef(aiResponse);
  const [isListening, setIsListening] = useState(false);

  // Popper
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [showPopper, setShowPopper] = useState(false); // Control the visibility of the popper

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
  };

  const open = Boolean(anchor);
  const id = open ? "simple-popper" : undefined;

  useEffect(() => {
    const apiKey = env.API_KEY;
    initializeGeminiApi(apiKey as string).catch(console.error);

    const dbRef = ref(database);
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      firebaseData.current = data;
    });
  }, []);

  const fetchAiResponse = async () => {
    try {
      const prompt =
        "This is data" +
        JSON.stringify(firebaseData.current) +
        "This describes a system that manages environmental conditions and device states in a house. It includes: Air temperature (airTemp), indoor temperature (temperature), and humidity (humidity).Air conditioner status (isAir), indicating whether it's on or off.Indoor and outdoor light status (indoorLed and outdoorLed).Smoke detection (isSmoke), which indicates if smoke is present.When the user asks to adjust the air temperature or control the air conditioner, you should respond with the appropriate function (e.g., func(number) for temperature or func(turnOn)/func(turnOff) for the air conditioner) and confirm the action was taken. If the request is for something unrelated to the air conditioner, you simply can't change it. Keep your response clear, but not too long or too short." +
        promptTextRef.current;

      const response = await generateGeminiResponse(prompt);

      if (response.match(/func\((.*?)\)/)) {
        const functionArgs = response.match(/\((.*?)\)/)?.[1];

        if (functionArgs?.includes("turnOn")) {
          const temperatureAirRef = ref(database, "isAir");
          await set(temperatureAirRef, true);
          aiResponseRef.current = "The air conditioner has been turned on.";
        } else if (functionArgs?.includes("turnOff")) {
          const temperatureAirRef = ref(database, "isAir");
          await set(temperatureAirRef, false);
          aiResponseRef.current = "The air conditioner has been turned off.";
        } else {
          const temperatureAirRef = ref(database, "airTemp");
          const temp = Number(functionArgs);
          await set(temperatureAirRef, temp);
          aiResponseRef.current = `The air temperature has been set to ${temp} degrees.`;
        }
      } else {
        aiResponseRef.current = response; // Store the AI response in state
      }

      // Speak AI response
      speakText(aiResponseRef.current);

      setAiResponse(aiResponseRef.current);
    } catch (error) {
      console.error("Error fetching AI response:", error);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      utterance.lang = "en-US";
      utterance.pitch = 2;
      utterance.rate = 1;
      utterance.voice = voices[2];
      console.log(voices);

      // Show the popup with the AI response when it's speaking
      setShowPopper(true); // Display the popper when AI starts speaking

      window.speechSynthesis.speak(utterance);

      // Hide the popper after the speech finishes (timeout for the speech duration)
      utterance.onend = () => {
        setShowPopper(false); // Hide the popper when speech ends
      };
    } else {
      console.error("Text-to-Speech is not supported in this browser.");
    }
  };

  const handleSpeechToText = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition(); // Use `SpeechRecognition` if supported.
    recognition.lang = "en-US";
    recognition.interimResults = false; // Don't get intermediate results, only the final result
    recognition.continuous = false; // Stop when speech ends

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      fetchAiResponse(); // Send the recognized text to AI once user finishes speaking
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      promptTextRef.current = spokenText; // Store text in useRef
      console.log("Recognized text:", spokenText);
    };

    recognition.start();
  };

  return (
    <div className="ai-assistant text-white text-center fixed bottom-4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full flex items-center justify-center">
      {/* Popper to show AI response */}
      {showPopper ? (
        <div
          id={id}
          className="bg-black bg-opacity-70 p-4 rounded-lg text-white w-11/12 max-w-4xl"
        >
          <p>{aiResponse}</p>
        </div>
      ) : (
        <button
          onClick={handleSpeechToText}
          className={`p-3 rounded-full ${
            isListening ? "bg-red-500" : "bg-green-500"
          } text-white flex items-center justify-center`}
        >
          {isListening ? (
            <FaMicrophoneSlash size={30} />
          ) : (
            <FaMicrophone size={30} />
          )}
        </button>
      )}
    </div>
  );
};

export default AiAssistant;
