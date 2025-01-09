const fs = require('fs');
const path = require('path');

// Função Lambda para a rota /api/files
exports.handler = async (event, context) => {
  const folderName = event.queryStringParameters.folderName; // Recebe o nome da pasta via query

  try {
    // Define o diretório base (pode ser ajustado conforme necessário)
    const currentFolderPath = '/caminho/para/seu/diretorio'; // Substitua com o diretório base que você usa

    // Resolve o caminho absoluto com base no diretório atual (currentFolderPath)
    const absoluteFolderPath = folderName
      ? path.join(currentFolderPath, folderName) // Se folderName for fornecido, navega até ele
      : currentFolderPath; // Caso contrário, usa o diretório atual

    console.log('Parâmetro recebido:', folderName || 'Nenhum'); // Se não houver folderName, mostra 'Nenhum'
    console.log('Caminho absoluto resolvido:', absoluteFolderPath);

    // Verifica se a pasta existe
    if (!fs.existsSync(absoluteFolderPath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Diretório não encontrado',
          requestedPath: absoluteFolderPath, // Mostra o caminho absoluto
        }),
      };
    }

    // Lista os arquivos e diretórios na pasta
    const files = fs.readdirSync(absoluteFolderPath).map((file) => {
      const filePath = path.join(absoluteFolderPath, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      const containsRateio = file.toLowerCase().includes('rateio');
      return { name: file, isDirectory, containsRateio };
    });

    // Retorna os arquivos encontrados como resposta
    return {
      statusCode: 200,
      body: JSON.stringify(files),
    };
  } catch (err) {
    console.error('Erro ao acessar o diretório:', err.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erro ao acessar a pasta.',
        details: err.message,
      }),
    };
  }
};
