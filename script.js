// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const supabaseUrl = 'https://ycghvncnbricgararymx.supabase.co'; 
const supabaseKey = 'sb_publishable_jmzs7MJA0Ls4WDAzousW3g_9pvFjc00';
// Verificar si supabase está cargado antes de inicializar
const _supabase = typeof supabase !== 'undefined' ? supabase.createClient(supabaseUrl, supabaseKey) : null;

window.saveMessage = async (username, content) => {
    if (!_supabase) return;
    const { data, error } = await _supabase
        .from('messages') 
        .insert([{ username: username, content: content }]);

    if (error) {
        console.error("Error al guardar:", error.message);
    } else {
        console.log("¡Datos enviados al Reino de Jared!", data);
    }
}

// ==========================================
// 2. LÓGICA DE INTERFAZ, EFECTOS Y SESIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- PROTECCIÓN DE RUTA (CHAT) ---
    const isChatPage = window.location.pathname.includes('chat.html');
    const session = sessionStorage.getItem('jared_realm_session');

    if (isChatPage && !session) {
        window.location.href = 'login.html';
        return;
    }

    // --- Partículas (Tu configuración original mejorada) ---
    if(window.particlesJS && document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
              "number": { "value": 40, "density": { "enable": true, "value_area": 1000 } },
              "color": { "value": "#8555ff" },
              "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" } },
              "opacity": {
                "value": 0.3,
                "random": true,
                "anim": { "enable": true, "speed": 0.5, "opacity_min": 0.1, "sync": false }
              },
              "size": { "value": 3, "random": true },
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
                "out_mode": "out"
              }
            },
            "interactivity": {
              "detect_on": "canvas",
              "events": {
                "onhover": { "enable": true, "mode": "grab" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
              }
            },
            "retina_detect": true
          });
    }

    // --- Animación de las Bento Boxes (Original) ---
    const bentoCards = document.querySelectorAll('.bento-card');
    bentoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.8s cubic-bezier(0.1, 1, 0.2, 1) forwards`;
        card.style.animationDelay = `${0.4 + (index * 0.15)}s`;
    });

    // --- Reloj en Vivo (Original) ---
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
    updateClock();
    setInterval(updateClock, 1000);

    // --- Botón de acceso al Login (Dashboard) ---
    const authBtn = document.getElementById('game-auth-btn');
    authBtn?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    // --- Botón de Logout (Chat) ---
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
        sessionStorage.removeItem('jared_realm_session');
        window.location.href = 'index.html';
    });
});
