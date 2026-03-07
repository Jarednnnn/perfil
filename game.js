document.addEventListener("DOMContentLoaded", () => {
    
    // 1. CONFIGURATION & PLACEHOLDERS
    const SUPABASE_URL = "https://ycghvncnbricgararymx.supabase.co";
    const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY"; // Pega aquí tu clave anon
    const GROQ_API_KEY = "TU_GROQ_API_KEY"; // Pega aquí tu clave gsk_...

    let supabase = null;
    if (window.supabase && SUPABASE_URL.startsWith('http')) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn("Supabase initialization failed (placeholders likely):", e);
        }
    }

    // 2. STATE MANAGEMENT
    const state = {
        user: null,
        universe: { x: 0, y: 0, zoom: 1 },
        stars: [],
        discoveredPlanets: {}, 
        extraPlanets: [], // For the 100 planets per user
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
                // Increased density threshold from 0.94 to 0.85
                if (seededRandom(seed) > 0.85) {
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
        
        // Add coordinates from extraPlanets if they are in view
        state.extraPlanets.forEach(p => {
            const screenX = p.x + state.universe.x + viewWidth/2;
            const screenY = p.y + state.universe.y + viewHeight/2;
            if (screenX > 0 && screenX < viewWidth && screenY > 0 && screenY < viewHeight) {
                stars.push(p);
            }
        });

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

    function generate100Planets(userSeed) {
        console.log("Generating 100 focal planets for user...");
        const planets = [];
        const range = 5000;
        for (let i = 0; i < 100; i++) {
            const seed = userSeed + i;
            planets.push({
                id: `Elite-${i}`,
                x: (seededRandom(seed) - 0.5) * range,
                y: (seededRandom(seed + 100) - 0.5) * range,
                size: 8 + seededRandom(seed + 200) * 10,
                color: `hsl(${seededRandom(seed + 300) * 360}, 100%, 70%)`,
                isSpecial: true
            });
        }
        state.extraPlanets = planets;
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
        planetName.innerText = star.isSpecial ? `Soberanía Elite: ${star.id}` : `Sistema ${star.id}`;
        planetDesc.innerText = "Sincronizando con Groq AI...";

        // Reset Q&A UI
        const qaResponse = document.getElementById('qa-response');
        if (qaResponse) qaResponse.innerText = "¿Qué quieres saber sobre este mundo?";

        // AI Lore Integration
        async function fetchLore(query = null) {
            if (!GROQ_API_KEY || GROQ_API_KEY.includes("TU_")) {
                planetDesc.innerText = query ? "Conexión IA requerida para preguntas." : "Configura GROQ_API_KEY para recibir lore.";
                return;
            }
            
            if (query) qaResponse.innerText = "Pensando...";
            
            try {
                const messages = [
                    { role: "system", content: "Eres un explorador espacial experto. Crea lore inmersivo. Responde siempre en español." }
                ];

                if (!query) {
                    messages.push({ role: "user", content: `Crea una descripción corta y épica (máximo 20 palabras) para un planeta de color ${star.color} en las coordenadas ${star.id}.` });
                } else {
                    messages.push({ role: "user", content: `Estamos en un planeta de color ${star.color} (${star.id}). El explorador pregunta: "${query}". Responde de forma inmersiva y qué se puede hacer allí.` });
                }

                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: messages,
                        max_tokens: 150
                    })
                });
                
                const data = await response.json();

                if (data.choices && data.choices[0]) {
                    const content = data.choices[0].message.content;
                    if (query) {
                        qaResponse.innerText = content;
                    } else {
                        planetDesc.innerText = content;
                    }
                }
            } catch (e) {
                console.error("AI Error:", e);
                planetDesc.innerText = "Error de comunicación galáctica.";
            }
        }
        
        // Initial Lore
        fetchLore();

        // Setup Q&A listeners within the modal scope
        const qaSend = document.getElementById('qa-send');
        const qaInput = document.getElementById('qa-input');
        
        if (qaSend) {
            qaSend.onclick = () => {
                const question = qaInput.value.trim();
                if (question) fetchLore(question);
                qaInput.value = "";
            };
        }
    }

    // 6. EVENT LISTENERS
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.onsubmit = (e) => {
            e.preventDefault();
            const userInp = document.getElementById('auth-email').value.trim();
            const passInp = document.getElementById('auth-pass').value.trim();

            if (userInp.toLowerCase() === 'jared.nnnn' && passInp === 'teamomama') {
                state.user = { id: 'jared-internal', email: 'Jared.nnnn' };
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) userDisplay.innerText = state.user.email;
                
                generate100Planets(777); 

                switchView('galaxy');
                initControls();
            } else {
                alert('❌ Acceso Denegado: Usuario o contraseña incorrectos.');
            }
            return false;
        };
    }

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => switchView('galaxy');
    });

    // Landing logic
    document.getElementById('visit-planet')?.addEventListener('click', async () => {
        if (!state.user) return;
        
        const btn = document.getElementById('visit-planet');
        btn.disabled = true;
        btn.innerText = "Aterrizando...";

        const fuelEl = document.getElementById('hud-fuel');
        const creditsEl = document.getElementById('hud-credits');
        
        let currentFuel = parseInt(fuelEl.innerText);
        let currentCredits = parseInt(creditsEl.innerText);

        if (currentFuel >= 10) {
            currentFuel -= 10;
            currentCredits += 25;
            
            fuelEl.innerText = currentFuel;
            creditsEl.innerText = currentCredits;

            // Rare Random Events (1% chance)
            if (Math.random() < 0.01) {
                alert(`⚠️ ENCUENTRO INESPERADO\nDetectando señal anómala...`);
                fetchGroqEvent();
            } else {
                alert(`🚀 ¡Aterrizaje exitoso! Has obtenido 25 créditos.`);
            }
            
            async function fetchGroqEvent() {
                if (!GROQ_API_KEY || GROQ_API_KEY.includes("TU_")) return;
                try {
                    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
                        body: JSON.stringify({
                            model: "llama-3.3-70b-versatile",
                            messages: [{ role: "user", content: "Genera un mini-diálogo (15 palabras) de un encuentro espacial épico." }]
                        })
                    });
                    const d = await res.json();
                    if (d.choices) alert(`👽 EVENTO: ${d.choices[0].message.content}`);
                } catch(e){}
            }

            if (supabase) {
                try {
                    await supabase.from('profiles').update({ 
                        fuel: currentFuel, 
                        credits: currentCredits 
                    }).eq('id', state.user.id);
                } catch (e) {
                    console.error("Supabase Save Error:", e);
                }
            }
            switchView('galaxy');
        } else {
            alert("⚠️ ¡Combustible insuficiente!");
        }

        btn.disabled = false;
        btn.innerText = "Aterrizar";
    });
});
