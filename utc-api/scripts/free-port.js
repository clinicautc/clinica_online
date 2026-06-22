const { execSync } = require('child_process');

const PORT = process.env.PORT || 3001;

function freePortWindows(port) {
  let output;
  try {
    output = execSync(`netstat -ano -p tcp`).toString();
  } catch {
    return;
  }

  const pids = new Set();
  output.split('\n').forEach((line) => {
    const match = line.trim().match(/^TCP\s+\S*:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
    if (match && Number(match[1]) === Number(port)) {
      pids.add(match[2]);
    }
  });

  pids.forEach((pid) => {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[predev] Puerto ${port} estaba ocupado por el proceso ${pid}, se cerró automáticamente.`);
    } catch {
      // El proceso ya no existe o no se pudo cerrar; seguimos.
    }
  });
}

function freePortUnix(port) {
  let output;
  try {
    output = execSync(`lsof -ti tcp:${port}`).toString().trim();
  } catch {
    return;
  }
  if (!output) return;

  output.split('\n').forEach((pid) => {
    try {
      execSync(`kill -9 ${pid}`);
      console.log(`[predev] Puerto ${port} estaba ocupado por el proceso ${pid}, se cerró automáticamente.`);
    } catch {
      // El proceso ya no existe o no se pudo cerrar; seguimos.
    }
  });
}

if (process.platform === 'win32') {
  freePortWindows(PORT);
} else {
  freePortUnix(PORT);
}
