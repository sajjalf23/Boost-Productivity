import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Cpu,
  Battery,
  BatteryMedium,
  BatteryCharging,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { StorageService } from '../services/storage';
import { LocalAiEngine } from '../services/localAiEngine';
import { SpeechService } from '../services/speechService';

interface ChatTabProps {
  onDataChanged: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ onDataChanged, onNavigateToTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Energy state (High, Medium, Low)
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('high');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(StorageService.getChats());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    setInputText('');
    setSpeechError(null);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    StorageService.saveChats(newHistory);
    setIsProcessing(true);

    try {
      // Pass energy level into local reasoning engine
      const res = await LocalAiEngine.processMessage(text, energy);

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toISOString(),
        modelBadge: res.badge,
        actionTaken: res.actionTaken,
      };

      const finalMessages = [...newHistory, assistantMsg];
      setMessages(finalMessages);
      StorageService.saveChats(finalMessages);

      if (res.actionTaken) {
        onDataChanged();
      }
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: 'Apologies, local Gemma 3n engine encountered an issue processing that query. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      SpeechService.stopListening();
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    const ok = SpeechService.startListening(
      (result) => {
        setInputText(result.transcript);
        if (result.isFinal) {
          setIsListening(false);
        }
      },
      (err) => {
        setSpeechError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (ok) {
      setIsListening(true);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      SpeechService.stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msgId);
    SpeechService.speak(
      text,
      undefined,
      () => setSpeakingMsgId(null),
      () => setSpeakingMsgId(null)
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-4xl mx-auto px-4 py-3">
      {/* Energy Quick Context Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-medium">Current Energy:</span>
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setEnergy('low')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                energy === 'low'
                  ? 'bg-amber-950 text-amber-300 font-medium border border-amber-800/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Battery className="w-3.5 h-3.5" />
              <span>Low</span>
            </button>

            <button
              onClick={() => setEnergy('medium')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                energy === 'medium'
                  ? 'bg-sky-950 text-sky-300 font-medium border border-sky-800/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BatteryMedium className="w-3.5 h-3.5" />
              <span>Medium</span>
            </button>

            <button
              onClick={() => setEnergy('high')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                energy === 'high'
                  ? 'bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>High</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono hidden sm:block">
          Gemma 3n E2B · Local Reasoning
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isReading = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] whitespace-pre-wrap break-words ${
                  isUser
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-sm'
                }`}
              >
                {/* Assistant header: Model info + Read Aloud Speaker icon button */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-zinc-800/70 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-semibold text-zinc-300">Gemma 3n E2B</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-500">Local LLM</span>
                    </div>

                    {/* Prominent Speaker icon for Piper TTS Read Aloud on LLM response */}
                    <button
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors border ${
                        isReading
                          ? 'bg-purple-950/80 text-purple-300 border-purple-800 animate-pulse'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                      }`}
                      title={isReading ? 'Stop Piper TTS' : 'Read aloud with Piper TTS'}
                      aria-label={isReading ? 'Stop reading' : 'Read aloud'}
                    >
                      {isReading ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-[11px] font-medium">Reading...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-[11px] font-medium">Read Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <div className="space-y-1">{msg.text}</div>

                {/* Action summary badge if the engine updated tasks/history */}
                {msg.actionTaken && (
                  <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{msg.actionTaken.summary}</span>
                    </div>
                    <button
                      onClick={() => onNavigateToTab(msg.actionTaken?.type === 'activity_logged' ? 'history' : 'tasks')}
                      className="text-zinc-400 hover:text-white flex items-center gap-0.5 underline decoration-zinc-700"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-zinc-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl w-fit">
            <Cpu className="w-4 h-4 text-sky-400 animate-spin" />
            <span>Gemma 3n E2B thinking locally...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Listening Banner if Moonshine Tiny is active */}
      {isListening && (
        <div className="mb-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-between text-xs text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Moonshine Tiny STT: Listening... Speak naturally.</span>
          </div>
          <button
            onClick={() => {
              SpeechService.stopListening();
              setIsListening(false);
            }}
            className="text-[11px] bg-emerald-900/60 px-2.5 py-0.5 rounded text-white"
          >
            Done
          </button>
        </div>
      )}

      {speechError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-900 text-xs text-rose-300">
          {speechError}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-1 flex items-center gap-2"
      >
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'Transcribing your voice with Moonshine Tiny...'
                : 'Message your assistant (e.g. "What do I have for DLD class?")...'
            }
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-700"
          />
        </div>

        {/* Voice Input Button (Moonshine Tiny STT) */}
        <button
          type="button"
          onClick={handleToggleVoiceInput}
          className={`p-3 rounded-xl border transition-colors ${
            isListening
              ? 'bg-rose-900/70 border-rose-700 text-rose-200 animate-pulse'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          title={isListening ? 'Stop Moonshine Tiny' : 'Speak with Moonshine Tiny STT'}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-medium transition-colors"
          title="Send message to Gemma 3n"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
