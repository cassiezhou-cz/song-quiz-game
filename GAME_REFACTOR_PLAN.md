# Game.tsx Refactor Plan - Playlist XP System

## Goal
Replace Global XP system with Playlist-specific XP/Level system on results screen.

## Changes Required

### 1. State Variables (DONE)
- ✅ Replaced segment-based state with `playlistLevel`, `playlistXP`, `displayedPlaylistXP`
- ✅ Added `getPlaylistXPRequired(level)` function
- ✅ Added level-up modal state

### 2. Remove Global XP Components
- Remove all Global XP meter display code (lines ~5936-6013)
- Remove global XP animation logic
- Remove player level/hat unlock logic (or keep minimal version)

### 3. Remove Playlist Segment Animations
- Remove flying music notes state and logic
- Remove segment-filling animations
- Remove rank-up modals (bronze/silver/gold/platinum)
- Remove `showPlaylistMeter`, `tempFilledSegments`, `fillingSegmentIndex`
- Remove all music note flying animations

### 4. Add Playlist XP System
**Award XP:**
- Award 20 XP per newly completed song
- Calculate total XP earned from new songs
- Add to playlist XP, check for level ups

**Display:**
- Show playlist level meter where global XP was (same circular design)
- Show: "LVL X" badge + progress bar + "XX/YY XP"
- When Level 10 reached, show "MASTERED"

**Level Up:**
- When XP exceeds requirement, level up
- Show level-up modal/animation
- Save new level/XP to localStorage

### 5. Simplify Results Flow
**Current Complex Flow:**
1. Quiz Complete → Final Score
2. Show XP bar → Animate XP
3. Show Song List
4. Fly music notes to segments
5. Fill segments one by one
6. Show rank-up modal

**New Simple Flow:**
1. Quiz Complete → Final Score
2. Show Playlist XP bar → Animate XP gain
3. Show Song List (no music note animations)
4. If level up → Show level-up modal

### 6. Save Progress
- On game complete, calculate new XP
- Save `{ level, xp }` to localStorage under playlist key
- Remove segment-based saving

## Implementation Steps
1. Remove all flying note code
2. Remove segment meter rendering  
3. Replace Global XP meter JSX with Playlist XP meter
4. Update XP calculation to award playlist XP
5. Add playlist level-up logic
6. Test and verify









