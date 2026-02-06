// --- BANCO DE DADOS GIGANTE (Anti-Repetição) ---
const fullWordsDB = [
    // ANIMAIS
    { cat: "Animal", word: "Elefante" }, { cat: "Animal", word: "Ornitorrinco" }, { cat: "Animal", word: "Preguiça" },
    { cat: "Animal", word: "Camaleão" }, { cat: "Animal", word: "Canguru" }, { cat: "Animal", word: "Pinguim" },
    { cat: "Animal", word: "Tubarão" }, { cat: "Animal", word: "Coruja" }, { cat: "Animal", word: "Hipopótamo" },
    { cat: "Animal", word: "Suricato" }, { cat: "Animal", word: "Capivara" }, { cat: "Animal", word: "Pavão" },

    // OBJETOS
    { cat: "Objeto", word: "Geladeira" }, { cat: "Objeto", word: "Microfone" }, { cat: "Objeto", word: "Guarda-chuva" },
    { cat: "Objeto", word: "Liquidificador" }, { cat: "Objeto", word: "Seringa" }, { cat: "Objeto", word: "Algema" },
    { cat: "Objeto", word: "Bumerangue" }, { cat: "Objeto", word: "Fralda" }, { cat: "Objeto", word: "Dado" },
    { cat: "Objeto", word: "Extintor" }, { cat: "Objeto", word: "Telescópio" }, { cat: "Objeto", word: "Vassoura" },

    // PROFISSÕES
    { cat: "Profissão", word: "Bombeiro" }, { cat: "Profissão", word: "Astronauta" }, { cat: "Profissão", word: "Palhaço" },
    { cat: "Profissão", word: "Dentista" }, { cat: "Profissão", word: "Mágico" }, { cat: "Profissão", word: "Juiz" },
    { cat: "Profissão", word: "Padeiro" }, { cat: "Profissão", word: "Detetive" }, { cat: "Profissão", word: "Gari" },

    // LUGARES
    { cat: "Lugar", word: "Cinema" }, { cat: "Lugar", word: "Cemitério" }, { cat: "Lugar", word: "Hospital" },
    { cat: "Lugar", word: "Deserto" }, { cat: "Lugar", word: "Padaria" }, { cat: "Lugar", word: "Circo" },
    { cat: "Lugar", word: "Academia" }, { cat: "Lugar", word: "Biblioteca" }, { cat: "Lugar", word: "Praia" },

    // PERSONAGENS
    { cat: "Personagem", word: "Homem Aranha" }, { cat: "Personagem", word: "Batman" }, { cat: "Personagem", word: "Mickey Mouse" },
    { cat: "Personagem", word: "Harry Potter" }, { cat: "Personagem", word: "Bob Esponja" }, { cat: "Personagem", word: "Shrek" },
    { cat: "Personagem", word: "Darth Vader" }, { cat: "Personagem", word: "Chaves" }, { cat: "Personagem", word: "Goku" },

    // COMIDA
    { cat: "Comida", word: "Lasanha" }, { cat: "Comida", word: "Sushi" }, { cat: "Comida", word: "Pipoca" },
    { cat: "Comida", word: "Coxinha" }, { cat: "Comida", word: "Churrasco" }, { cat: "Comida", word: "Acarajé" },
    { cat: "Comida", word: "Brócolis" }, { cat: "Comida", word: "Picolé" }, { cat: "Comida", word: "Ovo Frito" },

    // ALEATÓRIOS
    { cat: "Corpo Humano", word: "Umbigo" }, { cat: "Corpo Humano", word: "Cotovelo" }, { cat: "Instrumento", word: "Berimbau" },
    { cat: "Filme", word: "Titanic" }, { cat: "Filme", word: "Vingadores" }, { cat: "Esporte", word: "Futebol" }
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
        const inputName = document.getElementById('my-nickname').value.trim();
        this.myName = inputName || 'Jogador ' + Math.floor(Math.random() * 1000);
    },

    createRoom: function () {
        this.init();
        this.isHost = true;
        this.peer = new Peer();

        this.peer.on('open', (id) => {
            this.myId = id;
            this.updateLobbyUI(id);
            game.players = [{ id: id, name: this.myName, score: 0 }];
            game.availableWords = [...fullWordsDB]; // Cópia para controle de repetição
            this.renderPlayerList();
            game.showScreen('screen-lobby');
            document.getElementById('host-controls').classList.remove('hidden');
            document.querySelector('.code-display').classList.remove('hidden');

            // Ativa Wake Lock (Tela ligada)
            requestWakeLock();
        });

        this.peer.on('connection', (conn) => {
            conn.on('open', () => { setTimeout(() => conn.send({ type: 'REQUEST_INFO' }), 500); });
            conn.on('data', (data) => this.handleData(data, conn));
            conn.on('close', () => this.removePlayer(conn.peer));
            this.connections.push(conn);
        });
    },

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
                game.showScreen('screen-lobby');
                document.getElementById('guest-waiting-msg').classList.remove('hidden');
                document.querySelector('.code-display').classList.add('hidden');
                requestWakeLock();
            });
            this.hostConn.on('data', (data) => this.handleClientData(data));
            this.hostConn.on('close', () => { alert("Sala encerrada."); location.reload(); });
        });
    },

    // --- HOST HANDLER ---
    handleData: function (data, conn) {
        switch (data.type) {
            case 'JOIN_INFO':
                if (!game.players.find(p => p.id === conn.peer)) {
                    game.players.push({ id: conn.peer, name: data.name, score: 0 });
                    this.renderPlayerList();
                    this.broadcast({ type: 'UPDATE_PLAYERS', list: game.players });
                }
                break;
            case 'SEND_GUESS':
                game.processGuess(conn.peer, data.text);
                break;
            case 'SEND_HINT': // Mestre (se não for host) enviando dica
                game.reducePot(); // Dica custa pontos!
                this.broadcast({ type: 'NEW_HINT', text: data.text, currentPot: game.roundPot });
                game.addMsg(data.text, 'hint');
                break;
        }
    },

    // --- CLIENT HANDLER ---
    handleClientData: function (data) {
        switch (data.type) {
            case 'REQUEST_INFO': this.hostConn.send({ type: 'JOIN_INFO', name: this.myName }); break;
            case 'UPDATE_PLAYERS': game.updateLobbyList(data.list); break;
            case 'GAME_START': game.startClientGame(data); break;
            case 'NEW_HINT':
                game.addMsg(data.text, 'hint');
                game.updatePotUI(data.currentPot);
                break;
            case 'NEW_GUESS_NOTIFY': game.addMsg(data.text, 'guess'); break;
            case 'ROUND_END': game.showResults(data); break;
            case 'TIME_UPDATE': game.updateTimerUI(data.time); break;
        }
    },

    broadcast: function (msg) {
        this.connections.forEach(c => { if (c.open) c.send(msg); });
    },

    updateLobbyUI: function (id) { document.getElementById('display-room-id').innerText = id; },

    renderPlayerList: function () {
        const list = document.getElementById('lobby-player-list');
        list.innerHTML = '';
        const colors = ['#ff7675', '#74b9ff', '#55efc4', '#a29bfe', '#fab1a0', '#ffeaa7'];
        game.players.forEach((p, index) => {
            const isMe = p.id === this.myId;
            const color = colors[index % colors.length];
            list.innerHTML += `<li class="${isMe ? 'me' : ''}"><i class="ph ph-user${isMe ? '-circle' : ''}" style="color: ${color}; background: ${color}20;"></i><span>${p.name}</span></li>`;
        });
        const countSpan = document.getElementById('player-count');
        if (countSpan) countSpan.innerText = `${game.players.length}/10`;
    },

    removePlayer: function (id) {
        game.players = game.players.filter(p => p.id !== id);
        this.connections = this.connections.filter(c => c.peer !== id);
        this.renderPlayerList();
        this.broadcast({ type: 'UPDATE_PLAYERS', list: game.players });
    },

    shareLink: function () { window.open(`https://wa.me/?text=Código da sala: *${this.myId}*`, '_blank'); },
    copyCode: function () { navigator.clipboard.writeText(this.myId); alert("Copiado!"); },
    quit: function () { if (confirm("Sair?")) location.reload(); }
};

