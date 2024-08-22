const SAVE_CURSOR_POSITION = "\x1b[s";
const RESTORE_CURSOR_POSITION = "\x1b[u";
const ERASE_LINE = "\x1b[K";

const isTTY = process.stderr.isTTY;
let status: string | undefined;

export default {
  debug: makeLogFunction(),
  error: makeLogFunction(),
  status: setStatus,
};

interface LogFunction {
  (message: string): void;
  disabled: boolean;
}

function makeLogFunction() {
  const log: LogFunction = (message) => {
    if (!log.disabled) {
      clearStatus();
      process.stderr.write(String(message));
      process.stderr.write("\n");
      restoreStatus();
    }
  };
  log.disabled = false;
  return log;
}

function setStatus(newStatus?: string) {
  clearStatus();
  status = newStatus;
  printStatus();
}

function clearStatus() {
  if (status && isTTY) {
    process.stderr.write(ERASE_LINE);
  }
}

function printStatus() {
  if (status) {
    if (isTTY) {
      process.stderr.write(SAVE_CURSOR_POSITION);
      process.stderr.write(status);
      process.stderr.write(RESTORE_CURSOR_POSITION);
    } else {
      process.stderr.write(status);
      process.stderr.write("\n");
    }
  }
}

function restoreStatus() {
  if (isTTY) printStatus();
}
