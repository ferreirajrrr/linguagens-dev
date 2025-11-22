// Seleção de elementos do DOM
const cardContainer = document.querySelector(".card-container");
const searchInput = document.getElementById("search-input");
const landingPage = document.getElementById("landing-page");
const mainContent = document.getElementById("main-content");
const enterButton = document.getElementById("enter-button");
const constellationContainer = document.getElementById("constellation-container");
const constellationViewToggle = document.getElementById("constellation-view-toggle");
const gridViewToggle = document.getElementById("grid-view-toggle");

let dados = [];
let sketch; // Variável para guardar a instância do p5.js

/**
 * Carrega os dados do data.json e renderiza os cards iniciais.
 */
async function inicializarPagina() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        renderizarTodosOsCards(dados);
        // Inicializa a constelação e pausa a animação da grade (que não está visível)
        sketch = new p5(constellationSketch, constellationContainer);
        alternarVisao('constellation'); // Garante que a constelação é a visão inicial
    } catch (error) {
        console.error("Falha ao carregar os dados:", error);
        cardContainer.innerHTML = `<p class="no-results">Erro ao carregar informações. Tente novamente mais tarde.</p>`;
    }
}

/**
 * Renderiza todos os cards na página uma única vez.
 */
function renderizarTodosOsCards(dadosParaRenderizar) {
    cardContainer.innerHTML = ""; // Limpa o container
    dadosParaRenderizar.forEach((dado, index) => {
        const card = document.createElement("article");
        card.classList.add("card");
        card.dataset.id = index;
        card.innerHTML = `
            <img src="${dado.logo}" alt="Logo ${dado.nome}" class="card-logo">
            <h2>${dado.nome}</h2>
            <p class="card-year">Criado em: ${dado.data_criacao}</p>
            <p>${dado.descricao}</p>
            <a href="${dado.link}" target="_blank" rel="noopener noreferrer">Saiba mais</a>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.tagName !== 'A') {
                window.open(dado.link, '_blank');
            }
        });

        ativarEfeito3D(card); // Adiciona o efeito 3D interativo
        cardContainer.appendChild(card);
    });
}

/**
 * Filtra os cards com base no termo de busca, sem recriar o DOM.
 */
function filtrarCards() {
    // Se estiver na visão de constelação, muda para a grade
    if (cardContainer.style.display === 'none') {
        alternarVisao('grid');
    }

    const termoBusca = searchInput.value.toLowerCase();
    let resultadosEncontrados = false;
    document.querySelectorAll('.card').forEach(card => {
        const id = parseInt(card.dataset.id);
        const dado = dados[id];
        const corresponde = dado.nome.toLowerCase().includes(termoBusca) ||
                          dado.descricao.toLowerCase().includes(termoBusca);

        card.classList.toggle('card-hidden', !corresponde);

        if (corresponde) {
            resultadosEncontrados = true;
        }
    });

    // Mostra ou esconde a mensagem de "nenhum resultado"
    let noResultsMessage = cardContainer.querySelector('.no-results');

    if (!resultadosEncontrados && !noResultsMessage) {
        const p = document.createElement('p');
        p.className = 'no-results';
        p.textContent = 'Nenhum resultado encontrado.';
        cardContainer.appendChild(p);
    } else if (noResultsMessage) {
        noResultsMessage.style.display = resultadosEncontrados ? 'none' : 'block';
    }
}

/**
 * Adiciona um efeito de inclinação 3D a um elemento com base na posição do mouse.
 * @param {HTMLElement} element O elemento ao qual o efeito será aplicado.
 */
function ativarEfeito3D(element) {
    const maxRotation = 8; // Graus máximos de rotação

    element.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = element.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;

        const rotateX = maxRotation * ((y / height) - 0.5) * -2;
        const rotateY = maxRotation * ((x / width) - 0.5) * 2;

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
        element.style.boxShadow = `0 15px 30px rgba(0,0,0,0.3)`;
    });

    element.addEventListener('mouseleave', () => {
        element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        element.style.boxShadow = 'none';
    });
}

/**
 * Lógica da constelação com p5.js
 */
const constellationSketch = (p) => {
    let estrelas = [];
    let hoveredStar = null;

    class Estrela {
        constructor(id, x, y, nome) {
            this.id = id;
            this.pos = p.createVector(x, y);
            this.vel = p5.Vector.random2D().mult(p.random(0.1, 0.3));
            this.nome = nome;
            this.radius = p.random(2, 5);
            this.baseRadius = this.radius;
            this.color = p.color(141, 153, 255, 150); // --highlight-color com alpha
        }

        update() {
            this.pos.add(this.vel);
            // Faz as estrelas voltarem para a tela
            if (this.pos.x > p.width + 10) this.pos.x = -10;
            if (this.pos.x < -10) this.pos.x = p.width + 10;
            if (this.pos.y > p.height + 10) this.pos.y = -10;
            if (this.pos.y < -10) this.pos.y = p.height + 10;
        }

        display() {
            const distMouse = p.dist(this.pos.x, this.pos.y, p.mouseX, p.mouseY);
            let currentRadius = this.baseRadius;
            let currentAlpha = 150;

            if (distMouse < 20) {
                currentRadius = this.baseRadius * 3;
                currentAlpha = 255;
                hoveredStar = this;
            }

            this.radius = p.lerp(this.radius, currentRadius, 0.1);
            this.color.setAlpha(p.lerp(this.color._getAlpha(), currentAlpha, 0.1));

            p.noStroke();
            p.fill(this.color);
            p.ellipse(this.pos.x, this.pos.y, this.radius * 2);
        }
    }

    p.setup = () => {
        const canvas = p.createCanvas(constellationContainer.offsetWidth, constellationContainer.offsetHeight);
        canvas.style('border-radius', '15px');
        dados.forEach((dado, index) => {
            estrelas.push(new Estrela(index, p.random(p.width), p.random(p.height), dado.nome));
        });
    };

    p.draw = () => {
        p.background(2, 3, 20, 50); // --bg-color com alpha para efeito de rastro
        hoveredStar = null;

        estrelas.forEach(estrela => {
            estrela.update();
            estrela.display();
        });

        if (hoveredStar) {
            p.fill(255);
            p.textSize(14);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(hoveredStar.nome, hoveredStar.pos.x, hoveredStar.pos.y - hoveredStar.radius - 5);
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(constellationContainer.offsetWidth, constellationContainer.offsetHeight);
    };

    p.mouseClicked = () => {
        if (hoveredStar) {
            // Ao clicar, mostra o card correspondente e muda para a visão de grade
            alternarVisao('grid');
            const cardParaMostrar = document.querySelector(`.card[data-id='${hoveredStar.id}']`);
            if (cardParaMostrar) {
                // Esconde todos os outros e mostra apenas o clicado
                document.querySelectorAll('.card').forEach(c => c.classList.add('card-hidden'));
                cardParaMostrar.classList.remove('card-hidden');
                cardParaMostrar.scrollIntoView({ behavior: 'smooth', block: 'center' });
                searchInput.value = hoveredStar.nome; // Preenche a busca
            }
        }
    };
};

function alternarVisao(view) {
    if (view === 'constellation') {
        cardContainer.classList.add('hidden');
        constellationContainer.classList.remove('hidden');
        constellationViewToggle.classList.add('active');
        gridViewToggle.classList.remove('active');
        if (sketch) sketch.loop(); // Reinicia a animação
    } else { // 'grid'
        cardContainer.classList.remove('hidden');
        constellationContainer.classList.add('hidden');
        constellationViewToggle.classList.remove('active');
        gridViewToggle.classList.add('active');
        if (sketch) sketch.noLoop(); // Pausa a animação para economizar recursos
    }
}

// --- Adicionando Event Listeners ---

document.addEventListener('DOMContentLoaded', inicializarPagina);

searchInput.addEventListener("input", filtrarCards);

constellationViewToggle.addEventListener('click', () => alternarVisao('constellation'));
gridViewToggle.addEventListener('click', () => {
    alternarVisao('grid');
    // Ao voltar para a grade, reseta a busca e mostra todos os cards
    searchInput.value = '';
    filtrarCards();
});

enterButton.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    mainContent.classList.remove("hidden");

    // Garante que a página principal possa ser rolada
    document.body.style.overflowY = 'auto';

    // Remove a landing page do DOM após a transição para otimizar a performance
    setTimeout(() => {
        landingPage.remove();
    }, 600);

    // Não foca mais no input, pois a primeira interação é com a constelação
});
