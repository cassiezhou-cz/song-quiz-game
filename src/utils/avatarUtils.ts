type AvatarType = 'Cat' | 'Boy' | 'Girl' | 'Corgi' | 'Robot' | 'Panda'
type AvatarState = 'Neutral' | 'Happy' | 'Sad'

export const getAvatarPath = (
  state: AvatarState = 'Neutral',
  hatUnlocked: boolean = false
): string => {
  const selectedAvatar: AvatarType = (localStorage.getItem('player_avatar') as AvatarType) || 'Cat'
  
  if (selectedAvatar === 'Cat' && hatUnlocked) {
    return `/assets/CatHat${state}.png`
  }
  
  return `/assets/${selectedAvatar}${state}.png`
}
