import sys
import traceback

try:
    from app.main import app
    with open("startup_error.txt", "w") as f:
        f.write("Success! App imported fine.")
except Exception as e:
    with open("startup_error.txt", "w") as f:
        f.write("Exception:\n")
        f.write(traceback.format_exc())
except BaseException as e:
    with open("startup_error.txt", "w") as f:
        f.write("BaseException:\n")
        f.write(traceback.format_exc())
