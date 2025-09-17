/**
 * Song Tracker Utility
 * Manages played songs per playlist using localStorage
 * Prevents song repeats until all playlist songs have been played
 */

const STORAGE_KEY = 'song-quiz-played-songs';

interface PlaylistTracker {
  [playlistName: string]: string[]; // Array of played song IDs per playlist
}

/**
 * Get played songs for a specific playlist
 */
export const getPlayedSongs = (playlist: string): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: PlaylistTracker = JSON.parse(stored);
    return data[playlist] || [];
  } catch (error) {
    console.warn('Error reading played songs from localStorage:', error);
    return [];
  }
};

/**
 * Add a song to the played list for a playlist
 */
export const addPlayedSong = (playlist: string, songId: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: PlaylistTracker = stored ? JSON.parse(stored) : {};
    
    if (!data[playlist]) {
      data[playlist] = [];
    }
    
    // Only add if not already in the list
    if (!data[playlist].includes(songId)) {
      data[playlist].push(songId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.warn('Error saving played song to localStorage:', error);
  }
};

/**
 * Check if all songs in a playlist have been played
 */
export const allSongsPlayed = (playlist: string, totalSongs: number): boolean => {
  const playedSongs = getPlayedSongs(playlist);
  return playedSongs.length >= totalSongs;
};

/**
 * Reset played songs for a specific playlist
 * This happens automatically when all songs have been played once
 */
export const resetPlaylistProgress = (playlist: string): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const data: PlaylistTracker = JSON.parse(stored);
    data[playlist] = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Error resetting playlist progress:', error);
  }
};

/**
 * Get available (unplayed) songs from a playlist
 */
export const getAvailableSongs = (playlist: string, allSongs: { id: string }[]): { id: string }[] => {
  const playedSongIds = getPlayedSongs(playlist);
  const availableSongs = allSongs.filter(song => !playedSongIds.includes(song.id));
  
  // If all songs have been played, reset and return all songs
  if (availableSongs.length === 0 && allSongs.length > 0) {
    resetPlaylistProgress(playlist);
    return allSongs;
  }
  
  return availableSongs;
};

/**
 * Debug function to check current state
 */
export const getTrackerState = (): PlaylistTracker => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Error reading tracker state:', error);
    return {};
  }
};
