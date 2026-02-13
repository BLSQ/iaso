import os

import psutil


def memory_mb():
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / 1024 / 1024
    return f"Memory: {mem:.2f} MB"
