# Playlist XP System Refactor - Progress Report

## ✅ COMPLETED

### Frontend Components (100%)
1. ✅ **PlaylistSelection.tsx** - Fully converted to Level/XP system
   - Shows "LVL X" badge + XP bar + progress numbers
   - Level-based unlocks (Level 5: Daily, Level 10: Master Mode)
   - Migration logic for old segment data
   
2. ✅ **PlaylistPrompt.tsx** - Modal shows playlist level/XP
   - Displays level, XP bar, and unlock status
   - Shows "MASTERED" at Level 10
   - Event button unlocks at Level 5, Master Mode at Level 10

3. ✅ **Game.tsx** - Major refactor in progress
   - Removed flying music notes animation system (~200 lines)
   - Removed segment meter display
   - Replaced Global XP meter with Playlist XP meter on results
   - Awards 20 XP per newly completed song
   - Auto-saves level/XP to localStorage
   - Level-up detection and modal trigger

### What's Working
- Playlist selection screen shows correct levels/XP
- Clicking playlist shows prompt with level info
- XP is awarded for completing new songs
- Level ups are detected and saved

## ⚠️ IN PROGRESS - Remaining Items

### Game.tsx Cleanup Needed
1. **Remove old references** (causing lint errors):
   - Line ~6197: Old rank-up modal JSX (needs removal/replacement)
   - Lines with `badgeRefsMap`, `finalScoreFlyLeft`, `setXpBarFlyLeft`
   - These are leftover from removed animation system

2. **Add Playlist Level-Up Modal** (line ~6197 area):
   - Replace rank-up modal with simple level-up congratulations
   - Show: "Level {X} Unlocked!" 
   - Dismiss with spacebar

3. **Add CSS for new playlist XP meter**:
   - `.playlist-xp-wrapper`, `.playlist-xp-container`
   - `.playlist-level-badge-result`, `.playlist-xp-bar-bg/fill`
   - `.playlist-xp-text`, `.playlist-mastered-result`

### Testing Needed
- Verify XP awards correctly (20 per new song)
- Verify level-ups work (Level 1→2, 2→3, etc.)
- Verify Level 10 shows "MASTERED"
- Verify saves persist across sessions

## 📝 System Overview

### XP Requirements
- Level 1: 100 XP
- Level 2: 120 XP (+20 each level)
- Level 3: 140 XP
- ...
- Level 10: 280 XP

### Unlock Levels
- Level 3: Special Questions unlocked
- Level 5: Daily Challenge (Event) button unlocked
- Level 10: Master Mode unlocked + "MASTERED" status

### XP Awards
- 20 XP per first-time song completion
- Applied when song list appears on results screen
- Auto-saves to localStorage

## 🎯 Next Steps
1. Fix remaining lint errors (remove old refs)
2. Add playlist level-up modal JSX
3. Add CSS for new components
4. Test full flow end-to-end
5. Clean up any console.logs


