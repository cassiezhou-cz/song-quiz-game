# Handoff Notes - November 25, 2024

## Quick Start for Next Session

### Getting the Game Running
```bash
cd "/Users/alex/Desktop/Local SQ Changes/song-quiz-game"
npm run dev
# Server will start on http://localhost:5173 (or next available port)
```

## What Was Done Today

### ✅ Completed Changes (Already Pushed to GitHub)

1. **Lifeline Selection Rules** - Players now get:
   - Song Swap (always)
   - One random artist lifeline (Artist Letter Reveal OR Artist Multiple Choice)
   - One random song lifeline (Song Letter Reveal OR Song Multiple Choice)

2. **Master Mode Time Balance** - Reduced time bonus:
   - Both answers correct: 6s → 3s
   - One answer correct: 3s (unchanged)

**Location:** `src/components/Game.tsx`  
**Commit:** a295e64  
**Branch:** main (synced with GitHub)

## Current State

### Repository Status
- **Branch:** main
- **Remote:** https://github.com/cassiezhou-cz/song-quiz-game
- **Status:** Clean working directory for game code
- **Uncommitted Files:** Some documentation files have local edits (see below)

### Uncommitted Documentation Changes
These files have local modifications that weren't committed:
- GAME_REFACTOR_PLAN.md
- HANDOFF_NOTES.md
- HANDOFF_QUICK_START.md
- REFACTOR_COMPLETE.md
- REFACTOR_PROGRESS.md
- SESSION_SUMMARY_NOV_19_2024_FINAL.md
- SESSION_SUMMARY_NOV_7_2024_FINAL.md
- HANDOFF_NOV_21_2025.md (new, untracked)

**Action Needed:** Review these files and decide if changes should be committed or discarded.

## Testing Checklist

### Lifeline Selection Testing
- [ ] Start multiple new games
- [ ] Verify first lifeline is always Song Swap
- [ ] Verify second lifeline alternates between artist options
- [ ] Verify third lifeline alternates between song options
- [ ] Confirm good variety across multiple playthroughs

### Master Mode Testing
- [ ] Play Master Mode (Version C)
- [ ] Get both answers correct → should add 3 seconds
- [ ] Verify time bonus feels balanced
- [ ] Check if game is too difficult with reduced time

## Key Files Reference

### Main Game Logic
- **Game Component:** `src/components/Game.tsx` (main game logic, ~8000 lines)
- **Playlist Selection:** `src/components/PlaylistSelection.tsx`

### Configuration
- **Package Manager:** npm
- **Build Tool:** Vite 6.3.5
- **Framework:** React 18.3.1 + TypeScript

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Common Issues & Solutions

### Port Already in Use
If you see "Port 5173 is in use":
```bash
pkill -f "vite"  # Kill any running Vite servers
npm run dev      # Restart
```

### Multiple Vite Instances
Check running instances:
```bash
lsof -i :5173,5174,5175 | grep LISTEN
```

### Clean Restart
```bash
pkill -f "vite"
cd "/Users/alex/Desktop/Local SQ Changes/song-quiz-game"
npm install  # If needed
npm run dev
```

## Next Steps / Ideas

### Potential Future Work
1. Consider adding visual indicators for which lifelines are available
2. May want to adjust point values if time bonus change affects scoring balance
3. Could add analytics to track lifeline usage patterns
4. Consider whether documentation changes should be committed

### Questions to Answer
- Is Master Mode difficulty appropriate with 3-second bonus?
- Do players notice/appreciate the structured lifeline selection?
- Should we add UI hints about which lifelines are available before starting?

## Additional Resources
- **Session Summary:** See `SESSION_SUMMARY_NOV_25_2024.md` for detailed change log
- **Previous Handoffs:** Multiple HANDOFF_*.md files in root directory
- **Setup Guide:** `docs/SETUP-GUIDE.md`

---

**Environment:** macOS 24.5.0  
**Node/npm:** Installed via package.json  
**Last Updated:** November 25, 2024  
**Status:** Ready for next session





