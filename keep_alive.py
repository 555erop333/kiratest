import os
from pathlib import Path
from threading import Thread

from flask import Flask, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_PORT = 4000

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/<path:asset_path>")
def static_files(asset_path):
    target_path = BASE_DIR / asset_path

    if target_path.is_file():
        return send_from_directory(BASE_DIR, asset_path)

    return send_from_directory(BASE_DIR, "index.html")


def run(host="0.0.0.0", port=None):
    selected_port = port or int(os.environ.get("PORT", DEFAULT_PORT))
    app.run(host=host, port=selected_port)


def keep_alive():
    thread = Thread(target=run, daemon=True)
    thread.start()
    return thread
