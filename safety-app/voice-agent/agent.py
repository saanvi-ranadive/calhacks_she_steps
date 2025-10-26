"""
Simple LiveKit voice agent for safety app using Claude
Run this locally to test the voice agent functionality
"""
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent
from livekit.plugins import anthropic, silero

# Load environment variables from .env file in current directory
load_dotenv()

class SafetyAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful safety assistant for a women's safety app.
            You can provide:
            - Safety tips and recommendations
            - Emergency contact information
            - Directions to safe locations
            - Real-time safety advice based on user location

            Be concise, supportive, and prioritize user safety in all responses.
            Keep responses short and conversational - aim for 1-2 sentences per response."""
        )

async def entrypoint(ctx: agents.JobContext):
    # Use Claude with STT-LLM-TTS pipeline
    # STT and TTS use LiveKit Inference (no extra API keys needed!)
    session = AgentSession(
        stt="deepgram/nova-2-general",  # Speech-to-text via LiveKit Inference
        llm=anthropic.LLM(              # Claude for intelligence
            model="claude-3-5-sonnet",
        ),
        tts="cartesia/sonic-english",   # Text-to-speech via LiveKit Inference
        vad=silero.VAD.load(),          # Voice activity detection
    )

    await session.start(
        room=ctx.room,
        agent=SafetyAssistant(),
    )

    # Greet the user when they join
    await session.generate_reply(
        instructions="Greet the user warmly and let them know you're here to help with safety information and support."
    )

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
