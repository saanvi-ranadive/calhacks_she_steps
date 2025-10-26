# Safety App Voice Agent (Powered by Claude)

This is the AI agent that powers the voice assistant in the safety app using Claude.

## Quick Setup

1. **Install Python 3.9+** if you don't have it

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Download model files** (for voice activity detection):
   ```bash
   python agent.py download-files
   ```

5. **Configure credentials**:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add:
   - **LiveKit credentials** from https://cloud.livekit.io
   - **Anthropic API key** from https://console.anthropic.com/

6. **Run the agent locally**:
   ```bash
   python agent.py dev
   ```

## How It Works

This agent uses a **STT-LLM-TTS pipeline**:

- **STT (Speech-to-Text)**: Deepgram via LiveKit Inference (no extra API key needed!)
- **LLM (Intelligence)**: Claude 3.5 Sonnet via Anthropic API
- **TTS (Text-to-Speech)**: Cartesia via LiveKit Inference (no extra API key needed!)

Only the Claude/Anthropic API key is required - LiveKit Inference handles STT and TTS automatically!

## What Happens

When you run the agent:
1. It connects to your LiveKit Cloud project
2. Waits for users to join rooms
3. When a user joins, it automatically joins the same room
4. Listens to your voice and responds using Claude

## Testing

1. **Start the agent**: `python agent.py dev`
2. **Open your mobile app**
3. **Go to "Voice AI" tab**
4. **Tap "Start Voice Session"**
5. **Speak** - Claude will respond with voice!

## Troubleshooting

**"Failed to connect"**
- Check your `.env` file has correct LiveKit credentials
- Make sure credentials match your backend's `.env`

**"Agent doesn't respond"**
- Check ANTHROPIC_API_KEY is set correctly
- Make sure you have Anthropic API credits
- Check the agent console for errors

**"Can't hear the agent"**
- Check your phone/device volume
- Check app permissions for microphone
- Try reconnecting

**"Module not found" errors**
- Run `python agent.py download-files` first
- Make sure you activated the virtual environment

## Deploy to Production

Once it works locally, deploy to LiveKit Cloud:

```bash
# Install LiveKit CLI first (Mac)
brew install livekit-cli

# Login
lk cloud auth

# Deploy
lk agent create
```

Follow the prompts to deploy your agent to run 24/7 in the cloud.

## Why Claude?

Using Claude gives you:
- ✅ More natural, conversational responses
- ✅ Better context understanding
- ✅ Safer, more helpful safety recommendations
- ✅ Lower costs compared to some alternatives
- ✅ No need for multiple AI service API keys

LiveKit Inference handles the speech parts automatically!
