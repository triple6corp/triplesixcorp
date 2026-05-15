import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js';

/* ============================================================
   LÓGICA DEL PRELOADER
   ============================================================ */
// Usamos 'load' en lugar de 'DOMContentLoaded' porque 'load' 
// espera a que todas las imágenes y modelos 3D se descarguen por completo.
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    
    if (preloader) {
        // Le añadimos la clase que pone la opacidad en 0
        preloader.classList.add('preloader-hidden');
        
        // Después de que termine la animación de desvanecerse (600ms), 
        // lo quitamos del camino por completo para liberar memoria
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 600);
    }
});

// Scroll suave para los links del nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Animación de aparición al hacer scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = "0";
    section.style.transform = "translateY(50px)";
    section.style.transition = "all 0.8s ease-out";
    observer.observe(section);
});

// ============================================================
// ZOOM INTERACTIVO CON THREE.JS
// ============================================================
function initInfiniteZoom() {
    const container = document.getElementById('zoom-viewport');
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();

    const layers = [
        'zoom_images_bhc/0001.webp',
        'zoom_images_bhc/0002.webp',
        'zoom_images_bhc/0003.webp',
        'zoom_images_bhc/0004.webp',
        'zoom_images_bhc/0005.webp',
        'zoom_images_bhc/0006.webp',
        'zoom_images_bhc/0007.webp',
        'zoom_images_bhc/0008.webp',
        'zoom_images_bhc/0009.webp',
        'zoom_images_bhc/0010.webp',
        'zoom_images_bhc/0011.webp',
        'zoom_images_bhc/0012.webp',
        'zoom_images_bhc/0013.webp',
        'zoom_images_bhc/0014.webp',
        'zoom_images_bhc/0015.webp',
        'zoom_images_bhc/0016.webp',
        'zoom_images/0017.png',
        'zoom_images/0018.png',
        'zoom_images/0019.png',
        'zoom_images/0020.png',
        'zoom_images/0021.png',
        'zoom_images/0022.png',
        'zoom_images/0023.png',
        'zoom_images/0024.png',
        'zoom_images/0025.png',
        'zoom_images/0026.png',
        'zoom_images/0027.png',
        'zoom_images/0028.png',
        'zoom_images/0029.png',
        'zoom_images/0030.png',
        'zoom_images/0031.png',
        'zoom_images/0032.png'
    ];

    // Crear planos sin textura (placeholders transparentes)
    const planes = [];
    const loaded = new Set();

    layers.forEach((file, index) => {

        const geometry = new THREE.PlaneGeometry(8, 6);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = -index * 5;
        scene.add(plane);
        planes.push({ plane, file, index });
    });

    camera.position.z = 5;
    let targetZ = 5;

    // Lazy loading: carga solo las capas cercanas a la cámara
    const VENTANA = 6;

    function cargarCapasCercanas() {
        const capaActual = Math.round((5 - camera.position.z) / 5);
        const desde = Math.max(0, capaActual - 2);
        const hasta = Math.min(layers.length - 1, capaActual + VENTANA);

        for (let i = desde; i <= hasta; i++) {
            if (loaded.has(i)) continue;
            loaded.add(i);
            const { plane, file } = planes[i];
            loader.load(file, (texture) => {
                plane.material.map = texture;
                plane.material.opacity = 1;
                plane.material.needsUpdate = true;
            });
        }
    }

    // Scroll con rueda del mouse (desktop)
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        targetZ -= e.deltaY * 0.06;
        const minZ = -(layers.length - 1) * 5 + 2;
        targetZ = Math.max(minZ, Math.min(5, targetZ));
    }, { passive: false });

    // ✅ Soporte táctil para móvil
    let touchStartY = 0;

    container.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchY = e.touches[0].clientY;
        const delta = touchStartY - touchY;
        targetZ -= delta * 0.03;
        const minZ = -(layers.length - 1) * 5 + 2;
        targetZ = Math.max(minZ, Math.min(5, targetZ));
        touchStartY = touchY;
    }, { passive: false });

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        cargarCapasCercanas();
        renderer.render(scene, camera);
    }

    animate();
}

// ============================================================
// MODAL / LIGHTBOX DE LA GALERÍA
// ============================================================
function initGalleryModal() {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeModal = document.querySelector(".close-modal");
    const images = document.querySelectorAll(".grid-item img");

    if (!modal || images.length === 0) return;

    images.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            modal.style.display = "flex";
            modalImg.src = img.src;
        });
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = "none";
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.style.display = "none";
    });
}

/* ============================================================
   galeria horizontal
   ============================================================ */

// Esperamos a que todo el contenido de la página cargue
document.addEventListener('DOMContentLoaded', () => {
    // Busca TODAS las pistas de galería usando su clase en lugar del ID
    const tracks = document.querySelectorAll('.gallery-track');
    
    // Recorre cada una de las galerías que encuentre y duplica su contenido
    tracks.forEach(track => {
        const copy = track.innerHTML;
        track.innerHTML += copy;
    });
});

// Una sola inicialización
document.addEventListener('DOMContentLoaded', () => {
    initInfiniteZoom();
    initGalleryModal();
});