let selectedFilesLeft = [];  // Array para armazenar os arquivos selecionados da pasta esquerda
let selectedFilesRight = []; // Array para armazenar os arquivos selecionados da pasta direita
let filesLeft = [];  // Array para armazenar os arquivos da pasta esquerda
let filesRight = []; // Array para armazenar os arquivos da pasta direita
let searchTermLeft = ''; // Termo de pesquisa para a pasta esquerda
let searchTermRight = ''; // Termo de pesquisa para a pasta direita

// Função para carregar os arquivos
async function loadFiles(side = 'left') {
    const listId = side === 'left' ? 'file-list' : 'file-list-right';
    const folderNameId = side === 'left' ? 'folder-name' : 'folder-name-right';
    const apiPath = side === 'left' ? '/api/files' : '/api/files-right';

    // Evento para criar a nova pasta (apenas se os botões existirem)
    const createFolderButtonLeft = document.getElementById('create-folder-button'); // Botão para criar pasta à esquerda
    const createFolderButtonRight = document.getElementById('create-folder-button-right'); // Botão para criar pasta à direita

    // Função que cria a pasta com o lado (left ou right)
    const createFolder = async (side) => {
        const folderNameInput = document.getElementById(side === 'left' ? 'folder-name-input' : 'folder-name-input-right');
        const folderName = folderNameInput.value.trim(); // Remove espaços desnecessários

        if (!folderName) {
            alert('Por favor, insira um nome válido para a pasta.');
            return;
        }

        try {
            // Envia a requisição para o servidor para criar a nova pasta
            const response = await fetch('/api/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderName, side }), // Inclui o "side"
            });

            if (response.ok) {                
                folderNameInput.value = ''; // Limpa o campo de entrada
                await refreshView(side);  // Atualiza a visualização da pasta atual
            } else {
                alert('Erro ao criar a pasta. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao criar a pasta:', error);
            alert('Erro ao criar a pasta. Verifique o console para mais detalhes.');
        }
    };

    // Adiciona o evento para o botão da esquerda
    if (createFolderButtonLeft) {
        createFolderButtonLeft.addEventListener('click', () => {
            createFolder('left'); // Chama a função com 'left' como parâmetro
        });
    }

    // Adiciona o evento para o botão da direita
    if (createFolderButtonRight) {
        createFolderButtonRight.addEventListener('click', () => {
            createFolder('right'); // Chama a função com 'right' como parâmetro
        });
    }

    try {
        const response = await fetch(apiPath);
        const files = await response.json();
        if (side === 'left') {
            filesLeft = files;
        } else {
            filesRight = files;
        }

        const fileList = document.getElementById(listId);
        fileList.innerHTML = '';  // Limpa a lista antes de adicionar os arquivos

        const filteredFiles = filterFiles(side); // Aplica a filtragem dos arquivos

        filteredFiles.forEach(file => {
            const listItem = document.createElement('li');
            
            // Cria o checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `file-${file.name}-${side}`;
            checkbox.className = 'file-checkbox';
            checkbox.onchange = () => toggleSelection(file, side);  // Adiciona o evento de seleção
            
            // Cria o nome do arquivo ou pasta
            const fileName = document.createElement('span');
            fileName.textContent = file.name;
            fileName.className = file.isDirectory ? 'directory' : 'file';
            fileName.onclick = () => file.isDirectory && navigateToFolder(file.name, side); // Navega para a pasta ao clicar

            listItem.appendChild(checkbox);
            listItem.appendChild(fileName);
            fileList.appendChild(listItem);
        });
    } catch (error) {
        console.error(`Erro ao carregar os arquivos para o lado ${side}:`, error);
    }
}

// Função para filtrar arquivos com base no termo de busca
function filterFiles(side = 'left') {
    const query = side === 'left' ? searchTermLeft.toLowerCase() : searchTermRight.toLowerCase();
    const files = side === 'left' ? filesLeft : filesRight;

    // Filtra os arquivos conforme o texto da pesquisa
    return files.filter(file => file.name.toLowerCase().includes(query));
}

// Função para alternar a seleção de um arquivo
function toggleSelection(file, side) {
    if (side === 'left') {
        if (selectedFilesLeft.includes(file)) {
            selectedFilesLeft = selectedFilesLeft.filter(f => f !== file);
        } else {
            selectedFilesLeft.push(file);
        }
    } else {
        if (selectedFilesRight.includes(file)) {
            selectedFilesRight = selectedFilesRight.filter(f => f !== file);
        } else {
            selectedFilesRight.push(file);
        }
    }
    console.log(`Arquivos selecionados na esquerda:`, selectedFilesLeft);
    console.log(`Arquivos selecionados na direita:`, selectedFilesRight);
}

