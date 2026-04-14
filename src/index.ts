import { app, BrowserWindow, screen, protocol } from 'electron';
import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// --- CONFIGURACIÓN DE RESOLUCIÓN PARA DPI ALTO ---
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: true, 
    frame: false,      
    autoHideMenuBar: true,
    backgroundColor: '#050505',
    title: "LUIS_OS",
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, 
      allowRunningInsecureContent: true,
    },
  });

  // --- BYPASS DE SEGURIDAD (Elimina errores de CSP) ---
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [''] 
      }
    });
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // --- LIMPIEZA VISUAL: Ocultar overlays de error de Webpack ---
  mainWindow.webContents.on('did-frame-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      .webpack-dev-server-client-overlay { display: none !important; }
      #webpack-dev-server-client-overlay { display: none !important; }
      /* Forzamos fuente moderna si el sistema la ignora */
      input, button, body { font-family: 'Segoe UI', sans-serif !important; }
    `);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });
};

// --- REGISTRO DE PROTOCOLO INTELIGENTE (DEV vs PROD) ---
app.on('ready', () => {
  protocol.registerFileProtocol('static', (request, callback) => {
    const url = request.url.replace('static://', '');
    
    // Si estamos en producción, buscamos en los recursos empaquetados, sino en la raíz
    const isDev = !app.isPackaged;
    const basePath = isDev ? process.cwd() : path.join(process.resourcesPath, 'app');
    
    try {
      return callback(path.normalize(path.join(basePath, url)));
    } catch (error) {
      console.error("Error en protocolo static:", error);
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});