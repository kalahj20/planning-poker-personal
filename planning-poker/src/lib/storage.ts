export interface StoredParticipant {
  id: string;
  name: string;
}

const STORAGE_KEY_PREFIX = "planning_poker_participant_";

export function getStoredParticipant(roomKey: string): StoredParticipant | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${roomKey}`);
    if (data) {
      return JSON.parse(data) as StoredParticipant;
    }
  } catch (err) {
    console.error("Failed to read participant from local storage", err);
  }
  return null;
}

export function setStoredParticipant(roomKey: string, participant: StoredParticipant) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${roomKey}`, JSON.stringify(participant));
  } catch (err) {
    console.error("Failed to save participant to local storage", err);
  }
}

export function clearStoredParticipant(roomKey: string) {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${roomKey}`);
  } catch (err) {
    console.error("Failed to clear participant from local storage", err);
  }
}
