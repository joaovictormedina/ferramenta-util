const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
// Caminho base onde as pastas serão criadas
const basePath = path.join(__dirname, 'files');

// Caminho inicial das pastas
let currentFolderPath = '/home/medina/Documentos/';
let currentFolderPathRight = '/home/medina/Documentos/'; // Caminho inicial para o lado direito

// Middleware para parsear o corpo das requisições como JSON
app.use(express.json());

// Rota para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Rota para listar os arquivos da pasta atual (lado esquerdo)
app.get('/api/files', (req, res) => {
    const { folderName } = req.query; // Recebe o nome da pasta via query

    try {
        // Resolve o caminho absoluto com base no diretório atual (currentFolderPath)
        const absoluteFolderPath = folderName
            ? path.join(currentFolderPath, folderName) // Se folderName for fornecido, navega até ele
            : currentFolderPath; // Caso contrário, usa o diretório atual

        console.log('Parâmetro recebido:', folderName || 'Nenhum'); // Se não houver folderName, mostra 'Nenhum'
        console.log('Caminho absoluto resolvido:', absoluteFolderPath);

        // Verifica se a pasta existe
        if (!fs.existsSync(absoluteFolderPath)) {
            return res.status(404).json({
                error: 'Diretório não encontrado',
                requestedPath: absoluteFolderPath, // Mostra o caminho absoluto
            });
        }

        // Lista os arquivos e diretórios na pasta
        const files = fs.readdirSync(absoluteFolderPath).map((file) => {
            const filePath = path.join(absoluteFolderPath, file);
            const isDirectory = fs.statSync(filePath).isDirectory();
            const containsRateio = file.toLowerCase().includes('rateio');
            return { name: file, isDirectory, containsRateio };
        });

        res.json(files);
    } catch (err) {
        console.error('Erro ao acessar o diretório:', err.message);
        res.status(500).json({
            error: 'Erro ao acessar a pasta.',
            details: err.message,
        });
    }
});

// Rota para criar a pasta
app.post('/api/create-folder', (req, res) => {
    const { folderName, side } = req.body; // Inclui 'side' para determinar se é esquerda ou direita

    if (!folderName) {
        return res.status(400).json({ error: 'Nome da pasta é obrigatório.' });
    }

    let folderPath;

    // Definindo o caminho baseado no lado (esquerdo ou direito)
    if (side === 'left') {
        folderPath = path.join(currentFolderPath, folderName); // Usando o caminho do lado esquerdo
    } else if (side === 'right') {
        folderPath = path.join(currentFolderPathRight, folderName); // Usando o caminho do lado direito
    } else {
        return res.status(400).json({ error: 'Lado não especificado corretamente.' });
    }

    // Cria a nova pasta no diretório atual do lado
    fs.mkdir(folderPath, { recursive: true }, (err) => {
        if (err) {
            console.error('Erro ao criar a pasta:', err);
            return res.status(500).json({ error: 'Erro ao criar a pasta.' });
        }
        res.status(201).json({ message: `Pasta "${folderName}" criada com sucesso no lado ${side}.` });
    });
});

// Rota para obter o nome da pasta atual (lado esquerdo)
app.get('/api/folder', (req, res) => {
    res.json({ folderName: path.basename(currentFolderPath) || currentFolderPath });
});

