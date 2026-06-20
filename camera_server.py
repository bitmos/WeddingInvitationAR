"""
OpenCV camera server — streams laptop camera as MJPEG over HTTP.
The AR wedding web app reads this stream as its camera background.

Usage:
    python camera_server.py
    Then open  http://localhost:5173  in the browser.

The stream endpoint is  http://localhost:8765/feed
"""

import cv2
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Config ──────────────────────────────────────────────────────────────────
CAMERA_INDEX = 0          # 0 = built-in webcam; try 1 or 2 for external cams
STREAM_PORT  = 8765
STREAM_FPS   = 30
JPEG_QUALITY = 85         # 0-100 — lower = smaller/faster, higher = sharper

# ── Shared frame state ───────────────────────────────────────────────────────
lock         = threading.Lock()
latest_frame = None        # raw bytes of the latest JPEG


def capture_loop():
    """Background thread: opens the camera and keeps latest_frame updated."""
    global latest_frame

    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)   # CAP_DSHOW = Windows DirectShow
    if not cap.isOpened():
        # Fallback: try without DirectShow backend
        cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        print(f"[ERROR] Cannot open camera index {CAMERA_INDEX}")
        return

    # Request a decent resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, STREAM_FPS)

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[camera] Opened — {w}x{h} @ {cap.get(cv2.CAP_PROP_FPS):.0f} fps")

    encode_params = [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]
    interval = 1.0 / STREAM_FPS

    while True:
        t0 = time.time()
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue

        # Flip horizontally so it feels like a mirror (natural for selfie)
        frame = cv2.flip(frame, 1)

        ok, buf = cv2.imencode('.jpg', frame, encode_params)
        if ok:
            with lock:
                latest_frame = buf.tobytes()

        # Pace the loop to target FPS
        elapsed = time.time() - t0
        sleep_for = interval - elapsed
        if sleep_for > 0:
            time.sleep(sleep_for)

    cap.release()


class MJPEGHandler(BaseHTTPRequestHandler):
    """Serves the MJPEG stream and a CORS-friendly health endpoint."""

    def log_message(self, fmt, *args):
        # Suppress per-request access log noise
        pass

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/feed':
            self._stream()
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_cors_headers()
            self.end_headers()
            self.wfile.write(b'ok')
        else:
            self.send_response(404)
            self.end_headers()

    def _stream(self):
        self.send_response(200)
        self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=frame')
        self.send_cors_headers()
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()

        try:
            while True:
                with lock:
                    frame_bytes = latest_frame

                if frame_bytes is None:
                    time.sleep(0.01)
                    continue

                # MJPEG frame envelope
                header = (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n'
                    b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n'
                    b'\r\n'
                )
                try:
                    self.wfile.write(header + frame_bytes + b'\r\n')
                    self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    break   # client disconnected

                time.sleep(1.0 / STREAM_FPS)

        except Exception as e:
            print(f"[stream] Client disconnected: {e}")


def main():
    # Start capture in background thread (daemon so it exits with main)
    t = threading.Thread(target=capture_loop, daemon=True)
    t.start()

    # Brief wait for first frame
    print(f"[server] Starting MJPEG stream on http://localhost:{STREAM_PORT}/feed")
    print(f"[server] Open the wedding site at  http://localhost:5173")
    print(f"[server] Press Ctrl+C to stop.\n")

    server = HTTPServer(('0.0.0.0', STREAM_PORT), MJPEGHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[server] Shutting down.")
        server.server_close()


if __name__ == '__main__':
    main()
