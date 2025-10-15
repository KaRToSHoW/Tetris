import { Audio } from 'expo-av';

const soundFiles: Record<string, any> = {
  menu: require('../music/main.mp3'),
  game_theme: require('../music/game_theme.mp3'),
  shift: require('../music/sound16.mp3'),
  down: require('../music/down.mp3'),
  collect: require('../music/Collect.mp3'),
  click: require('../music/click.mp3'),
};


type SoundMap = {
  [key: string]: Audio.Sound | null;
};

const sounds: SoundMap = {
  menu: null,
  game_theme: null,
  shift: null,
  down: null,
  collect: null,
  click: null,
};

let isInitialized = false;

export async function initSounds() {
  if (isInitialized) return;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });
  isInitialized = true;
}

async function loadSound(key: string) {
  const { sound } = await Audio.Sound.createAsync(soundFiles[key], {
    shouldPlay: false,
  });
  sounds[key] = sound;
  return sound;
}

export async function playSound(key: keyof typeof sounds) {
  if (!isInitialized) await initSounds();

  if (!sounds[key]) await loadSound(key);
  const sound = sounds[key];
  if (!sound) return;

  await sound.replayAsync();
}

export async function playMusic(key: 'menu' | 'game_theme') {
  if (!isInitialized) await initSounds();

  if (!sounds[key]) await loadSound(key);
  const sound = sounds[key];
  if (!sound) return;

  await sound.setIsLoopingAsync(true);
  await sound.playAsync();
}

export async function stopMusic(key: 'menu' | 'game_theme') {
  const sound = sounds[key];
  if (sound) {
    await sound.stopAsync();
    await sound.setPositionAsync(0);
  }
}

export async function unloadAllSounds() {
  for (const key of Object.keys(sounds)) {
    const s = sounds[key];
    if (s) {
      await s.unloadAsync();
      sounds[key] = null;
    }
  }
  isInitialized = false;
}
