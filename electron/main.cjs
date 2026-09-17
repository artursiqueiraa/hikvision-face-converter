const { app, BrowserWindow, Menu, session, dialog } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 860,
    minHeight: 600,
    title: 'Hikvision Face Converter',
    autoHideMenuBar: true,
    backgroundColor: '#f8fafc',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  Menu.setApplicationMenu(null)
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  return win
}

app.whenReady().then(() => {
  // Always ask where to save converted images, with the filename the app suggests.
  session.defaultSession.on('will-download', (event, item) => {
    const chosenPath = dialog.showSaveDialogSync({
      title: 'Salvar imagem convertida',
      defaultPath: item.getFilename(),
      filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png'] }],
    })
    if (chosenPath) {
      item.setSavePath(chosenPath)
    } else {
      item.cancel()
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
