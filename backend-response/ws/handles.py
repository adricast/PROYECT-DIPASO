# ws/handlers.py
import asyncio
from .server import broadcast

async def notify_new_user(user):
    await broadcast({"type": "user_saved", "payload": user})
