// Configuración de las partículas para darle ese efecto "Anime" mágico o ciberpunk en el fondo
// Usamos Particles.js cargado desde el CDN en index.html

document.addEventListener("DOMContentLoaded", () => {
    
    // Solo inicia particles si la librería cargó correctamente
    if(window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
              "number": {
                "value": 40, // Menos partículas para no saturar el fondo
                "density": {
                  "enable": true,
                  "value_area": 1000
                }
              },
              "color": {
                "value": "#8555ff" // Color púrpura suave estilo galaxia
              },
              "shape": {
                "type": "circle",
                "stroke": {
                  "width": 0,
                  "color": "#000000"
                },
              },
              "opacity": {
                "value": 0.3,
                "random": true,
                "anim": {
                  "enable": true,
                  "speed": 0.5,
                  "opacity_min": 0.1,
                  "sync": false
                }
              },
              "size": {
                "value": 3,
                "random": true,
                "anim": {
                  "enable": false
                }
              },
              "line_linked": {
                "enable": true,
                "distance": 200,
                "color": "#8555ff",
                "opacity": 0.15,
                "width": 1
              },
              "move": {
                "enable": true,
                "speed": 1,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                  "enable": false,
                  "rotateX": 600,
                  "rotateY": 1200
                }
              }
            },
            "interactivity": {
              "detect_on": "canvas",
              "events": {
                "onhover": {
                  "enable": true,
                  "mode": "grab" 
                },
                "onclick": {
                  "enable": true,
                  "mode": "push" 
                },
                "resize": true
              },
              "modes": {
                "grab": {
                  "distance": 200,
                  "line_linked": {
                    "opacity": 0.5
                  }
                },
                "push": {
                  "particles_nb": 3
                }
              }
            },
            "retina_detect": true
          });
    }

    // Efecto extra: Cascading animation for bento boxes
    const bentoCards = document.querySelectorAll('.bento-card');
    bentoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.8s cubic-bezier(0.1, 1, 0.2, 1) forwards`;
        card.style.animationDelay = `${0.4 + (index * 0.15)}s`;
    });

    // Live Clock Widget
    function updateClock() {
        const timeEl = document.getElementById('live-time');
        if(!timeEl) return;
        
        const now = new Date();
        const str = now.toLocaleDateString('es-ES') + " " + now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        }) + " (Local)";
        timeEl.innerText = str;
    }
    
    // Initial call and set interval
    updateClock();
    setInterval(updateClock, 1000);

    // ==========================================
    // MULTIPLAYER MINI-GAME CORE LOGIC
    // ==========================================

    // 1. CONFIGURATION & PLACEHOLDERS
    const SUPABASE_URL = "YOUR_SUPABASE_URL";
    const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
    const DEEPSEEK_API_KEY = "YOUR_DEEPSEEK_API_KEY";

    let supabase = null;
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // 2. STATE MANAGEMENT
    const state = {
        user: null,
        universe: { x: 0, y: 0, zoom: 1 },
        stars: [],
        discoveredPlanets: {}, // Cache for planets discovered/visited
        isDragging: false,
        lastMouse: { x: 0, y: 0 },
        currentView: 'dashboard' // 'dashboard', 'auth', 'galaxy', 'planet'
    };

    // 3. UI ELEMENTS
    const gameOverlay = document.getElementById('game-overlay');
    const authBtn = document.getElementById('game-auth-btn');
    const authModal = document.getElementById('auth-modal');
    const gameHud = document.getElementById('game-hud');
    const planetModal = document.getElementById('planet-modal');
    const galaxyCanvas = document.getElementById('galaxy-canvas');
    const ctx = galaxyCanvas?.getContext('2d');

    // 4. PROCEDURAL ENGINE (PRNG)
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function generateStarsInView() {
        // Deterministic generation based on grid coordinates
        const stars = [];
        const gridSize = 200;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;
        
        const startX = Math.floor((-state.universe.x - viewWidth/2) / gridSize);
        const endX = Math.ceil((-state.universe.x + viewWidth/2) / gridSize);
        const startY = Math.floor((-state.universe.y - viewHeight/2) / gridSize);
        const endY = Math.ceil((-state.universe.y + viewHeight/2) / gridSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const seed = (x * 73856093) ^ (y * 19349663);
                if (seededRandom(seed) > 0.95) { // 5% chance of a system
                    stars.push({
                        id: `${x},${y}`,
                        gridX: x,
                        gridY: y,
                        x: x * gridSize + seededRandom(seed + 1) * gridSize,
                        y: y * gridSize + seededRandom(seed + 2) * gridSize,
                        size: 2 + seededRandom(seed + 3) * 4,
                        color: `hsl(${seededRandom(seed + 4) * 360}, 70%, 80%)`,
                        isPlanetGenerated: false
                    });
                }
            }
        }
        return stars;
    }

    // 5. CANVAS RENDERING
    function drawGalaxy() {
        if (!ctx || state.currentView !== 'galaxy') return;

        ctx.clearRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);
        ctx.save();
        ctx.translate(galaxyCanvas.width/2 + state.universe.x, galaxyCanvas.height/2 + state.universe.y);

        const stars = generateStarsInView();
        stars.forEach(star => {
            // Draw star/system
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = star.color;
            ctx.fill();

            // Interaction hint
            const dx = (star.x + state.universe.x + galaxyCanvas.width/2) - state.lastMouse.canvasX;
            const dy = (star.y + state.universe.y + galaxyCanvas.height/2) - state.lastMouse.canvasY;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(star.x - 15, star.y - 15, 30, 30);
            }
        });

        ctx.restore();
        requestAnimationFrame(drawGalaxy);
    }

    function initCanvas() {
        if (!galaxyCanvas) return;
        galaxyCanvas.width = galaxyCanvas.offsetWidth;
        galaxyCanvas.height = galaxyCanvas.offsetHeight;
        
        galaxyCanvas.addEventListener('mousedown', (e) => {
            state.isDragging = true;
            state.lastMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                state.universe.x += e.clientX - state.lastMouse.x;
                state.universe.y += e.clientY - state.lastMouse.y;
                state.lastMouse = { x: e.clientX, y: e.clientY };
            }
            const rect = galaxyCanvas.getBoundingClientRect();
            state.lastMouse.canvasX = e.clientX - rect.left;
            state.lastMouse.canvasY = e.clientY - rect.top;
        });

        window.addEventListener('mouseup', () => state.isDragging = false);
        
        galaxyCanvas.addEventListener('click', (e) => {
            // Check for star clicks
            const rect = galaxyCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left - galaxyCanvas.width/2 - state.universe.x;
            const clickY = e.clientY - rect.top - galaxyCanvas.height/2 - state.universe.y;
            
            const stars = generateStarsInView();
            const target = stars.find(s => Math.sqrt((s.x - clickX)**2 + (s.y - clickY)**2) < 20);
            
            if (target) {
                showPlanetDetails(target);
            }
        });
    }

    // 6. GAME NAVIGATION & AUTH FLOW
    function switchView(view) {
        state.currentView = view;
        gameOverlay.classList.toggle('game-hidden', view === 'dashboard');
        authModal.classList.toggle('hidden', view !== 'auth');
        gameHud.classList.toggle('hidden', view !== 'galaxy');
        planetModal.classList.toggle('hidden', view !== 'planet');

        if (view === 'galaxy') {
            initCanvas();
            requestAnimationFrame(drawGalaxy);
        }
    }

    async function showPlanetDetails(star) {
        switchView('planet');
        const planetName = document.getElementById('planet-name');
        const planetDesc = document.getElementById('planet-desc');
        const container = document.getElementById('planet-canvas-container');
        
        container.innerHTML = '<canvas id="planet-canvas"></canvas>';
        const pCanvas = document.getElementById('planet-canvas');
        pCanvas.width = container.offsetWidth;
        pCanvas.height = container.offsetHeight;
        const pCtx = pCanvas.getContext('2d');

        // Draw procedural planet
        function drawPlanet() {
            if (state.currentView !== 'planet') return;
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            
            const centerX = pCanvas.width / 2;
            const centerY = pCanvas.height / 2;
            const radius = 80;

            // Atmosphere/Glow
            const glow = pCtx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 40);
            glow.addColorStop(0, star.color.replace('80%)', '40%)'));
            glow.addColorStop(1, 'transparent');
            pCtx.fillStyle = glow;
            pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

            // Planet Body
            pCtx.beginPath();
            pCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            const grad = pCtx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
            grad.addColorStop(0, star.color);
            grad.addColorStop(1, '#000');
            pCtx.fillStyle = grad;
            pCtx.fill();

            // Ring (if seed dictates)
            if (seededRandom(star.gridX + star.gridY) > 0.5) {
                pCtx.beginPath();
                pCtx.ellipse(centerX, centerY, radius + 50, 20, Math.PI / 4, 0, Math.PI * 2);
                pCtx.strokeStyle = 'rgba(255,255,255,0.3)';
                pCtx.lineWidth = 3;
                pCtx.stroke();
            }
        }
        drawPlanet();

        planetName.innerText = `Sistema ${star.id}`;
        planetDesc.innerText = "Sincronizando con DeepSeek... (Procedural Generation In Progress)";
    }

    // 7. EVENT LISTENERS
    authBtn?.addEventListener('click', () => {
        if (!state.user) {
            switchView('auth');
        } else {
            switchView('galaxy');
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView('dashboard'));
    });

    document.getElementById('exit-game')?.addEventListener('click', () => switchView('dashboard'));

    document.getElementById('auth-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        // Supabase Auth logic placeholder
        state.user = { id: 'dummy-user', email: 'user@example.com' };
        switchView('galaxy');
    });
});

