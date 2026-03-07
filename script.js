// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const supabaseUrl = 'https://ycghvncnbricgararymx.supabase.co'; 
const supabaseKey = 'sb_publishable_jmzs7MJA0Ls4WDAzousW3g_9pvFjc00';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// FUNCIÓN GLOBAL PARA GUARDAR (Para todos los usuarios)
window.saveMessage = async (username, content) => {
    const { data, error } = await _supabase
        .from('messages') 
        .insert([{ username: username, content: content }]);

    if (error) console.error("Error al enviar al Reino:", error.message);
}

// ==========================================
// 2. LÓGICA DE INTERFAZ Y EFECTOS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Reloj en Vivo (Tu código original)
    function updateClock() {
        const timeEl = document.getElementById('live-time');
        if(!timeEl) return;
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('es-ES', { hour12: false }) + " (Local)";
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Partículas (Tu configuración original)
    if(window.particlesJS && document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
              "number": { "value": 40, "density": { "enable": true, "value_area": 1000 } },
              "color": { "value": "#8555ff" },
              "opacity": { "value": 0.3 },
              "size": { "value": 3 },
              "line_linked": { "enable": true, "distance": 200, "color": "#8555ff", "opacity": 0.15 },
              "move": { "enable": true, "speed": 1 }
            }
        });
    }

    // Lógica de Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem('jared_realm_session');
        window.location.href = 'index.html';
    });
});
