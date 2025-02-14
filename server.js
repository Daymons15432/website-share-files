const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const os = require('os');

const app = express();
const PORT = YOUR_PORT; // Replace YOUR_PORT with the desired port
const BASE_DIR = path.join(__dirname, 'shared');

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
    return 'localhost';
};

app.use(express.static('public'));

app.get('/files', (req, res) => {
    const currentPath = req.query.path ? decodeURIComponent(req.query.path) : '';
    const fullPath = path.join(BASE_DIR, currentPath);

    if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isDirectory()) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read directory' });
        }

        const fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path.join(currentPath, file.name),
            size: file.isDirectory() ? null : fs.statSync(path.join(fullPath, file.name)).size
        }));

        res.json({ files: fileList, currentPath });
    });
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(BASE_DIR, req.params.filename);
    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.get('/download-folder', (req, res) => {
    const folderPath = path.join(BASE_DIR, req.query.path);
    const folderName = path.basename(folderPath);

    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
        return res.status(404).send('Folder not found');
    }

    res.setHeader('Content-Disposition', `attachment; filename=${folderName}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.directory(folderPath, false);
    archive.pipe(res);
    archive.finalize();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`File server running at: http://${getLocalIP()}:${PORT}/`);
    console.log(`Serving files from: ${BASE_DIR}`);
    console.log('Created by HakiouDerion');
});
