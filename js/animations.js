/* ======================================
   EXPLORE BENIN - ANIMATIONS ET SECOURS IMAGE
====================================== */

// Si une image distante ne charge pas, on conserve son conteneur et son fond.
document.querySelectorAll("img").forEach(img => {
    const signalerIndisponible = () => {
        img.classList.add("image-unavailable");
        const conteneur = img.closest(".arche, .destination-card, .culture-image, .food-image, .gallery-media, .video-frame, .video-external-preview");
        if (conteneur) conteneur.classList.add("image-fallback");
    };

    if (img.complete && img.naturalWidth === 0) {
        signalerIndisponible();
    } else {
        img.addEventListener("error", signalerIndisponible, { once: true });
    }
});

// Apparition douce des blocs quand ils entrent dans l'écran.
const blocs = document.querySelectorAll("[data-reveal]");
const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduit) {
    document.documentElement.classList.add("anim");

    const observateur = new IntersectionObserver(entrees => {
        entrees.forEach(entree => {
            if (entree.isIntersecting) {
                entree.target.classList.add("visible-bloc");
                observateur.unobserve(entree.target);
            }
        });
    }, { threshold: 0.12 });

    blocs.forEach(bloc => observateur.observe(bloc));
} else {
    blocs.forEach(bloc => bloc.classList.add("visible-bloc"));
}
