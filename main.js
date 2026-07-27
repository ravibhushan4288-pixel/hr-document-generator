const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const nodemailer = require('nodemailer');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "Lumina Document Generator"
  });

  // Remove the default top menu bar for a cleaner look
  mainWindow.setMenuBarVisibility(false);

  // In production, we load the built static files
  // In development, we can load the local vite dev server
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist-vite', 'index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'dist-vite', 'index.html'));
    });
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Focus on the main window if user tries to open a second instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler to send SMTP Emails with attachments
ipcMain.handle('send-email', async (event, { smtpConfig, mailOptions }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.secure, // true for 465, false for 587/others
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      },
      tls: {
        rejectUnauthorized: false // Helps bypass self-signed cert issues
      }
    });

    const attachmentsFormatted = (mailOptions.attachments || []).map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64')
    }));

    const info = await transporter.sendMail({
      from: `"${smtpConfig.senderName || 'Lumina Studio'}" <${smtpConfig.username}>`,
      to: mailOptions.to,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
      attachments: attachmentsFormatted
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP Error:', error);
    return { success: false, error: error.message };
  }
});

