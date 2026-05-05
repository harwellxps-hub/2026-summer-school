const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// Register a custom protocol so the renderer can request local asset files
// via  asset://slides/beam_damage/slide_01.jpg  without any CORS issues.
// This runs before app is ready.
protocol.registerSchemesAsPrivileged([
  { scheme: 'asset', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'HarwellXPS School 2026',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Optional: set a taskbar icon
    // icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  win.loadFile('index.html');

  // Remove the default menu bar (keeps it clean, like a proper app)
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  // Serve  asset://slides/...  and  asset://handbook/...  from the local assets folder
  protocol.registerFileProtocol('asset', (request, callback) => {
    const url = request.url.replace('asset://', '');
    const filePath = path.join(__dirname, 'assets', decodeURIComponent(url));
    callback({ path: filePath });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: Directory listing ──
ipcMain.handle('list-assets', async (_event, subfolder) => {
  const dir = path.join(__dirname, 'assets', subfolder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .sort();
});

// ── IPC: Subdirectory listing (for named slide decks) ──
ipcMain.handle('list-subfolders', async (_event, subfolder) => {
  const dir = path.join(__dirname, 'assets', subfolder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
    .sort();
});

// ── IPC: Document challenge tree ──
// Reads assets/documents/<sessionId>/ → [{id, title, order}]
ipcMain.handle('document-tree', async (_event, sessionId) => {
  const root = path.join(__dirname, 'assets', 'documents', sessionId);
  if (!fs.existsSync(root)) return null;
  const indexPath = path.join(root, 'index.json');
  const index = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, 'utf8'))
    : {};
  const challenges = fs.readdirSync(root)
    .filter(f => fs.statSync(path.join(root, f)).isDirectory())
    .sort()
    .map(folder => {
      const contentPath = path.join(root, folder, 'content.json');
      let title = folder.replace(/^\d+_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (fs.existsSync(contentPath)) {
        const c = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        const firstHeading = (c.blocks || []).find(b => b.type === 'heading');
        if (firstHeading) title = firstHeading.text;
      }
      return { id: folder, title };
    });
  return { ...index, challenges };
});

// ── IPC: Read document challenge content ──
ipcMain.handle('document-content', async (_event, sessionId, challengeId) => {
  const p = path.join(__dirname, 'assets', 'documents', sessionId, challengeId, 'content.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
});
// Returns nested structure -- works for handbook OR documents/<sessionId>
ipcMain.handle('handbook-tree', async (_event, assetSubfolder) => {
  const root = path.join(__dirname, 'assets', assetSubfolder || 'handbook');
  if (!fs.existsSync(root)) return [];
  function readLevel(dir, depth) {
    if (depth > 3) return [];
    return fs.readdirSync(dir)
      .filter(f => fs.statSync(path.join(dir, f)).isDirectory())
      .sort()
      .map(folder => {
        const fullPath = path.join(dir, folder);
        const hasContent = fs.existsSync(path.join(fullPath, 'content.json'));
        const title = folder.replace(/^\d+_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return { id: folder, title, hasContent, children: readLevel(fullPath, depth + 1) };
      });
  }
  return readLevel(root, 0);
});

ipcMain.handle('handbook-content', async (_event, relPath, assetSubfolder) => {
  const fullPath = path.join(__dirname, 'assets', assetSubfolder || 'handbook', relPath, 'content.json');
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
});

// ── IPC: List PDFs in a folder ──
ipcMain.handle('list-pdfs', async (_event, subfolder) => {
  const dir = path.join(__dirname, 'assets', subfolder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.pdf$/i.test(f))
    .sort()
    .map(f => ({ filename: f, title: f.replace(/\.pdf$/i,'').replace(/_/g,' ') }));
});

// ── IPC: List HTML tools ──
ipcMain.handle('list-tools', async () => {
  const dir = path.join(__dirname, 'assets', 'tools');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.html$/i.test(f))
    .sort()
    .map(f => ({
      filename: f,
      id: f.replace(/\.html$/i,''),
      title: f.replace(/\.html$/i,'').replace(/[_-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
    }));
});

// ── IPC: Open PDF in system viewer ──
ipcMain.handle('open-pdf', async (_event, subfolder, filename) => {
  const { shell } = require('electron');
  const fullPath = path.join(__dirname, 'assets', subfolder, filename);
  shell.openPath(fullPath);
});

// ── IPC: Read JSON content files ──
ipcMain.handle('read-json', async (_event, filename) => {
  const filePath = path.join(__dirname, 'content', filename);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
});
