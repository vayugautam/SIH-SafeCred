import subprocess
import os

out = ""
try:
    res1 = subprocess.run(["git", "status"], capture_output=True, text=True, cwd=r"E:\SIH Synapse\SIH-SafeCred")
    out += "GIT STATUS:\n" + res1.stdout + "\n" + res1.stderr + "\n\n"
    
    res2 = subprocess.run(["git", "log", "-n", "3", "--stat"], capture_output=True, text=True, cwd=r"E:\SIH Synapse\SIH-SafeCred")
    out += "GIT LOG:\n" + res2.stdout + "\n" + res2.stderr + "\n\n"
except Exception as e:
    out += str(e)

with open(r"E:\SIH Synapse\SIH-SafeCred\scratch_git.txt", "w", encoding="utf-8") as f:
    f.write(out)
