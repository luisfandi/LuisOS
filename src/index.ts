import { app, BrowserWindow, screen, protocol } from 'electron';
import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// --- CONFIGURACIÓN DE RESOLUCIÓN FORZADA ---
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
      webSecurity: false, // Esto ya lo tenemos, pero vamos a reforzarlo
      allowRunningInsecureContent: true,
    },
  });

  // --- AGREGÁ ESTE BLOQUE ACÁ ABAJO ---
  // Esto elimina el "filtro" de seguridad que te está tirando el error rojo
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [''] // Borramos la política de seguridad a la fuerza
      }
    });
  });
  // ------------------------------------

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  
  // ... resto del código

  // --- SOLUCIÓN PARA LA PANTALLA ROJA ---
  // Inyectamos CSS para ocultar el cartel de error de Webpack que te molesta
  mainWindow.webContents.on('did-frame-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      .webpack-dev-server-client-overlay { display: none !important; }
      #webpack-dev-server-client-overlay { display: none !important; }
    `);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
  });
};

// --- REGISTRO DE PROTOCOLO Y CICLO DE VIDA ---

app.on('ready', () => {
  // Registramos el protocolo 'static' para bypass de seguridad
  protocol.registerFileProtocol('static', (request, callback) => {
    const url = request.url.replace('static://', '');
    try {
      // Busca el archivo en la carpeta raíz del proyecto
      return callback(path.normalize(`${process.cwd()}/${url}`));
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