// --- LÓGICA DO JOGO ---
const game = {
    players: [],
    availableWords: [],
    currentMasterId: null,
    currentWord: null,
    round: 1,
    roundPot: 50, // Pontuação máxima da rodada
    timerInterval: null,
    timeLeft: 150, // 2:30 minutos em segundos

    startGame: function () {
        if (this.players.length < 2) return alert("Mínimo 2 jogadores!");

        // Anti-Repetição: Recarrega se acabar
        if (this.availableWords.length === 0) this.availableWords = [...fullWordsDB];

        // Sorteia Mestre
        const masterIndex = Math.floor(Math.random() * this.players.length);
        const master = this.players[masterIndex];
        this.currentMasterId = master.id;

        // Sorteia e Remove Palavra (para não repetir)
        const wordIndex = Math.floor(Math.random() * this.availableWords.length);
        const wordObj = this.availableWords[wordIndex];
        this.availableWords.splice(wordIndex, 1); // Remove da lista
        this.currentWord = wordObj;

        // Reset Pontuação da Rodada e Tempo
        this.roundPot = 50;
        this.timeLeft = 150; // 2:30

        // Inicia Timer no Host
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            party.broadcast({ type: 'TIME_UPDATE', time: this.timeLeft });
            this.updateTimerUI(this.timeLeft); // Atualiza local (Host)

            if (this.timeLeft <= 0) {
                this.endRoundTimeOut();
            }
        }, 1000);

        // Envia dados iniciais
        party.connections.forEach(conn => {
            conn.send({
                type: 'GAME_START',
                masterName: master.name,
                isMaster: conn.peer === this.currentMasterId,
                word: conn.peer === this.currentMasterId ? wordObj : null,
                roundNumber: this.round,
                currentPot: this.roundPot
            });
        });

        // Configura Host
        this.startClientGame({
            masterName: master.name,
            isMaster: party.myId === this.currentMasterId,
            word: party.myId === this.currentMasterId ? wordObj : null,
            roundNumber: this.round,
            currentPot: this.roundPot
        });
    },

    startClientGame: function (data) {
        this.showScreen('screen-game');
        document.getElementById('game-chat').innerHTML = '<div class="system-msg">Rodada iniciada!</div>';

        // --- ATUALIZA NÚMERO DA RODADA ---
        document.getElementById('round-display').innerText = data.roundNumber;
        this.updatePotUI(data.currentPot);

        document.getElementById('guess-input').value = '';
        document.getElementById('hint-input').value = '';

        const roleDisplay = document.getElementById('role-display');

        if (data.isMaster) {
            roleDisplay.innerText = "VOCÊ É O MESTRE";
            roleDisplay.className = "timer-pill role-master"; // Classe CSS rosa
            document.getElementById('describer-controls').classList.remove('hidden');
            document.getElementById('guesser-controls').classList.add('hidden');
            document.getElementById('secret-word').innerText = data.word.word;
            document.getElementById('secret-category').innerText = data.word.cat;
        } else {
            roleDisplay.innerText = "ADIVINHADOR";
            roleDisplay.className = "timer-pill role-guesser"; // Classe CSS cinza/branca
            document.getElementById('describer-controls').classList.add('hidden');
            document.getElementById('guesser-controls').classList.remove('hidden');
            document.getElementById('current-master-name').innerText = data.masterName;
        }
    },

    reducePot: function () {
        if (this.roundPot > 10) this.roundPot -= 5; // Mínimo de 10 pontos
        this.updatePotUI(this.roundPot);
    },

    updatePotUI: function (val) {
        // Exibe quanto a rodada vale em algum lugar (pode ser no chat ou topo)
        // Vamos usar o chat como log
        // Opcional: Criar elemento visual. Por enquanto, log no chat é bom.
    },

    updateTimerUI: function (seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        const timeString = `${min}:${sec < 10 ? '0' : ''}${sec}`;

        // Vamos usar o espaço do "Placar" ou criar um badge de tempo
        // Se você tiver um elemento com id 'time-display', use ele. 
        // Vou injetar no header se não existir.
        let timerBadge = document.getElementById('timer-badge');
        if (!timerBadge) {
            const header = document.querySelector('.game-header');
            timerBadge = document.createElement('div');
            timerBadge.id = 'timer-badge';
            timerBadge.className = 'timer-pill';
            header.appendChild(timerBadge);
        }

        timerBadge.innerText = `⏱ ${timeString} | Valendo: ${this.roundPot} pts`;

        if (seconds <= 10) timerBadge.classList.add('timer-urgent');
        else timerBadge.classList.remove('timer-urgent');
    },

    sendHint: function () {
        const input = document.getElementById('hint-input');
        const text = input.value.trim();
        if (!text) return;

        if (party.isHost) {
            this.reducePot();
            party.broadcast({ type: 'NEW_HINT', text: text, currentPot: this.roundPot });
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
            // ACERTOU!
            clearInterval(this.timerInterval);

            // Pontuação
            player.score += this.roundPot; // Ganhador leva o pote

            const master = this.players.find(p => p.id === this.currentMasterId);
            if (master) master.score += this.roundPot; // Mestre TAMBÉM leva o pote (incentivo)

            const resultData = {
                winnerName: player.name,
                correctWord: this.currentWord.word,
                scores: this.players,
                reason: 'WIN'
            };

            party.broadcast({ type: 'ROUND_END', ...resultData });
            this.showResults(resultData);
        }
    },

    endRoundTimeOut: function () {
        clearInterval(this.timerInterval);
        const resultData = {
            winnerName: null,
            correctWord: this.currentWord.word,
            scores: this.players,
            reason: 'TIMEOUT'
        };
        party.broadcast({ type: 'ROUND_END', ...resultData });
        this.showResults(resultData);
    },

    addMsg: function (text, type) {
        const chat = document.getElementById('game-chat');
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        div.innerText = text;
        chat.appendChild(div);
        chat.scrollTop = chat.scrollHeight;
    },

    showResults: function (data) {
        this.showScreen('screen-result');
        const title = document.getElementById('round-winner-display');

        if (data.reason === 'TIMEOUT') {
            title.innerHTML = `⌛ <b>Tempo Esgotado!</b><br>Ninguém acertou.<br>A palavra era: ${data.correctWord}`;
            title.style.color = '#d63031';
        } else {
            title.innerHTML = `🎉 <b>${data.winnerName}</b> acertou!<br>A palavra era: ${data.correctWord}<br><small>Ganharam ${this.roundPot} pts!</small>`;
            title.style.color = 'var(--primary)';
        }

        const list = document.getElementById('score-list');
        list.innerHTML = '';
        data.scores.sort((a, b) => b.score - a.score).forEach(p => {
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

    updateLobbyList: function (list) { game.players = list; party.renderPlayerList(); },
    showScreen: function (id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }
};

// --- Wake Lock API (Manter tela ligada) ---
let wakeLock = null;
async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (err) { }
}
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') await requestWakeLock();
});