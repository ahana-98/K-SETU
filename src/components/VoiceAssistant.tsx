"use client";

import { useRef, useState } from "react";
import { useLang, type Lang } from "@/lib/i18n";

type VoiceAssistantProps = {
  mode?: "login" | "collector";
  onRoleSelect?: (role: "collector" | "recycler" | "admin") => void;
};

type SpeechRecognitionResultEvent = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionErrorEvent = Event & {
  error?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const LANG_CODE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export default function VoiceAssistant({
  mode = "collector",
  onRoleSelect,
}: VoiceAssistantProps) {
  const { lang } = useLang();

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState("");

const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldListenRef = useRef(false);
  const listenUntilRef = useRef(0);

  async function speak(text: string, afterSpeak?: () => void) {  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    setSpeaking(false);

    if (afterSpeak) {
      window.setTimeout(afterSpeak, 400);
    }
  };

  // Stop any previous speech or audio.
  window.speechSynthesis?.cancel();

  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.src = "";
    audioRef.current = null;
  }

  const speakInBrowser = () => {
    if (!("speechSynthesis" in window)) {
      finish();
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith(LANG_CODE[lang].toLowerCase()) &&
        (!navigator.onLine ? voice.localService : true)
    );

    // Offline mode must not rely on a remote browser voice.
    if (!navigator.onLine && !matchingVoice) {
      const notice =
        lang === "hi"
          ? "ऑफलाइन आवाज़ उपलब्ध नहीं है। कृपया इंटरनेट से जुड़ें।"
          : lang === "mr"
            ? "ऑफलाइन आवाज उपलब्ध नाही. कृपया इंटरनेटशी जोडा."
            : "Offline voice is unavailable. Please connect to the internet.";

      setMessage(`${text} ${notice}`);
      finish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODE[lang] || "en-IN";
    utterance.rate = 0.88;
    utterance.pitch = 1;

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = finish;
    utterance.onerror = finish;

    window.speechSynthesis.speak(utterance);
  };

  setSpeaking(true);

  // Use a local browser voice when offline.
  if (!navigator.onLine) {
    speakInBrowser();
    return;
  }

  // Use the existing Azure TTS API when online.
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, lang }),
    });

    if (!response.ok) {
      throw new Error("Azure TTS request failed");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    audioRef.current = audio;

    const cleanup = () => {
      URL.revokeObjectURL(audioUrl);
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };

    audio.onended = () => {
      cleanup();
      finish();
    };

    audio.onerror = () => {
      cleanup();
      speakInBrowser();
    };

    await audio.play();
  } catch (error) {
    console.warn("Azure TTS unavailable; using browser speech:", error);
    speakInBrowser();
  }
}
  function stopListening() {
    shouldListenRef.current = false;

    const recognition = recognitionRef.current;

    if (recognition) {
      try {
        recognition.stop();
      } catch {}

      recognitionRef.current = null;
    }

    setListening(false);
  }

  /*
   * Handle everything the user says.
   *
   * IMPORTANT:
   * This function is intentionally BEFORE startRecognition().
   * This prevents the ESLint "accessed before declared" error.
   */
  function handleCommand(command: string) {
    const normalized = command.toLowerCase().trim();

    /*
     * LOGIN MODE
     */
    if (mode === "login") {
      if (
        normalized.includes("collector") ||
        normalized.includes("कलेक्टर") ||
        normalized.includes("कलेक्टर के") ||
        normalized.includes("कलेक्टर म्हणून") ||
        normalized.includes("कलेक्टर बन")
      ) {
        const text =
          lang === "hi"
            ? "कलेक्टर चुना गया है। आपको कलेक्टर डैशबोर्ड पर ले जा रहा हूँ।"
            : lang === "mr"
              ? "कलेक्टर निवडला आहे. तुम्हाला कलेक्टर डॅशबोर्डवर घेऊन जात आहे."
              : "Collector selected. Taking you to the Collector dashboard.";

        setMessage(text);
        speak(text);

        window.setTimeout(() => {
          onRoleSelect?.("collector");
        }, 1200);

        return;
      }

      if (
        normalized.includes("recycler") ||
        normalized.includes("रीसायक्लर") ||
        normalized.includes("रिसायकलर") ||
        normalized.includes("रीसायकलर")
      ) {
        const text =
          lang === "hi"
            ? "रीसायक्लर चुना गया है।"
            : lang === "mr"
              ? "रीसायक्लर निवडला आहे."
              : "Recycler selected.";

        setMessage(text);
        speak(text);

        window.setTimeout(() => {
          onRoleSelect?.("recycler");
        }, 1000);

        return;
      }

      if (
        normalized.includes("admin") ||
        normalized.includes("एडमिन") ||
        normalized.includes("अॅडमिन")
      ) {
        const text =
          lang === "hi"
            ? "एडमिन चुना गया है।"
            : lang === "mr"
              ? "अॅडमिन निवडला आहे."
              : "Admin selected.";

        setMessage(text);
        speak(text);

        window.setTimeout(() => {
          onRoleSelect?.("admin");
        }, 1000);

        return;
      }

      const retry =
        lang === "hi"
          ? "कृपया कलेक्टर, रीसायक्लर या एडमिन बोलें।"
          : lang === "mr"
            ? "कृपया कलेक्टर, रीसायक्लर किंवा अॅडमिन बोला."
            : "Please say Collector, Recycler, or Admin.";

      setMessage(retry);
      speak(retry);

      return;
    }

    /*
     * COLLECTOR MODE
     */

    if (
      normalized.includes("sell") ||
      normalized.includes("बेच") ||
      normalized.includes("विक") ||
      normalized.includes("कचरा विक") ||
      normalized.includes("विकायचा")
    ) {
      const text =
        lang === "hi"
          ? "ई-कचरा बेचने वाले पेज पर जा रहे हैं।"
          : lang === "mr"
            ? "ई-कचरा विक्रीच्या पेजवर जात आहोत."
            : "Opening the Sell E-Waste page.";

      setMessage(text);
      speak(text);

      window.location.href = "/collector/sell";
      return;
    }

    if (
      normalized.includes("price") ||
      normalized.includes("भाव") ||
      normalized.includes("कीमत") ||
      normalized.includes("किंमत") ||
      normalized.includes("rate") ||
      normalized.includes("दर")
    ) {
      const text =
        lang === "hi"
          ? "आज के ई-कचरे के भाव दिखा रहा हूँ।"
          : lang === "mr"
            ? "आजचे ई-कचऱ्याचे दर दाखवत आहे."
            : "Opening today's e-waste prices.";

      setMessage(text);
      speak(text);

      window.location.href = "/collector/prices";
      return;
    }

    if (
      normalized.includes("recycler") ||
      normalized.includes("रीसायक्लर") ||
      normalized.includes("रिसायकलर") ||
      normalized.includes("रीसायकलर") ||
      normalized.includes("recycle")
    ) {
      const text =
        lang === "hi"
          ? "रीसायक्लर खोजने वाला पेज खोल रहा हूँ।"
          : lang === "mr"
            ? "रीसायक्लर शोधण्याचे पेज उघडत आहे."
            : "Opening the Recycler page.";

      setMessage(text);
      speak(text);

      window.location.href = "/collector/recyclers";
      return;
    }

    if (
      normalized.includes("earning") ||
      normalized.includes("कमाई") ||
      normalized.includes("पैसे") ||
      normalized.includes("उपार्जन") ||
      normalized.includes("माझी कमाई")
    ) {
      const text =
        lang === "hi"
          ? "आपकी कमाई का पेज खोल रहा हूँ।"
          : lang === "mr"
            ? "तुमच्या कमाईचे पेज उघडत आहे."
            : "Opening your earnings.";

      setMessage(text);
      speak(text);

      window.location.href = "/collector/earnings";
      return;
    }

    if (
      normalized.includes("profile") ||
      normalized.includes("प्रोफाइल") ||
      normalized.includes("प्रोफाईल")
    ) {
      const text =
        lang === "hi"
          ? "आपकी प्रोफाइल खोल रहा हूँ।"
          : lang === "mr"
            ? "तुमची प्रोफाइल उघडत आहे."
            : "Opening your profile.";

      setMessage(text);
      speak(text);

      window.location.href = "/collector/profile";
      return;
    }

    if (
      normalized.includes("home") ||
      normalized.includes("होम") ||
      normalized.includes("घर") ||
      normalized.includes("मुख्य")
    ) {
      const text =
        lang === "hi"
          ? "कलेक्टर होम खोल रहा हूँ।"
          : lang === "mr"
            ? "कलेक्टर होम उघडत आहे."
            : "Opening the Collector home.";

      setMessage(text);
      speak(text);

      window.location.href = "/collector";
      return;
    }

    const help =
      lang === "hi"
        ? "आप कह सकते हैं: ई-कचरा बेचो, भाव बताओ, रीसायक्लर खोजो, या मेरी कमाई दिखाओ।"
        : lang === "mr"
          ? "तुम्ही म्हणू शकता: ई-कचरा विक, दर सांग, रीसायक्लर शोध किंवा माझी कमाई दाखव."
          : "You can say: sell e-waste, show prices, find recycler, or show my earnings.";

    setMessage(help);
    speak(help);
  }

  /*
   * Start browser speech recognition.
   */
  function startRecognition() {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      const text =
        lang === "hi"
          ? "आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया Google Chrome का उपयोग करें।"
          : lang === "mr"
            ? "तुमच्या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही. कृपया Google Chrome वापरा."
            : "Voice recognition is not available. Please use Google Chrome.";

      setMessage(text);
      speak(text);
      return;
    }

    shouldListenRef.current = true;
    listenUntilRef.current = Date.now() + 15000;

    try {
      const recognition = new SpeechRecognitionAPI();

      recognition.lang = LANG_CODE[lang];
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setListening(true);

        const text =
          lang === "hi"
            ? "🎙️ मैं सुन रहा हूँ। अब बोलिए।"
            : lang === "mr"
              ? "🎙️ मी ऐकत आहे. आता बोला."
              : "🎙️ I am listening. Please speak now.";

        setMessage(text);
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results?.[0]?.[0]?.transcript?.trim() || "";

        if (!transcript) {
          return;
        }

        shouldListenRef.current = false;
        setListening(false);
        recognitionRef.current = null;

        setMessage(`आपने कहा: ${transcript}`);

        handleCommand(transcript);
      };

      recognition.onerror = (event) => {
        const error = event.error || "";

        if (error === "not-allowed" || error === "service-not-allowed") {
          shouldListenRef.current = false;
          setListening(false);
          recognitionRef.current = null;

          const text =
            lang === "hi"
              ? "माइक्रोफोन की अनुमति नहीं मिली। कृपया Chrome में माइक्रोफोन की अनुमति दें।"
              : lang === "mr"
                ? "मायक्रोफोनची परवानगी मिळाली नाही. कृपया Chrome मध्ये मायक्रोफोनची परवानगी द्या."
                : "Microphone permission was denied. Please allow microphone access in Chrome.";

          setMessage(text);
          speak(text);
          return;
        }

        if (error === "audio-capture") {
          shouldListenRef.current = false;
          setListening(false);
          recognitionRef.current = null;

          const text =
            lang === "hi"
              ? "माइक्रोफोन उपलब्ध नहीं है। कृपया माइक्रोफोन जांचें।"
              : lang === "mr"
                ? "मायक्रोफोन उपलब्ध नाही. कृपया मायक्रोफोन तपासा."
                : "The microphone is not available. Please check your microphone.";

          setMessage(text);
          speak(text);
          return;
        }

        /*
         * Chrome sometimes produces "no-speech"
         * after a short silence.
         *
         * Do not immediately show an error.
         */
        if (
          error === "no-speech" &&
          shouldListenRef.current &&
          Date.now() < listenUntilRef.current
        ) {
          setMessage(
            lang === "hi"
              ? "🎙️ मैं अभी भी सुन रहा हूँ... बोलिए।"
              : lang === "mr"
                ? "🎙️ मी अजूनही ऐकत आहे... बोला."
                : "🎙️ I am still listening... please speak."
          );

          return;
        }

        shouldListenRef.current = false;
        setListening(false);
        recognitionRef.current = null;

        const text =
          lang === "hi"
            ? "आवाज़ समझ नहीं आई। कृपया फिर से बोलें।"
            : lang === "mr"
              ? "आवाज समजली नाही. कृपया पुन्हा बोला."
              : "I could not understand. Please try again.";

        setMessage(text);
        speak(text);
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        /*
         * Do not restart after a successful command.
         */
        if (!shouldListenRef.current) {
          setListening(false);
          return;
        }

        /*
         * Give the user a maximum 15-second
         * listening window.
         */
        if (Date.now() < listenUntilRef.current) {
          window.setTimeout(() => {
            if (
              shouldListenRef.current &&
              Date.now() < listenUntilRef.current
            ) {
              startRecognition();
            }
          }, 300);
        } else {
          shouldListenRef.current = false;
          setListening(false);

          const text =
            lang === "hi"
              ? "समय समाप्त हो गया। कृपया फिर से बोलने के लिए माइक्रोफोन दबाएं।"
              : lang === "mr"
                ? "वेळ संपली. पुन्हा बोलण्यासाठी मायक्रोफोन दाबा."
                : "Listening time ended. Press the microphone to try again.";

          setMessage(text);
        }
      };

      recognitionRef.current = recognition;

      recognition.start();
    } catch (error) {
      console.error("Voice recognition start error:", error);

      recognitionRef.current = null;
      shouldListenRef.current = false;
      setListening(false);

      const text =
        lang === "hi"
          ? "माइक्रोफोन शुरू नहीं हो सका। कृपया फिर से प्रयास करें।"
          : lang === "mr"
            ? "मायक्रोफोन सुरू करता आला नाही. कृपया पुन्हा प्रयत्न करा."
            : "The microphone could not start. Please try again.";

      setMessage(text);
    }
  }

  function handleButton() {
    if (listening) {
      stopListening();
      return;
    }

    if (mode === "login") {
      const greeting =
        lang === "hi"
          ? "नमस्ते! K-SETU में आपका स्वागत है। कलेक्टर, रीसायक्लर या एडमिन बोलें।"
          : lang === "mr"
            ? "नमस्कार! K-SETU मध्ये तुमचे स्वागत आहे. कलेक्टर, रीसायक्लर किंवा अॅडमिन बोला."
            : "Hello! Welcome to K-SETU. Say Collector, Recycler, or Admin.";

      setMessage(greeting);

      /*
       * Speak first.
       * After the greeting finishes, start the microphone.
       */
      speak(greeting, () => {
        startRecognition();
      });

      return;
    }

    const greeting =
      lang === "hi"
        ? "मैं आपकी मदद के लिए तैयार हूँ। बोलिए।"
        : lang === "mr"
          ? "मी तुमच्या मदतीसाठी तयार आहे. बोला."
          : "I am ready to help. Please speak.";

    setMessage(greeting);

    speak(greeting, () => {
      startRecognition();
    });
  }

  return (
    <div className="fixed bottom-24 right-4 z-100 flex flex-col items-end gap-2">
      {message && (
        <div className="max-w-[300px] rounded-2xl border border-[#dcebe0] bg-white px-4 py-3 text-sm font-semibold text-forest shadow-lg">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleButton}
        aria-label={
          listening ? "Stop voice assistant" : "Start voice assistant"
        }
        className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-xl transition-all ${
          listening
            ? "scale-110 animate-pulse bg-red-500"
            : speaking
              ? "bg-pine"
              : "bg-pine hover:scale-105"
        }`}
      >
        {listening ? "⏹️" : "🎙️"}
      </button>

      <span className="rounded-full bg-forest px-3 py-1 text-[10px] font-bold text-white shadow">
        {listening
          ? lang === "hi"
            ? "सुन रहा हूँ..."
            : lang === "mr"
              ? "ऐकत आहे..."
              : "Listening..."
          : lang === "hi"
            ? "बोलकर शुरू करें"
            : lang === "mr"
              ? "बोलून सुरू करा"
              : "Voice Assistant"}
      </span>
    </div>
  );
}