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
});
