/**
 * @fileoverview Electron app entry point, with an itrans object loaded with default table.
 * @author Avinash Chopde <avinash@aczoom.com>
 *
 * TODO: This is just a start, not yet fully working.
 *
 * http://www.aczoom.com/itrans/
 */

'use strict';

/*jshint esversion: 6 */
/*jshint node: true */

const {app, BrowserWindow} = require('electron');

const Itrans = require('./src/Itrans');
const DEFAULT_TSV = require('./data/DEFAULT_TSV');

// Keep a global reference to window to avoid window closing when Javacript
// object is garbage collected.
let mainWindow = null;

// Load itrans data
const itrans = new Itrans();
itrans.load(DEFAULT_TSV);

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({minWidth: 800, minHeight: 600});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/electron.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
