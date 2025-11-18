import { createContext, useContext, useState, ReactNode } from "react";

interface GlobalAudioContextType {
  isGlobalMuted: boolean;
  toggleGlobalMute: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined);

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const [isGlobalMuted, setIsGlobalMuted] = useState(true);

  const toggleGlobalMute = () => {
    setIsGlobalMuted(prev => !prev);
  };

  return (
    <GlobalAudioContext.Provider value={{ isGlobalMuted, toggleGlobalMute }}>
      {children}
    </GlobalAudioContext.Provider>
  );
}

export function useGlobalAudio() {
  const context = useContext(GlobalAudioContext);
  if (context === undefined) {
    throw new Error("useGlobalAudio must be used within a GlobalAudioProvider");
  }
  return context;
}
