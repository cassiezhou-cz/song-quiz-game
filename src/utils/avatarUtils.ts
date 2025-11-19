type AvatarType = 'Cat' | 'Boy' | 'Girl' | 'Corgi' | 'Robot' | 'Panda'
type AvatarState = 'Neutral' | 'Happy' | 'Sad'

/**
 * Get the avatar image path based on the selected avatar, state, and hat status
 * @param state - The emotional state of the avatar (Neutral, Happy, Sad)
 * @param hatUnlocked - Whether the hat has been unlocked (only applies to Cat)
 * @returns The path to the avatar image
 */
export const getAvatarPath = (
  state: AvatarState = 'Neutral',
  hatUnlocked: boolean = false
): string => {
  // Get the selected avatar from localStorage, default to Cat
  const selectedAvatar: AvatarType = (localStorage.getItem('player_avatar') as AvatarType) || 'Cat'
  
  // Only Cat has hat variants
  if (selectedAvatar === 'Cat' && hatUnlocked) {
    return `/assets/CatHat${state}.png`
  }
  
  // All other avatars use the standard naming convention
  return `/assets/${selectedAvatar}${state}.png`
}

