import { useEffect, useRef, useState } from "react";
import {
  AUDIO_SETTINGS_CHANGED_EVENT,
  getAudioSettings,
  type AudioSettings,
} from "@/app/utils/audioSettings";

const BACKGROUND_MUSIC_SRC = "/audio/backgroundmusic.mp3";

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [settings, setSettings] = useState<AudioSettings>(() =>
    getAudioSettings(),
  );

  useEffect(() => {
    const audio = new Audio(BACKGROUND_MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = settings.volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const applySettings = (nextSettings: AudioSettings) => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.volume = nextSettings.volume;
      if (!nextSettings.backgroundEnabled || nextSettings.volume <= 0) {
        audio.pause();
        return;
      }

      void audio.play().catch(() => {
        // Autoplay starts after the next click/key press below.
      });
    };

    applySettings(settings);
  }, [settings]);

  useEffect(() => {
    const handleSettingsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<AudioSettings>;
      setSettings(customEvent.detail || getAudioSettings());
    };

    const tryStartAfterGesture = () => {
      const nextSettings = getAudioSettings();
      setSettings(nextSettings);
      if (!nextSettings.backgroundEnabled || nextSettings.volume <= 0) return;
      void audioRef.current?.play().catch(() => {});
    };

    window.addEventListener(
      AUDIO_SETTINGS_CHANGED_EVENT,
      handleSettingsChanged,
    );
    window.addEventListener("click", tryStartAfterGesture);
    window.addEventListener("keydown", tryStartAfterGesture);

    return () => {
      window.removeEventListener(
        AUDIO_SETTINGS_CHANGED_EVENT,
        handleSettingsChanged,
      );
      window.removeEventListener("click", tryStartAfterGesture);
      window.removeEventListener("keydown", tryStartAfterGesture);
    };
  }, []);

  return null;
}
