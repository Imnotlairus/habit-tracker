'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

// Interfaces tipadas para Web Speech API sin 'any'
interface ISpeechRecognitionResult {
  [index: number]: {
    transcript: string;
  };
}

interface ISpeechRecognitionEvent {
  results: {
    [index: number]: ISpeechRecognitionResult;
  };
}

interface ISpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

const checkSpeechSupport = (): boolean => {
  if (typeof window === 'undefined') return false;
  const speechWin = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return Boolean(speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition);
};

const subscribeNoop = () => () => {};

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false,
}) => {
  const isSupported = useSyncExternalStore(subscribeNoop, checkSpeechSupport, () => true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (!isSupported || typeof window === 'undefined') return;

    const speechWin = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionClass =
      speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-CO'; // Español Colombia

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          onTranscript(transcript.trim());
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('Permiso de micrófono denegado en tu navegador.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('No se detectó audio. Intenta hablar más cerca.');
        } else {
          setErrorMessage(`Error de voz: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      // Ignorar fallo al instanciar SpeechRecognition
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar fallo al abortar
        }
      }
    };
  }, [isSupported, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'InvalidStateError') {
          setErrorMessage('No se pudo iniciar el micrófono.');
        }
      }
    }
  };

  if (!isSupported) {
    return (
      <div
        title="Reconocimiento de voz no compatible con este navegador. Puedes escribir directamente."
        className="p-2 text-zinc-400 dark:text-zinc-600 rounded-xl cursor-not-allowed"
      >
        <MicOff className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleListening}
        title={isListening ? 'Detener grabación de voz' : 'Hablar en español (es-CO)'}
        aria-label={isListening ? 'Detener voz' : 'Grabar por voz'}
        className={`p-2.5 rounded-xl transition-all duration-300 relative cursor-pointer ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />

        {/* Efecto de onda concéntrica mientras escucha */}
        {isListening && (
          <span className="absolute inset-0 rounded-xl bg-rose-500 animate-ping opacity-25 pointer-events-none" />
        )}
      </button>

      {/* Notificación de error discreta */}
      {errorMessage && (
        <div className="absolute bottom-full mb-2 right-0 w-52 p-2 bg-zinc-900 text-white text-[10px] rounded-lg shadow-xl border border-zinc-700 flex items-start gap-1.5 z-50 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
