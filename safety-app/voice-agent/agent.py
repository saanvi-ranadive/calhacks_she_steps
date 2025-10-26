from livekit import agents
from livekit.agents import Agent, AgentSession
from livekit.plugins import openai, silero

from livekit.plugins.openai import realtime
from dotenv import load_dotenv
from livekit.agents import AgentSession, inference


load_dotenv(".env")

class SafetyAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are a helpful safety assistant for a women's safety app. "
                "Be concise, supportive, and speak in short sentences."
            )
        )

async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt="deepgram/nova-2-general",
        llm=openai.realtime.RealtimeModel(
            model="gpt-4o-realtime-preview",
            modalities=["text"]
        ),
        tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
    )


    await session.start(room=ctx.room, agent=SafetyAssistant())

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
