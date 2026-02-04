# 🕵️ Quem Sou Eu? - Party Edition

> Um jogo de adivinhação multiplayer em tempo real, jogável diretamente no navegador via conexão P2P.

![Status](https://img.shields.io/badge/Status-Funcional-brightgreen)
![Tech](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20JS-blue)
![Multiplayer](https://img.shields.io/badge/Conexão-P2P%20(PeerJS)-orange)

## 🎮 Sobre o Jogo

**Quem Sou Eu?** é uma versão digital moderna do clássico jogo de festa (estilo "charada" ou "imagem e ação").

O jogo conecta amigos em uma sala virtual onde, a cada rodada, um jogador é sorteado como o **Mestre**. O Mestre recebe uma palavra secreta (animal, objeto, personagem, etc.) e deve enviar dicas para os outros jogadores. O primeiro a acertar ganha pontos, e o Mestre também pontua por dar boas dicas!

## ✨ Funcionalidades

* **Multiplayer P2P:** Conexão direta entre navegadores sem necessidade de servidor backend complexo (usa PeerJS).
* **Lobby Virtual:** Sistema de criação de salas com códigos compartilháveis.
* **Design Moderno:** Interface estilo "Glassmorphism" (efeito de vidro), animações suaves e responsividade total para celulares.
* **Papéis Assimétricos:**
    * 👑 **Mestre:** Vê a palavra secreta e tem painel de dicas.
    * 🤔 **Adivinhadores:** Veem o chat de dicas e têm campo de resposta.
* **Sistema de Pontuação:** Pontos automáticos para quem acerta e bônus para o Mestre.
* **Chat em Tempo Real:** Dicas e chutes aparecem instantaneamente para todos.

## 🛠️ Tecnologias Utilizadas

* **HTML5 & CSS3:** Estrutura semântica e estilização avançada com Variáveis CSS e Flexbox.
* **JavaScript (ES6+):** Lógica de jogo e manipulação do DOM.
* **[PeerJS](https://peerjs.com/):** Biblioteca para simplificar conexões WebRTC (Peer-to-Peer).
* **[Phosphor Icons](https://phosphoricons.com/):** Biblioteca de ícones moderna e leve.
* **Google Fonts:** Tipografia com as fontes *Poppins* e *Fredoka*.

## 🚀 Como Rodar o Projeto

⚠️ **IMPORTANTE:** Como este jogo utiliza recursos de rede (WebRTC), ele **não funcionará** corretamente se você apenas clicar duas vezes no arquivo `index.html`. É necessário rodá-lo em um servidor local ou hospedá-lo.

### Opção 1: VS Code (Recomendado para Testes)
1.  Tenha o **VS Code** instalado.
2.  Instale a extensão **Live Server**.
3.  Abra a pasta do projeto no VS Code.
4.  Clique com o botão direito no `index.html` e escolha **"Open with Live Server"**.
5.  O jogo abrirá no seu navegador padrão.

### Opção 2: Jogar com Amigos (Online)
Para jogar com pessoas fora da sua rede Wi-Fi, você deve hospedar os arquivos em um serviço estático gratuito:
1.  Crie uma conta no **Vercel**, **Netlify** ou **GitHub Pages**.
2.  Suba os arquivos (`index.html`, `style.css`, `script.js`).
3.  Compartilhe o link gerado com seus amigos!

## 🕹️ Como Jogar

1.  **Criar Sala:** Um jogador clica em "Criar Sala", digita seu nome e envia o código (ou link) para os amigos.
2.  **Entrar:** Os amigos colam o código no menu inicial e clicam em "Entrar".
3.  **Lobby:** O anfitrião aguarda todos aparecerem na lista e clica em "Iniciar Jogo".
4.  **A Rodada:**
    * O jogo sorteia o Mestre.
    * O Mestre dá dicas (ex: "Começa com a letra A", "É um animal").
    * Os outros tentam chutar a resposta.
5.  **Vitória:** Quem acertar a palavra exata ganha pontos e a rodada termina.

## 🔮 Futuras Melhorias (Roadmap)

* [ ] Implementar **Wake Lock API** para impedir que a tela do celular apague durante o jogo.
* [ ] Adicionar sons de acerto, erro e vitória.
* [ ] Opção de pular a vez (se o Mestre não souber descrever).
* [ ] Servidor TURN para melhorar a conexão em redes 4G/5G restritas.

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.

Desenvolvido com 💻 e café.

## 👨‍💻 Autor

Desenvolvido por Patrick Gonçalves

💡 Projeto educacional e interativo em JavaScript
