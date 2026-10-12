# Impostor

Um jogo de dedução em grupo no estilo "pass-and-play" (passe o aparelho) rodando diretamente no navegador[cite: 2]. Os jogadores recebem palavras secretas, mas um deles é o impostor e precisa disfarçar para não ser descoberto pela tripulação.

## 🎮 Como Jogar

1. Abra o arquivo `index.html` em qualquer navegador web moderno[cite: 1].
2. Configure a partida na tela inicial:
   * **Número de Jogadores:** 4 a 8 jogadores[cite: 2].
   * **Nomes:** Insira o nome de cada participante[cite: 2].
   * **Palavra do Impostor:** Escolha se o impostor terá uma palavra parecida ou nenhuma palavra[cite: 2].
   * **Tempo de Discussão:** Defina o limite de tempo da rodada (entre 30 e 600 segundos)[cite: 2].
3. Passe o aparelho para cada jogador ver seu papel secretamente[cite: 2].
4. Após as dicas em voz alta, o cronômetro de discussão é iniciado[cite: 2].
5. Todos votam secretamente no aparelho[cite: 2].
6. O jogador com mais votos é expulso[cite: 2]. Em caso de empate, ocorre uma nova votação entre os empatados ou um sorteio[cite: 2].

## 🛠️ Tecnologias Utilizadas

O projeto não requer servidor (backend) e funciona de forma 100% estática:
* **HTML5:** Estrutura semântica[cite: 1].
* **CSS3:** Estilização com suporte a temas Claro e Escuro (Dark Mode) automático baseado na preferência do sistema[cite: 3].
* **JavaScript (Vanilla):** Lógica do jogo, simulação de rotas via URLSearchParams, controle de cronômetro e manipulação do DOM[cite: 2].

## 🎨 Tipografia
O projeto utiliza as fontes **Bricolage Grotesque** e **Instrument Sans** importadas do Google Fonts[cite: 1].git init