let currentPath = '';

async function loadFiles(path = '') {
    currentPath = path;
    const response = await fetch(`/files?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';

    document.getElementById('backBtn').style.display = path ? 'inline-block' : 'none';
    document.getElementById('rootBtn').style.display = path ? 'inline-block' : 'none';

    data.files.forEach(file => {
        const li = document.createElement('li');

        if (file.isDirectory) {
            li.innerHTML = `📁 <a href="#" onclick="loadFiles('${encodeURIComponent(file.path)}')">${file.name}</a>`;
            li.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                downloadFolder(file.path);
            });
        } else {
            li.innerHTML = `📄 <a href="/download/${encodeURIComponent(file.path)}">${file.name}</a>`;
        }
        
        fileList.appendChild(li);
    });
}

function goBack() {
    const parts = currentPath.split('/').filter(p => p);
    parts.pop();
    loadFiles(parts.join('/'));
}

function downloadFolder(folderPath) {
    window.location.href = `/download-folder?path=${encodeURIComponent(folderPath)}`;
}

loadFiles();