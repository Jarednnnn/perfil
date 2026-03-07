// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const supabaseUrl = 'https://ycghvncnbricgararymx.supabase.co'; 
const supabaseKey = 'sb_publishable_jmzs7MJA0Ls4WDAzousW3g_9pvFjc00';
const _supabase = typeof supabase !== 'undefined' ? supabase.createClient(supabaseUrl, supabaseKey) : null;

// FUNCIÓN GLOBAL PARA GUARDAR MENSAJES
window.saveMessage = async (username, content) => {
    if (!_supabase) return;
    const { data, error } = await _supabase
        .from('messages') 
        .insert([{ username: username, content: content }]);

    if (error) console.error("Error al guardar:", error.message);
}

document.addEventListener("DOMContentLoaded", () => {
    
    // --- CORRECCIÓN DE REDIRECCIÓN ---
    const authBtn = document.getElementById('game-auth-btn');
    if (authBtn) {
        authBtn.onclick = (e) => {
            e.preventDefault();
            // Si ya hay sesión, vamos al chat. Si no, al login.
            const session = sessionStorage.getItem('jared_realm_session');
            window.location.href = session ? 'chat.html' : 'login.html';
        };
    }

    // --- RELOJ EN VIVO ---
    function updateClock() {
        const timeEl = document.getElementById('live-time');
        if(!timeEl) return;
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('es-ES', { hour12: false }) + " (Local)";
    }
    updateClock();
    setInterval(updateClock, 1000);

    // --- PARTÍCULAS (Configuración Original) ---
    if(window.particlesJS && document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 40, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#8555ff" },
                "opacity": { "value": 0.3 },
                "size": { "value": 2 },
                "line_linked": { "enable": true, "distance": 150, "color": "#8555ff", "opacity": 0.2 },
                "move": { "enable": true, "speed": 1 }
            }
        });
    }

    // --- LOGOUT ---
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem('jared_realm_session');
        window.location.href = 'index.html';
    });
});
