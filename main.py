import os

from keep_alive import app, run


if __name__ == "__main__":
    run(port=int(os.environ.get("PORT", 4000)))
