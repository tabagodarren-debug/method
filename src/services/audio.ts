import { Audio } from 'expo-av';

// Add bundled track requires here after adding .mp3 files to assets/music/
// Example: const TRACKS = [require('../../assets/music/track-01.mp3'), ...]
const TRACKS: number[] = [];

let sound: Audio.Sound | null = null;
let currentIndex = 0;
let isReady = false;

export async function initAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
  });
  isReady = true;
}

export async function playTrack(index?: number): Promise<void> {
  if (!isReady || TRACKS.length === 0) return;

  currentIndex = index ?? currentIndex;
  const track = TRACKS[currentIndex % TRACKS.length];

  if (sound) {
    await sound.unloadAsync();
    sound = null;
  }

  const { sound: newSound } = await Audio.Sound.createAsync(track, {
    shouldPlay: true,
    isLooping: true,
    volume: 0.6,
  });
  sound = newSound;
}

export async function pauseAudio(): Promise<void> {
  if (!sound) return;
  await sound.pauseAsync();
}

export async function resumeAudio(): Promise<void> {
  if (!sound) return;
  await sound.playAsync();
}

export async function skipTrack(): Promise<void> {
  if (TRACKS.length === 0) return;
  currentIndex = (currentIndex + 1) % TRACKS.length;
  await playTrack(currentIndex);
}

export async function stopAudio(): Promise<void> {
  if (!sound) return;
  await sound.stopAsync();
  await sound.unloadAsync();
  sound = null;
}

export function getCurrentTrackName(): string {
  if (TRACKS.length === 0) return 'No tracks loaded';
  return `Track ${(currentIndex % TRACKS.length) + 1}`;
}

export function hasTracks(): boolean {
  return TRACKS.length > 0;
}
