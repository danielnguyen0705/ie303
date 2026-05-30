export type AudioSettings = {
  backgroundEnabled: boolean;
  feedbackEnabled: boolean;
  lessonCompleteEnabled: boolean;
  volume: number;
};

export const AUDIO_SETTINGS_CHANGED_EVENT = "uifive:audio-settings-changed";

const AUDIO_SETTINGS_KEY = "uifive:audio-settings";
const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  backgroundEnabled: true,
  feedbackEnabled: true,
  lessonCompleteEnabled: true,
  volume: 0.35,
};

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_AUDIO_SETTINGS.volume;
  return Math.min(1, Math.max(0, value));
}

export function getAudioSettings(): AudioSettings {
  if (typeof window === "undefined") {
    return DEFAULT_AUDIO_SETTINGS;
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(AUDIO_SETTINGS_KEY) || "",
    ) as Partial<AudioSettings>;
    const legacyEnabled =
      typeof (parsed as { enabled?: unknown }).enabled === "boolean"
        ? Boolean((parsed as { enabled?: boolean }).enabled)
        : null;

    return {
      backgroundEnabled:
        typeof parsed.backgroundEnabled === "boolean"
          ? parsed.backgroundEnabled
          : (legacyEnabled ?? DEFAULT_AUDIO_SETTINGS.backgroundEnabled),
      feedbackEnabled:
        typeof parsed.feedbackEnabled === "boolean"
          ? parsed.feedbackEnabled
          : (legacyEnabled ?? DEFAULT_AUDIO_SETTINGS.feedbackEnabled),
      lessonCompleteEnabled:
        typeof parsed.lessonCompleteEnabled === "boolean"
          ? parsed.lessonCompleteEnabled
          : (legacyEnabled ?? DEFAULT_AUDIO_SETTINGS.lessonCompleteEnabled),
      volume: clampVolume(Number(parsed.volume)),
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized: AudioSettings = {
    backgroundEnabled: settings.backgroundEnabled,
    feedbackEnabled: settings.feedbackEnabled,
    lessonCompleteEnabled: settings.lessonCompleteEnabled,
    volume: clampVolume(settings.volume),
  };

  window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent<AudioSettings>(AUDIO_SETTINGS_CHANGED_EVENT, {
      detail: normalized,
    }),
  );
}

export function playUiSound(src: string, volumeScale = 1) {
  if (typeof window === "undefined") {
    return;
  }

  const settings = getAudioSettings();
  if (!settings.feedbackEnabled || settings.volume <= 0) {
    return;
  }

  const audio = new Audio(src);
  audio.volume = clampVolume(settings.volume * volumeScale);
  void audio.play().catch(() => {
    // Browsers may block sounds before the first user gesture.
  });
}

export function playLessonCompleteSound(src: string, volumeScale = 1) {
  if (typeof window === "undefined") {
    return;
  }

  const settings = getAudioSettings();
  if (!settings.lessonCompleteEnabled || settings.volume <= 0) {
    return;
  }

  const audio = new Audio(src);
  audio.volume = clampVolume(settings.volume * volumeScale);
  void audio.play().catch(() => {
    // Browsers may block sounds before the first user gesture.
  });
}