// Função de renomear que agora renomeia arquivos apenas no lado esquerdo ao clicar no botão de renomear do lado direito
async function renameFiles(side) {
    let fileToRename, fileRenamed;

    // Verifica se o lado é o esquerdo ou o direito e seleciona os arquivos correspondentes
    if (side === 'left') {
        // Quando clicado no lado esquerdo, renomeia o arquivo no lado esquerdo
        if (selectedFilesLeft.length === 0) {
            alert('Por favor, selecione um arquivo do lado esquerdo para renomear.');
            return;
        }
        fileToRename = selectedFilesLeft[0];
        fileRenamed = selectedFilesRight[0]; // O nome do arquivo do lado direito será utilizado
    } else if (side === 'right') {
        // Quando clicado no lado direito, renomeia o arquivo no lado esquerdo
        if (selectedFilesRight.length === 0) {
            alert('Por favor, selecione um arquivo do lado direito para renomear.');
            return;
        }
        fileToRename = selectedFilesRight[0]; // O arquivo do lado direito será renomeado
        fileRenamed = selectedFilesLeft[0]; // O nome do arquivo do lado esquerdo será utilizado
    }

    // Se a renomeação depender de uma API, faça uma requisição
    try {
        const response = await fetch('/api/rename-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                side: side, // Passa o lado atual
                oldName: fileToRename.name,
                newName: fileRenamed.name // Nome do arquivo do outro lado será o novo nome
            }),
        });

        if (!response.ok) {
            alert('Erro ao renomear os arquivos.');
            return;
        }

        // Atualiza a lista local de arquivos após renomeação
        if (side === 'left') {
            // Atualiza o nome do arquivo no lado esquerdo
            const index = filesLeft.findIndex(file => file.name === fileToRename.name);
            if (index !== -1) {
                filesLeft[index].name = fileRenamed.name;
            }
        } else if (side === 'right') {
            // Atualiza o nome do arquivo no lado direito
            const index = filesRight.findIndex(file => file.name === fileToRename.name);
            if (index !== -1) {
                filesRight[index].name = fileRenamed.name;
            }
        }

        console.log("Arquivo renomeado com sucesso!");

        // Atualiza a interface
        await refreshView('left');
        await refreshView('right');
        loadFiles(side);

    } catch (error) {
        console.error("Erro ao renomear os arquivos:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const folderPath = document.getElementById('folder-name').textContent || '/'; // Define o caminho da pasta
    const encodedFolderPath = encodeURIComponent(folderPath);  // Codifica o caminho da pasta

    // Função que realiza a busca de arquivos
    const checkRateio = (folderPath) => {
    const encodedFolderPath = encodeURIComponent(folderPath);  // Codifica o caminho da pasta

    fetch(`/api/files?folderPath=${encodedFolderPath}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar arquivos');
            }
            return response.json();  // Espera um array
        })
        .then(data => {
            const rateioIndicator = document.getElementById('rateio-indicator');
            const rateioMessage = document.getElementById('rateio-message');
            
            if (Array.isArray(data) && data.some(file => file.containsRateio)) {
                rateioMessage.textContent = '< "rateio" lado esquerdo.';
                rateioMessage.style.color = 'green';
            } else {
                rateioMessage.textContent = 'Nenhum arquivo contendo "rateio" encontrado.';
                rateioMessage.style.color = 'red';
            }

            rateioIndicator.style.display = 'block';
        })
        .catch(error => {
            console.error('Erro ao verificar "rateio":', error);
        });
};

    const observeFolderPath = () => {
    const folderPathElement = document.getElementById('folder-name');
    
    // Observa o conteúdo do elemento onde o caminho da pasta é armazenado
    const observer = new MutationObserver(() => {
        const folderPath = folderPathElement.textContent || '/'; // Obtém o caminho da pasta
        checkRateio(folderPath);  // Chama a função de verificação
    });

    // Configura o observer para observar mudanças no conteúdo de texto
    observer.observe(folderPathElement, { childList: true, subtree: true });
    };
    observeFolderPath();
});

const navigateFolder = (direction, folderName) => {
    // Aqui você já tem a lógica de navegação para alterar currentFolderPath
    let currentFolderPath = '/home/medina/Documentos';  // Exemplo de pasta base, mude conforme necessário

    try {
        if (direction === 'back') {
            currentFolderPath = path.dirname(currentFolderPath); // Voltar para a pasta anterior
        } else if (direction === 'forward') {
            const newFolderPath = path.join(currentFolderPath, folderName);
            if (fs.existsSync(newFolderPath) && fs.statSync(newFolderPath).isDirectory()) {
                currentFolderPath = newFolderPath; // Navegar para a subpasta
            } else {
                throw new Error('Pasta não encontrada ou inválida.');
            }
        }

        // Após alterar o caminho, chama a função para verificar arquivos
        checkRateio(currentFolderPath);

    } catch (err) {
        console.error('Erro ao navegar para a pasta:', err.message);
    }
};

// Evento do botão de renomear (Lado esquerdo)
document.getElementById('rename-files-left').onclick = () => {
    console.log("Botão de renomear (esquerda) clicado");
    renameFiles('left');
};

// Evento do botão de renomear (Lado direito)
document.getElementById('rename-files-right').onclick = () => {
    console.log("Botão de renomear (direita) clicado");
    renameFiles('right');
};

// Função para copiar os arquivos selecionados
async function copyFiles(fromSide, toSide) {
    const fromFiles = fromSide === 'left' ? selectedFilesLeft : selectedFilesRight;
    const toApiPath = toSide === 'left' ? '/api/copy-to-left' : '/api/copy-to-right';

    if (fromFiles.length === 0) {
        alert('Por favor, selecione ao menos um arquivo para copiar.');
        return;
    }

    try {
        // Passa os nomes dos arquivos ou diretórios selecionados
        const response = await fetch(toApiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: fromFiles.map(f => f.name), isDirectory: fromFiles.map(f => f.isDirectory) }),
        });

        // Verifica se a cópia foi realizada com sucesso
        if (response.ok) {
            alert(`Arquivos copiados para a pasta ${toSide === 'left' ? 'esquerda' : 'direita'}`);
            await refreshView(toSide);  // Atualiza a visualização após copiar os arquivos
        } else {
            alert('Erro ao copiar os arquivos.');
        }
    } catch (error) {
        console.error(`Erro ao copiar os arquivos de ${fromSide} para ${toSide}:`, error);
    }
}

// Função para navegar para a pasta
async function navigateToFolder(folderName, side = 'left') {
    const apiPath = side === 'left' ? '/api/navigate' : '/api/navigate-right';
    try {
        await fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'forward', folderName }),
        });
        await refreshView(side); // Atualiza a visualização após navegar para a pasta
    } catch (error) {
        console.error(`Erro ao navegar para a pasta no lado ${side}:`, error);
    }
}

// Função para voltar uma pasta
async function navigateBack(side = 'left') {
    const apiPath = side === 'left' ? '/api/navigate' : '/api/navigate-right';
    try {
        await fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'back' }),
        });
        await refreshView(side); // Atualiza a visualização após voltar para a pasta anterior
    } catch (error) {
        console.error(`Erro ao voltar no lado ${side}:`, error);
    }
}

// Função para atualizar a visualização da pasta
async function refreshView(side = 'left') {
    const folderNameId = side === 'left' ? 'folder-name' : 'folder-name-right';
    const apiPath = side === 'left' ? '/api/folder' : '/api/folder-right';

    try {
        const response = await fetch(apiPath);
        const { folderName } = await response.json();
        document.getElementById(folderNameId).textContent = folderName || '/';
    } catch (error) {
        console.error(`Erro ao atualizar o nome da pasta para o lado ${side}:`, error);
    }

    await loadFiles(side); // Carrega os arquivos novamente, aplicando a busca se necessário
}

// Eventos de clique nos botões "Voltar"
document.getElementById('back-button').onclick = () => navigateBack('left');
document.getElementById('back-button-right').onclick = () => navigateBack('right');

// Eventos dos botões de pesquisa
document.getElementById('search-button').onclick = () => {
    searchTermLeft = document.getElementById('search-input').value; // Armazena o termo de busca no lado esquerdo
    loadFiles('left'); // Atualiza a lista de arquivos no lado esquerdo
};

document.getElementById('search-button-right').onclick = () => {
    searchTermRight = document.getElementById('search-input-right').value; // Armazena o termo de busca no lado direito
    loadFiles('right'); // Atualiza a lista de arquivos no lado direito
};

// Botões de copiar
document.getElementById('copy-left-to-right').onclick = () => copyFiles('left', 'right');
document.getElementById('copy-right-to-left').onclick = () => copyFiles('right', 'left');

// Carrega as duas listas de arquivos ao iniciar
refreshView('left');
refreshView('right');
