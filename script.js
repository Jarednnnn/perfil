// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE (CON TUS DATOS)
// ==========================================
// Aquí se aplican la URL y el Token que ya tenías configurados
const supabaseUrl = 'https://ycghvncnbricgararymx.supabase.co'; 
const supabaseKey = 'sb_publishable_jmzs7MJA0Ls4WDAzousW3g_9pvFjc00';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Función para insertar datos en la tabla 'messages' que creamos en el SQL Editor
async function saveMessage(username, content) {
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
// 2. LÓGICA DE INTERFAZ Y EFECTOS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Partículas (Efecto Anime / Cyberpunk) ---
    if(window.particlesJS) {
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

    // --- Animación de las Bento Boxes ---
    const bentoCards = document.querySelectorAll('.bento-card');
    bentoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.8s cubic-bezier(0.1, 1, 0.2, 1) forwards`;
        card.style.animationDelay = `${0.4 + (index * 0.15)}s`;
    });

    // --- Reloj en Vivo ---
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

    // --- Botón de acceso al Login ---
    const authBtn = document.getElementById('game-auth-btn');
    authBtn?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
});
