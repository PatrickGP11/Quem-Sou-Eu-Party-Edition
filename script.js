// --- BANCO DE DADOS ---
const wordsDB = [
    { cat: "Animal", word: "Girafa" }, { cat: "Animal", word: "Pinguim" }, { cat: "Animal", word: "Ornitorrinco" },
    { cat: "Objeto", word: "Geladeira" }, { cat: "Objeto", word: "Guarda-chuva" }, { cat: "Objeto", word: "Microfone" },
    { cat: "Profissão", word: "Bombeiro" }, { cat: "Profissão", word: "Astronauta" }, { cat: "Profissão", word: "Palhaço" },
    { cat: "Lugar", word: "Cinema" }, { cat: "Lugar", word: "Praia" }, { cat: "Lugar", word: "Hospital" },
    { cat: "Personagem", word: "Homem Aranha" }, { cat: "Personagem", word: "Mickey Mouse" }, { cat: "Personagem", word: "Batman" },
    { cat: "Comida", word: "Lasanha" }, { cat: "Comida", word: "Sushi" }, { cat: "Comida", word: "Pipoca" }
];

// --- GESTÃO DE REDE (P2P) ---
const party = {
    peer: null,
    myId: null,
    myName: '',
    isHost: false,
    connections: [],
    hostConn: null,

    init: function () {
        // Gera um nome aleatório se o usuário não digitar
        const inputName = document.getElementById('my-nickname').value.trim();
        this.myName = inputName || 'Jogador ' + Math.floor(Math.random() * 1000);
    },

    // --- HOST (QUEM CRIA A SALA) ---
    createRoom: function () {
        this.init();
        this.isHost = true;
        this.peer = new Peer(); // Cria ID na nuvem

        // Quando o PeerJS gera o ID da sala
        this.peer.on('open', (id) => {
            this.myId = id;
            this.updateLobbyUI(id);

            // Adiciona o Host na lista localmente
            game.players = [{ id: id, name: this.myName, score: 0 }];
            this.renderPlayerList();

            game.showScreen('screen-lobby');
            document.getElementById('host-controls').classList.remove('hidden');
            document.querySelector('.code-display').classList.remove('hidden'); // Host vê o código
        });

        // Quando alguém tenta entrar
        this.peer.on('connection', (conn) => {
            conn.on('open', () => {
                // [FIX] Espera 500ms para garantir que a conexão está estável antes de pedir dados
                setTimeout(() => {
                    conn.send({ type: 'REQUEST_INFO' });
                }, 500);
            });

            conn.on('data', (data) => this.handleData(data, conn));

            conn.on('close', () => {
                this.removePlayer(conn.peer);
            });

            // Salva a conexão para mandar mensagens depois
            this.connections.push(conn);
        });

        this.peer.on('error', (err) => alert("Erro na conexão: " + err.type));
    },

    // --- GUEST (QUEM ENTRA NA SALA) ---
    joinRoom: function () {
        this.init();
        const roomId = document.getElementById('room-code-input').value.trim();
        if (!roomId) return alert("Digite o código da sala!");

        this.isHost = false;
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.myId = id;
            this.hostConn = this.peer.connect(roomId);

            this.hostConn.on('open', () => {
                // Conectou! Mostra lobby e espera o Host pedir o nome
                game.showScreen('screen-lobby');
                document.getElementById('guest-waiting-msg').classList.remove('hidden');
                document.querySelector('.code-display').classList.add('hidden'); // [FIX] Esconde código "..." do convidado

                // Limpa lista inicial para não mostrar "1/10" errado
                document.getElementById('lobby-player-list').innerHTML = '<li>Conectando...</li>';
            });

            this.hostConn.on('data', (data) => this.handleClientData(data));

            this.hostConn.on('close', () => {
                alert("O anfitrião encerrou a sala.");
                location.reload();
            });

            this.hostConn.on('error', (err) => console.error("Erro no Guest:", err));
        });
    },

    // --- PROCESSAMENTO DE DADOS (HOST) ---
    handleData: function (data, conn) {
        switch (data.type) {
            case 'JOIN_INFO':
                // Verifica se já não existe
                if (!game.players.find(p => p.id === conn.peer)) {
                    game.players.push({ id: conn.peer, name: data.name, score: 0 });
                    this.renderPlayerList();
                    // Manda a lista atualizada para TODOS
                    this.broadcast({ type: 'UPDATE_PLAYERS', list: game.players });
                }
                break;
            case 'SEND_GUESS':
                game.processGuess(conn.peer, data.text);
                break;
            case 'SEND_HINT':
                this.broadcast({ type: 'NEW_HINT', text: data.text });
                game.addMsg(data.text, 'hint'); // Mostra pro Host também
                break;
        }
    },

    // --- PROCESSAMENTO DE DADOS (GUEST) ---
    handleClientData: function (data) {
        switch (data.type) {
            case 'REQUEST_INFO':
                // O Host pediu meus dados, vou enviar
                this.hostConn.send({ type: 'JOIN_INFO', name: this.myName });
                break;
            case 'UPDATE_PLAYERS':
                game.updateLobbyList(data.list);
                break;
            case 'GAME_START':
                game.startClientGame(data);
                break;
            case 'NEW_HINT':
                game.addMsg(data.text, 'hint');
                break;
            case 'NEW_GUESS_NOTIFY':
                game.addMsg(data.text, 'guess');
                break;
            case 'ROUND_END':
                game.showResults(data.winnerName, data.correctWord, data.scores);
                break;
        }
    },

    broadcast: function (msg) {
        // Envia para todos os conectados
        this.connections.forEach(c => {
            if (c.open) c.send(msg);
        });
    },

    // --- UI DO LOBBY ---
    updateLobbyUI: function (id) {
        document.getElementById('display-room-id').innerText = id;
    },

    renderPlayerList: function () {
        const list = document.getElementById('lobby-player-list');
        list.innerHTML = '';

        const colors = ['#ff7675', '#74b9ff', '#55efc4', '#a29bfe', '#fab1a0', '#ffeaa7'];

        game.players.forEach((p, index) => {
            const isMe = p.id === this.myId;
            const color = colors[index % colors.length];

            list.innerHTML += `
            <li class="${isMe ? 'me' : ''}">
                <i class="ph ph-user${isMe ? '-circle' : ''}" style="color: ${color}; background: ${color}20;"></i> 
                <span>${p.name} ${isMe ? '<small>(Você)</small>' : ''}</span>
            </li>`;
        });

        // --- CORREÇÃO AQUI ---
        // Antes estava somando texto, agora substitui apenas o número se o HTML permitir, 
        // ou atualiza o texto do span corretamente.
        const countSpan = document.getElementById('player-count');
        if (countSpan) {
            // Se no HTML estiver: <h3>Jogadores (<span id="player-count">1/10</span>)</h3>
            countSpan.innerText = `${game.players.length}/10`;
        }
    },

    removePlayer: function (peerId) {
        game.players = game.players.filter(p => p.id !== peerId);
        this.connections = this.connections.filter(c => c.peer !== peerId);
        this.renderPlayerList();
        this.broadcast({ type: 'UPDATE_PLAYERS', list: game.players });
    },

    shareLink: function () {
        const url = `https://wa.me/?text=Bora jogar Quem Sou Eu! Código da sala: *${this.myId}*`;
        window.open(url, '_blank');
    },

    copyCode: function () {
        navigator.clipboard.writeText(this.myId);
        alert("Código copiado!");
    },

    quit: function () {
        if (confirm("Sair do lobby?")) location.reload();
    }
};

