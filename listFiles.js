const fs = require('fs');
const path = require('path');

// Função para listar arquivos em uma pasta
function listFilesInFolder(folderPath) {
    try {
        // Lê o conteúdo da pasta
        const files = fs.readdirSync(folderPath);
        console.log(`Arquivos na pasta "${folderPath}":`);
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                console.log(`- [Arquivo] ${file}`);
            } else if (stats.isDirectory()) {
                console.log(`- [Pasta] ${file}`);
            }
        });
    } catch (err) {
        console.error(`Erro ao acessar a pasta: ${err.message}`);
    }
}

// Caminho da pasta a ser listada
const folderPath = '/home/medina/Documentos/'; // Modifique para o caminho desejado

// Chama a função
listFilesInFolder(folderPath);
