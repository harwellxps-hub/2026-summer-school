const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  listAssets:      (subfolder)           => ipcRenderer.invoke('list-assets', subfolder),
  listSubfolders:  (subfolder)           => ipcRenderer.invoke('list-subfolders', subfolder),
  readJSON:        (filename)            => ipcRenderer.invoke('read-json', filename),
  assetURL:        (subfolder, filename) => `asset://${subfolder}/${filename}`,
  documentTree:    (sessionId)                    => ipcRenderer.invoke('document-tree', sessionId),
  documentContent: (sessionId, challengeId)       => ipcRenderer.invoke('document-content', sessionId, challengeId),
  handbookTree:    (assetSubfolder)               => ipcRenderer.invoke('handbook-tree', assetSubfolder),
  handbookContent: (relPath, assetSubfolder)       => ipcRenderer.invoke('handbook-content', relPath, assetSubfolder),
  listPDFs:        (subfolder)           => ipcRenderer.invoke('list-pdfs', subfolder),
  listTools:       ()                    => ipcRenderer.invoke('list-tools'),
  openPDF:         (subfolder, filename) => ipcRenderer.invoke('open-pdf', subfolder, filename),
});