// --- LÓGICA DO JOGO ---
const game = {
    players: [],
    currentMasterId: null,
    currentWord: null,
    round: 1,

    startGame: function () {
        if (this.players.length < 2) return alert("Precisa de pelo menos 2 jogadores!");

        const masterIndex = Math.floor(Math.random() * this.players.length);
        const master = this.players[masterIndex];
        this.currentMasterId = master.id;

        const wordObj = wordsDB[Math.floor(Math.random() * wordsDB.length)];
        this.currentWord = wordObj;

        // Avisa a todos
        party.connections.forEach(conn => {
            conn.send({
                type: 'GAME_START',
                masterName: master.name,
                isMaster: conn.peer === this.currentMasterId,
                word: conn.peer === this.currentMasterId ? wordObj : null
            });
        });

        // Configura a tela do Host
        this.startClientGame({
            masterName: master.name,
            isMaster: party.myId === this.currentMasterId,
            word: party.myId === this.currentMasterId ? wordObj : null
        });
    },

    startClientGame: function (data) {
        this.showScreen('screen-game');
        document.getElementById('game-chat').innerHTML = '<div class="system-msg">Rodada iniciada!</div>';

        document.getElementById('guess-input').value = '';
        document.getElementById('hint-input').value = '';

        if (data.isMaster) {
            document.getElementById('role-display').innerText = "VOCÊ É O MESTRE";
            document.getElementById('role-display').style.background = "var(--accent)";
            document.getElementById('describer-controls').classList.remove('hidden');
            document.getElementById('guesser-controls').classList.add('hidden');
            document.getElementById('secret-word').innerText = data.word.word;
            document.getElementById('secret-category').innerText = data.word.cat;
        } else {
            document.getElementById('role-display').innerText = "ADIVINHADOR";
            document.getElementById('role-display').style.background = "#636e72";
            document.getElementById('describer-controls').classList.add('hidden');
            document.getElementById('guesser-controls').classList.remove('hidden');
            document.getElementById('current-master-name').innerText = data.masterName;
        }
    },

    sendHint: function () {
        const input = document.getElementById('hint-input');
        const text = input.value.trim();
        if (!text) return;

        if (party.isHost) {
            party.broadcast({ type: 'NEW_HINT', text: text });
            this.addMsg(text, 'hint');
        } else {
            party.hostConn.send({ type: 'SEND_HINT', text: text });
        }
        input.value = '';
    },

    sendQuickHint: function (prefix) {
        const input = document.getElementById('hint-input');
        input.value = prefix + " ";
        input.focus();
    },

    sendGuess: function () {
        const input = document.getElementById('guess-input');
        const text = input.value.trim();
        if (!text) return;

        // Se o Host estiver jogando como adivinhador (caso raro se tiver 3+ pessoas)
        if (party.isHost && party.myId !== this.currentMasterId) {
            this.processGuess(party.myId, text);
        } else if (!party.isHost) {
            party.hostConn.send({ type: 'SEND_GUESS', text: text });
        }
        input.value = '';
    },

    processGuess: function (playerId, text) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        party.broadcast({ type: 'NEW_GUESS_NOTIFY', text: `${player.name}: ${text}` });
        if (party.isHost) this.addMsg(`${player.name}: ${text}`, 'guess');

        if (text.toLowerCase().trim() === this.currentWord.word.toLowerCase()) {
            player.score += 10;
            const master = this.players.find(p => p.id === this.currentMasterId);
            if (master) master.score += 5;

            party.broadcast({ type: 'ROUND_END', winnerName: player.name, correctWord: this.currentWord.word, scores: this.players });
            this.showResults(player.name, this.currentWord.word, this.players);
        }
    },

    addMsg: function (text, type) {
        const chat = document.getElementById('game-chat');
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        div.innerText = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    },

    showResults: function (winner, word, scores) {
        this.showScreen('screen-result');
        document.getElementById('round-winner-display').innerHTML = `🎉 <b>${winner}</b> acertou!<br>A palavra era: ${word}`;

        const list = document.getElementById('score-list');
        list.innerHTML = '';
        scores.sort((a, b) => b.score - a.score).forEach(p => {
            list.innerHTML += `<li>${p.name}: <b>${p.score}</b></li>`;
        });

        if (party.isHost) {
            document.getElementById('btn-next-round').classList.remove('hidden');
            document.getElementById('waiting-host-msg').classList.add('hidden');
        } else {
            document.getElementById('btn-next-round').classList.add('hidden');
            document.getElementById('waiting-host-msg').classList.remove('hidden');
        }
    },

    nextRound: function () {
        this.round++;
        this.startGame();
    },

    updateLobbyList: function (list) {
        game.players = list; // Atualiza lista local do guest
        party.renderPlayerList();
    },

    showScreen: function (id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }
};

// --- MANTER A TELA LIGADA (WAKE LOCK) ---
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Tela mantida ativa com sucesso!');

            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock soltou (tela pode apagar)');
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

// Tentar ativar quando o jogo começar ou quando a aba ficar visível
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

// Chame isso quando o jogo iniciar (no createRoom ou joinRoom)
// Exemplo: Adicione party.requestWakeLock() dentro do init do jogo