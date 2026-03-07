document.addEventListener("DOMContentLoaded", () => {
    
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
        discoveredPlanets: {}, 
        isDragging: false,
        lastMouse: { x: 0, y: 0, canvasX: 0, canvasY: 0 },
        currentView: 'auth' // 'auth', 'galaxy', 'planet'
    };

    // 3. UI ELEMENTS
    const authView = document.getElementById('auth-view');
    const gameHud = document.getElementById('game-hud');
    const planetModal = document.getElementById('planet-modal');
    const galaxyCanvas = document.getElementById('galaxy-canvas');
    const ctx = galaxyCanvas?.getContext('2d');

    // 4. PROCEDURAL ENGINE
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function generateStarsInView() {
        const stars = [];
        const gridSize = 250;
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;
        
        const startX = Math.floor((-state.universe.x - viewWidth) / gridSize);
        const endX = Math.ceil((-state.universe.x + viewWidth) / gridSize);
        const startY = Math.floor((-state.universe.y - viewHeight) / gridSize);
        const endY = Math.ceil((-state.universe.y + viewHeight) / gridSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const seed = (x * 73856093) ^ (y * 19349663);
                if (seededRandom(seed) > 0.94) {
                    stars.push({
                        id: `${x},${y}`,
                        gridX: x,
                        gridY: y,
                        x: x * gridSize + seededRandom(seed + 1) * gridSize,
                        y: y * gridSize + seededRandom(seed + 2) * gridSize,
                        size: 3 + seededRandom(seed + 3) * 5,
                        color: `hsl(${seededRandom(seed + 4) * 360}, 70%, 80%)`
                    });
                }
            }
        }
        return stars;
    }

    // 5. CANVAS RENDERING
    function drawGalaxy() {
        if (!ctx || state.currentView !== 'galaxy') return;

        galaxyCanvas.width = galaxyCanvas.parentElement.offsetWidth;
        galaxyCanvas.height = galaxyCanvas.parentElement.offsetHeight;

        ctx.clearRect(0, 0, galaxyCanvas.width, galaxyCanvas.height);
        ctx.save();
        ctx.translate(galaxyCanvas.width/2 + state.universe.x, galaxyCanvas.height/2 + state.universe.y);

        const stars = generateStarsInView();
        stars.forEach(star => {
            // Draw Glow
            const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
            gradient.addColorStop(0, star.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw Core
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();

            // Hover indicator
            const dx = (star.x + state.universe.x + galaxyCanvas.width/2) - state.lastMouse.canvasX;
            const dy = (star.y + state.universe.y + galaxyCanvas.height/2) - state.lastMouse.canvasY;
            if (Math.sqrt(dx*dx + dy*dy) < 30) {
                ctx.strokeStyle = '#fff';
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(star.x - 20, star.y - 20, 40, 40);
            }
        });

        ctx.restore();
        requestAnimationFrame(drawGalaxy);
    }

    function initControls() {
        galaxyCanvas.addEventListener('mousedown', (e) => {
            state.isDragging = true;
            state.lastMouse.x = e.clientX;
            state.lastMouse.y = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                state.universe.x += e.clientX - state.lastMouse.x;
                state.universe.y += e.clientY - state.lastMouse.y;
                state.lastMouse.x = e.clientX;
                state.lastMouse.y = e.clientY;
            }
            const rect = galaxyCanvas.getBoundingClientRect();
            state.lastMouse.canvasX = e.clientX - rect.left;
            state.lastMouse.canvasY = e.clientY - rect.top;
        });

        window.addEventListener('mouseup', () => state.isDragging = false);
        
        galaxyCanvas.addEventListener('click', (e) => {
            const rect = galaxyCanvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left - galaxyCanvas.width/2 - state.universe.x;
            const clickY = e.clientY - rect.top - galaxyCanvas.height/2 - state.universe.y;
            
            const stars = generateStarsInView();
            const target = stars.find(s => Math.sqrt((s.x - clickX)**2 + (s.y - clickY)**2) < 25);
            
            if (target) showPlanetDetails(target);
        });
    }

    function switchView(view) {
        console.log("Switching view to:", view);
        state.currentView = view;
        
        // Remove 'hidden' class and set explicit display
        if (authView) {
            authView.classList.add('hidden');
            authView.style.display = 'none';
        }
        if (gameHud) {
            gameHud.classList.add('hidden');
            gameHud.style.display = 'none';
        }
        if (planetModal) {
            planetModal.classList.add('hidden');
            planetModal.style.display = 'none';
        }

        if (view === 'auth' && authView) {
            authView.classList.remove('hidden');
            authView.style.display = 'block';
        } else if (view === 'galaxy' && gameHud) {
            gameHud.classList.remove('hidden');
            gameHud.style.display = 'flex';
            
            setTimeout(() => {
                if (galaxyCanvas && galaxyCanvas.parentElement) {
                    galaxyCanvas.width = galaxyCanvas.parentElement.offsetWidth;
                    galaxyCanvas.height = galaxyCanvas.parentElement.offsetHeight;
                    console.log("Canvas resized:", galaxyCanvas.width, galaxyCanvas.height);
                }
                requestAnimationFrame(drawGalaxy);
            }, 100);
        } else if (view === 'planet' && planetModal) {
            planetModal.classList.remove('hidden');
            planetModal.style.display = 'block';
        }
    }

    function showPlanetDetails(star) {
        switchView('planet');
        const planetName = document.getElementById('planet-name');
        const planetDesc = document.getElementById('planet-desc');
        const container = document.getElementById('planet-canvas-container');
        
        container.innerHTML = '<canvas id="planet-canvas"></canvas>';
        const pCanvas = document.getElementById('planet-canvas');
        pCanvas.width = container.offsetWidth;
        pCanvas.height = container.offsetHeight;
        const pCtx = pCanvas.getContext('2d');

        function drawPlanet() {
            if (state.currentView !== 'planet') return;
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            const centerX = pCanvas.width / 2;
            const centerY = pCanvas.height / 2;
            const radius = 80;

            const glow = pCtx.createRadialGradient(centerX, centerY, radius, centerX, centerY, radius + 50);
            glow.addColorStop(0, star.color.replace('80%)', '40%)'));
            glow.addColorStop(1, 'transparent');
            pCtx.fillStyle = glow;
            pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

            const grad = pCtx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
            grad.addColorStop(0, star.color);
            grad.addColorStop(1, '#000');
            pCtx.beginPath();
            pCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            pCtx.fillStyle = grad;
            pCtx.fill();

            if (seededRandom(star.gridX + star.gridY) > 0.5) {
                pCtx.beginPath();
                pCtx.ellipse(centerX, centerY, radius + 60, 25, Math.PI / 6, 0, Math.PI * 2);
                pCtx.strokeStyle = 'rgba(255,255,255,0.4)';
                pCtx.lineWidth = 4;
                pCtx.stroke();
            }
        }
        drawPlanet();

        planetName.innerText = `Sistema ${star.id}`;
        planetDesc.innerText = "Sincronizando con DeepSeek... (Procedural Generation In Progress)";
    }

    // 6. EVENT LISTENERS
    document.getElementById('auth-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInp = document.getElementById('auth-email').value.trim();
        const passInp = document.getElementById('auth-pass').value.trim();

        console.log("Attempting login with:", userInp);

        // Internal credential check
        if (userInp.toLowerCase() === 'jared.nnnn' && passInp === 'teamomama') {
            console.log("Login success!");
            state.user = { id: 'jared-internal', email: 'Jared.nnnn' };
            document.getElementById('user-display').innerText = state.user.email;
            
            switchView('galaxy');
            initControls();
        } else {
            console.error("Login failed: Invalid credentials");
            alert('❌ Acceso Denegado: Usuario o contraseña incorrectos.');
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView('galaxy'));
    });
});
