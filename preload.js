const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs');

// ipcRenderer.on('save-file', (_event, arg) => {
//   console.log('save-file', _event, arg) // prints "pong" in the DevTools console
// })

contextBridge.exposeInMainWorld('electronAPI',{
  saveFile: async (options, data) => {
    const result = await ipcRenderer.invoke('dialog:saveFile', options, data)
    if (result && !result.canceled) {
      await fs.writeFileSync(result.filePath, data, 'utf-8');
    }
    return result
  }
})