// Rota para alterar a pasta atual (lado esquerdo)
app.post('/api/navigate', (req, res) => {
    const { direction, folderName } = req.body;

    try {
        if (direction === 'back') {
            currentFolderPath = path.dirname(currentFolderPath); // Voltar para a pasta anterior
        } else if (direction === 'forward') {
            const newFolderPath = path.join(currentFolderPath, folderName);
            if (fs.existsSync(newFolderPath) && fs.statSync(newFolderPath).isDirectory()) {
                currentFolderPath = newFolderPath; // Navegar para a subpasta
            } else {
                return res.status(400).json({ error: 'Pasta não encontrada ou inválida.' });
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao navegar para a pasta.' });
    }
});

app.post('/api/rename-files', (req, res) => {
    const { side, oldName, newName } = req.body;

    try {
        if (side === 'left') {
            // Lógica para renomear o arquivo na pasta esquerda
            const oldFilePathLeft = path.join(currentFolderPath, oldName);
            const newFilePathLeft = path.join(currentFolderPath, newName);

            if (fs.existsSync(oldFilePathLeft)) {
                fs.renameSync(oldFilePathLeft, newFilePathLeft);
                return res.status(200).json({ message: 'Arquivo renomeado no lado esquerdo com sucesso.' });
            } else {
                return res.status(400).json({ error: 'Arquivo da pasta esquerda não encontrado.' });
            }
        } else if (side === 'right') {
            // Lógica para renomear o arquivo na pasta direita
            const oldFilePathRight = path.join(currentFolderPathRight, oldName);
            const newFilePathRight = path.join(currentFolderPathRight, newName);

            if (fs.existsSync(oldFilePathRight)) {
                fs.renameSync(oldFilePathRight, newFilePathRight);
                return res.status(200).json({ message: 'Arquivo renomeado no lado direito com sucesso.' });
            } else {
                return res.status(400).json({ error: 'Arquivo da pasta direita não encontrado.' });
            }
        } else {
            return res.status(400).json({ error: 'Lado não especificado corretamente.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erro ao renomear o arquivo.' });
    }
});

// Rota para listar os arquivos do lado direito
app.get('/api/files-right', (req, res) => {
    try {
        const files = fs.readdirSync(currentFolderPathRight).map(file => {
            const filePath = path.join(currentFolderPathRight, file);
            const isDirectory = fs.statSync(filePath).isDirectory();
            const containsRateio = file.toLowerCase().includes('rateio'); // Verifica se o nome contém "rateio"
            return { name: file, isDirectory, containsRateio };
        });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao acessar a pasta do lado direito.' });
    }
});

// Rota para obter o nome da pasta atual (lado direito)
app.get('/api/folder-right', (req, res) => {
    res.json({ folderName: path.basename(currentFolderPathRight) || currentFolderPathRight });
});

// Rota para alterar a pasta atual (lado direito)
app.post('/api/navigate-right', (req, res) => {
    const { direction, folderName } = req.body;

    try {
        if (direction === 'back') {
            currentFolderPathRight = path.dirname(currentFolderPathRight); // Voltar para a pasta anterior
        } else if (direction === 'forward') {
            const newFolderPath = path.join(currentFolderPathRight, folderName);
            if (fs.existsSync(newFolderPath) && fs.statSync(newFolderPath).isDirectory()) {
                currentFolderPathRight = newFolderPath; // Navegar para a subpasta
            } else {
                return res.status(400).json({ error: 'Pasta não encontrada ou inválida.' });
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao navegar para a pasta do lado direito.' });
    }
});

// Função para copiar arquivos de uma pasta para outra
function copyFile(fileName, fromFolder, toFolder) {
    const fromPath = path.join(fromFolder, fileName);
    const toPath = path.join(toFolder, fileName);

    if (fs.existsSync(fromPath)) {
        fs.copyFileSync(fromPath, toPath); // Copiar o arquivo
    }
}

// Rota para copiar arquivos da pasta esquerda para a direita
app.post('/api/copy-to-right', (req, res) => {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Lista de arquivos não fornecida ou inválida.' });
    }

    files.forEach(file => {
        copyFile(file, currentFolderPath, currentFolderPathRight);
    });

    res.json({ message: 'Arquivos copiados para a pasta da direita.' });
});

// Rota para copiar arquivos da pasta direita para a esquerda
app.post('/api/copy-to-left', (req, res) => {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Lista de arquivos não fornecida ou inválida.' });
    }

    files.forEach(file => {
        copyFile(file, currentFolderPathRight, currentFolderPath);
    });

    res.json({ message: 'Arquivos copiados para a pasta da esquerda.' });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
