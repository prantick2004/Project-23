"""
Phase 4 sanity test — connects to ws://host/ws/stream/{camera_id},
saves the first 5 received JPEG frames to disk to confirm the live
WebSocket video pipeline works end-to-end.

Run with: python3 scripts/test_ws_stream.py <camera_id>
"""
import sys
import asyncio
import websockets

CAMERA_ID = sys.argv[1] if len(sys.argv) > 1 else "4fab1bc7-d078-45b2-ab86-8b73882eb068"
WS_URL = f"ws://localhost:8000/ws/stream/{CAMERA_ID}"
FRAMES_TO_SAVE = 5


async def main() -> None:
    print(f"Connecting to {WS_URL} ...")
    async with websockets.connect(WS_URL) as ws:
        print("Connected. Waiting for frames...")
        for i in range(FRAMES_TO_SAVE):
            data = await ws.recv()
            path = f"scripts/ws_frame_{i}.jpg"
            with open(path, "wb") as f:
                f.write(data)
            print(f"Saved {path} ({len(data)} bytes)")
    print("SUCCESS: WebSocket stream test complete.")


if __name__ == "__main__":
    asyncio.run(main())
