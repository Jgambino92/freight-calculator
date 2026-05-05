const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    title: 'Primizie Freight Calculator',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'freight-calculator.html'));

  // Build a minimal menu (so users can copy/paste, zoom, etc.)
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => checkForUpdates(true)
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        ...(isMac ? [] : [{
          label: 'Check for Updates...',
          click: () => checkForUpdates(true)
        }]),
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --- Auto-updater ---
// On launch, silently check for updates (only when packaged).
// User can also trigger manually from the menu.
let manualUpdateCheck = false;

function checkForUpdates(manual) {
  manualUpdateCheck = !!manual;
  if (!app.isPackaged) {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        message: 'Updates only run in the packaged app',
        detail: 'You are running from source — auto-update is disabled in dev mode.'
      });
    }
    return;
  }
  autoUpdater.checkForUpdates().catch(err => {
    if (manual) {
      dialog.showErrorBox('Update check failed', err.message);
    }
  });
}

autoUpdater.on('update-available', () => {
  if (manualUpdateCheck) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: 'Update available',
      detail: 'A new version is downloading in the background. You will be prompted to install when ready.'
    });
  }
});

autoUpdater.on('update-not-available', () => {
  if (manualUpdateCheck) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: 'You are up to date',
      detail: 'You have the latest version of Primizie Freight Calculator.'
    });
  }
});

autoUpdater.on('error', (err) => {
  if (manualUpdateCheck) {
    dialog.showErrorBox('Update error', err == null ? 'unknown' : (err.stack || err).toString());
  }
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    buttons: ['Restart and Install', 'Later'],
    defaultId: 0,
    message: 'Update ready to install',
    detail: 'A new version has been downloaded. Restart the app to apply the update.'
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

app.whenReady().then(() => {
  createWindow();
  // Silent check on launch (5s after window opens, so it doesn't slow startup)
  setTimeout(() => checkForUpdates(false), 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
