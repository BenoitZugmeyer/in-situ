const SAVE_CURSOR_POSITION = "\x1b[s";
const RESTORE_CURSOR_POSITION = "\x1b[u";
const ERASE_LINE = "\x1b[K";

const isTTY = process.stderr.isTTY;
let status;

export default {
  debug: makeLogFunction(),
  error: makeLogFunction(),
  status: setStatus,
};

function makeLogFunction() {
  function log(message) {
    if (!log.disabled) {
      clearStatus();
      process.stderr.write(String(message));
      process.stderr.write("\n");
      restoreStatus();
    }
  }
  return log;
}

function setStatus(status_) {
  clearStatus();
  status = status_;
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
