class CommandLogger:
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    END = "\033[0m"

    INVERTED = "\033[7m"

    def __init__(self, stdout):
        self.stdout = stdout

    def colorize(self, s, color):
        return color + str(s) + CommandLogger.END

    def print(self, s, *kwargs):
        message = " ".join(list(map(lambda s: str(s), kwargs)))
        self.stdout.write(s + message + "\r\n")

    def error(self, s, *kwargs):
        self.print(self.colorize("ERROR " + str(s) + " ", CommandLogger.RED), *kwargs)

    def ok(self, s, *kwargs):
        self.print(self.colorize(str(s) + " ", CommandLogger.GREEN), *kwargs)

    def warn(self, s, *kwargs):
        self.print(self.colorize("WARN " + str(s) + " ", CommandLogger.YELLOW), *kwargs)

    def info(self, s, *kwargs):
        self.print(str(s) + " ", *kwargs)

    def flush(self):
        self.stdout.flush()
