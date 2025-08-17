# 🤖 AI Integration Guide

This guide shows how to add AI-powered host commentary to your competitive song quiz game.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install openai @anthropic-ai/sdk
```

### 2. Configure API Keys
Create a `.env` file in your project root:
```bash
# Required for AI host commentary
VITE_OPENAI_API_KEY=your-openai-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini

# Optional: for voice synthesis
VITE_ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

**Get API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- ElevenLabs: https://elevenlabs.io/ (for voice)

### 3. Add AI Host to Your Game

Import and add the AI Host component to your `Game.tsx`:

```tsx
import AIHost from './AIHost'

// In your Game component, add state for AI host
const [hostPhase, setHostPhase] = useState<'question_start' | 'correct_answer' | 'wrong_answer' | 'round_end' | 'game_end'>('question_start')

// Update host phase when game events happen
const handleAnswerSelect = (option: string) => {
  // ... existing answer logic ...
  
  const correct = option === currentQuestion.correctAnswer
  setIsCorrect(correct)
  setOpponentCorrect(Math.random() < 0.4) // 40% opponent success rate
  
  // Update AI host
  setHostPhase(correct ? 'correct_answer' : 'wrong_answer')
  
  if (correct) {
    setScore(prev => prev + 10)
  }
  if (opponentCorrect) {
    setOpponentScore(prev => prev + 10)
  }
  
  setShowFeedback(true)
}

// Add the AI Host component to your JSX
return (
  <div className="game-container">
    {/* Your existing game content */}
    
    {/* Add AI Host */}
    <AIHost
      gamePhase={hostPhase}
      playerName="You" // or get from user input
      playerScore={score}
      opponentScore={opponentScore}
      songTitle={currentQuestion?.song.title}
      songArtist={currentQuestion?.song.artist}
      isCorrect={isCorrect}
      enabled={true} // You can add a toggle for this
      voiceEnabled={true} // You can add a toggle for this
    />
  </div>
)
```

## 🎯 AI Features Overview

### **AI Host Commentary**
- **Dynamic responses** based on game context
- **Personality-driven** Riley host character
- **Context-aware** - knows scores, songs, player performance
- **Multiple response lengths** for different game moments

### **Voice Synthesis (Optional)**
- **ElevenLabs TTS** for spoken commentary
- **Natural speech patterns** with SSML enhancement
- **Game show energy** optimized voice settings

### **Smart Integration**
- **Graceful fallbacks** - works without API keys
- **Non-disruptive** - doesn't interfere with existing gameplay
- **Performance optimized** - async generation with caching

## 🎮 Game Phase Integration

Update `hostPhase` state during these game events:

```tsx
// When starting a new question
setHostPhase('question_start')

// When player answers correctly
setHostPhase('correct_answer')

// When player answers incorrectly  
setHostPhase('wrong_answer')

// When round ends
setHostPhase('round_end')

// When game completes
setHostPhase('game_end')
```

## 🛠 Customization Options

### Response Lengths
- `short`: 1-3 words (quick reactions)
- `medium`: 3-8 words (brief commentary)
- `long`: 12-20 words (full host commentary)

### Voice Settings
```tsx
<AIHost
  voiceEnabled={true}
  // Add voice customization props as needed
/>
```

### Personality Customization
Modify `aiService.ts` to adjust Riley's personality:
- Energy level
- Language style
- Reaction types
- Commentary focus

## 🔧 Advanced Features

### Multiple AI Personalities
Extend the system to support different host personalities by modifying the system prompts in `aiService.ts`.

### Live Commentary
The AI host can provide real-time commentary during song playback by triggering updates at specific moments.

### Multiplayer Integration
Scale to support multiple players with personalized commentary for each participant.

## 💡 Cost Considerations

- **GPT-4o-mini**: ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Typical usage**: 200-500 tokens per response
- **ElevenLabs**: ~$0.30 per 1K characters for voice synthesis
- **Recommendation**: Start with text-only AI host, add voice later

## 🐛 Troubleshooting

### AI Host Not Appearing
1. Check `.env` file has correct API key
2. Verify API key starts with `sk-proj-` or `sk-`
3. Restart development server after adding keys
4. Check browser console for API errors

### Voice Not Working
1. Verify ElevenLabs API key is configured
2. Check browser console for CORS errors
3. Test in production environment (CORS issues common in dev)

### Poor Response Quality
1. Adjust temperature in `aiService.ts` (0.7-0.9 for creativity)
2. Modify system prompts for better context
3. Try different OpenAI models (gpt-4o for best quality)

## 🚀 Next Steps

1. **Test with basic text responses** first
2. **Add voice synthesis** once text is working well
3. **Customize personality** to match your game's vibe
4. **Add user controls** for enabling/disabling AI features
5. **Consider multiplayer** AI host for competitive games

The AI host enhances your quiz game without changing core gameplay - players get the same great experience with added entertainment value!
