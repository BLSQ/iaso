class CommandLogger:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    END = "\033[0m"

    INVERTED = "\033[7m"

    def __init__(self, stdout):
        self.stdout = stdout

    def print(self, s, *kwargs):
        message = " ".join(list(map(lambda s: str(s), kwargs)))
        self.stdout.write(s + message)

    def error(self, s, *kwargs):
        self.print(CommandLogger.RED + "ERROR " + str(s) + CommandLogger.END, *kwargs)

    def ok(self, s, *kwargs):
        self.print(CommandLogger.GREEN + str(s) + CommandLogger.END, *kwargs)

    def warn(self, s, *kwargs):
        self.print(CommandLogger.YELLOW + "WARN " + str(s) + CommandLogger.END, *kwargs)

    def info(self, s, *kwargs):
        self.print(str(s), *kwargs)
