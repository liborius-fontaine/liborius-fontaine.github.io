/* ======================================
   EXPLORE BENIN - GESTION DES FAVORIS
====================================== */

const favoriteButtons = document.querySelectorAll(".favorite-btn");
const favoritesStorageKey = "exploreBeninFavorites";
let favorites = [];

// Lecture prudente : le site continue de fonctionner si le stockage est indisponible.
try {
    const savedFavorites = localStorage.getItem(favoritesStorageKey);
    const parsedFavorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    favorites = Array.isArray(parsedFavorites) ? parsedFavorites : [];
} catch (error) {
    favorites = [];
}

function updateFavoriteButton(button) {
    const id = button.dataset.favorite;
    const isFavorite = favorites.includes(id);

    button.classList.toggle("is-favorite", isFavorite);
    button.textContent = isFavorite ? "♥" : "♡";
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute(
        "aria-label",
        isFavorite
            ? `Retirer ${button.dataset.destinationName || "cette destination"} des favoris`
            : `Ajouter ${button.dataset.destinationName || "cette destination"} aux favoris`
    );
}

favoriteButtons.forEach(button => {
    updateFavoriteButton(button);

    button.addEventListener("click", () => {
        const id = button.dataset.favorite;

        if (favorites.includes(id)) {
            favorites = favorites.filter(favorite => favorite !== id);
        } else {
            favorites.push(id);
        }

        try {
            localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
        } catch (error) {
            // Le favori reste actif dans la page, même si le navigateur bloque le stockage.
        }

        updateFavoriteButton(button);
    });
});
