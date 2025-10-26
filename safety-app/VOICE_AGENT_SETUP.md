# Voice Agent Setup Guide

This guide will help you set up the LiveKit voice agent integration for the Safety App.

## Prerequisites

1. **LiveKit Cloud Account**: Sign up for a free account at https://cloud.livekit.io
2. **LiveKit Agent**: You'll need to deploy a voice agent to handle conversations

## Step 1: Configure LiveKit Credentials

### Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your LiveKit credentials from https://cloud.livekit.io:
   ```
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

4. Install the updated dependencies:
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Frontend Configuration

1. Navigate to the app directory:
   ```bash
   cd womens-safety-app
   ```

2. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

3. Edit `.env.local` and add your LiveKit URL:
   ```
   EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   EXPO_PUBLIC_API_URL=http://localhost:5001
   ```

## Step 2: Deploy a LiveKit Agent

You need to deploy a voice agent that will handle the conversations. Follow the [LiveKit Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai) to create and deploy an agent.

### Quick Agent Setup

1. Create a new directory for your agent:
   ```bash
   mkdir voice-agent
   cd voice-agent
   ```

2. Follow the LiveKit quickstart guide to create a simple agent:
   - Install Python 3.9+ or Node.js 20+
   - Install the LiveKit CLI: `brew install livekit-cli` (macOS) or follow the [CLI installation guide](https://docs.livekit.io/home/cli)
   - Initialize your agent project
   - Configure the agent with safety-related instructions

3. Example agent instructions for safety context:
   ```python
   instructions = """You are a helpful safety assistant for a women's safety app.
   You can provide:
   - Safety tips and recommendations
   - Emergency contact information
   - Directions to safe locations
   - Real-time safety advice based on user location

   Be concise, supportive, and prioritize user safety in all responses."""
   ```

4. Deploy your agent to LiveKit Cloud:
   ```bash
   lk agent create
   ```

## Step 3: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   python app.py
   ```

2. Start your React Native app:
   ```bash
   cd womens-safety-app
   npm start
   ```

3. Open the app on your device or simulator

4. Navigate to the "Voice AI" tab

5. Tap "Start Voice Session" to connect to the voice agent

## Features

The voice agent integration provides:

- **Natural Conversation**: Speak naturally with the AI assistant
- **Safety Information**: Get real-time safety tips and recommendations
- **Location Aware**: The agent can provide context-specific advice
- **Emergency Support**: Quick access to emergency information

## Troubleshooting

### "Could not connect to voice agent" error

1. Make sure your backend server is running (`python app.py`)
2. Verify your LiveKit credentials are correct in both `.env` files
3. Check that you have deployed a LiveKit agent
4. Ensure your LiveKit Cloud project is active

### "LiveKit credentials not configured" error

1. Make sure you created a `.env` file in the backend directory
2. Verify the environment variables are set correctly
3. Restart the backend server after adding credentials

### Agent not responding

1. Check the LiveKit Cloud dashboard to see if your agent is running
2. Verify the agent is deployed and active
3. Check the agent logs for any errors
4. Make sure your agent is configured with the correct dispatch rules

## Advanced Configuration

### Custom Agent Behavior

You can customize the agent's behavior by modifying the agent instructions in your deployed agent code. See the [LiveKit Agents documentation](https://docs.livekit.io/agents/build) for more details.

### Agent Dispatch Rules

Configure agent dispatch rules in LiveKit Cloud to control when and how agents are assigned to rooms. See [Agent Dispatch](https://docs.livekit.io/agents/worker/agent-dispatch) for details.

### Adding Tools and Functions

Enhance your agent with custom tools and function calling. For example, you could add:
- Location-based safety lookups
- Emergency contact dialing
- Real-time risk assessment queries

See [Tool Definition & Use](https://docs.livekit.io/agents/build/tools) for implementation details.

## Resources

- [LiveKit Agents Documentation](https://docs.livekit.io/agents)
- [Voice AI Quickstart](https://docs.livekit.io/agents/start/voice-ai)
- [LiveKit React Native SDK](https://github.com/livekit/client-sdk-react-native)
- [LiveKit Cloud Dashboard](https://cloud.livekit.io)
