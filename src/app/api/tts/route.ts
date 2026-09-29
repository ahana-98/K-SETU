import { NextRequest } from "next/server";

const VOICES = {
  en: {
    locale: "en-IN",
    voice: "en-IN-AartiNeural",
  },
  hi: {
    locale: "hi-IN",
    voice: "hi-IN-SwaraNeural",
  },
  mr: {
    locale: "mr-IN",
    voice: "mr-IN-AarohiNeural",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    if (!["en", "hi", "mr"].includes(lang)) {
      return Response.json(
        { error: "Unsupported language." },
        { status: 400 }
      );
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion =
      process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return Response.json(
        { error: "Azure Speech is not configured." },
        { status: 500 }
      );
    }

    const config =
      VOICES[lang as keyof typeof VOICES];

    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const ssml = `
      <speak version="1.0" xml:lang="${config.locale}">
        <voice
          name="${config.voice}"
          xml:lang="${config.locale}"
        >
          ${escapedText}
        </voice>
      </speak>
    `;

    const response = await fetch(
      `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat":
            "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "K-SETU",
        },
        body: ssml,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Azure Speech error:",
        response.status,
        errorText
      );

      return Response.json(
        { error: "Speech generation failed." },
        { status: 500 }
      );
    }

    const audio = await response.arrayBuffer();

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);

    return Response.json(
      { error: "Text-to-speech failed." },
      { status: 500 }
    );
  }
}