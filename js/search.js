/* ======================================
   EXPLORE BENIN - RECHERCHE ET FILTRES
====================================== */

const searchInput = document.querySelector("#destination-search");
const filterButtons = document.querySelectorAll(".filter-btn");
const destinationCards = document.querySelectorAll(".destination-card");
const noResults = document.querySelector("#no-results");

let currentFilter = "all";

function normalizeText(value) {
    return value
        .toLocaleLowerCase("fr")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function filterDestinations() {
    const searchText = searchInput ? normalizeText(searchInput.value) : "";

    let visibleCount = 0;

    destinationCards.forEach(card => {
        const category = card.dataset.category;
        const cardText = normalizeText(card.textContent);

        const matchesSearch = cardText.includes(searchText);
        const matchesCategory =
            currentFilter === "all" || category === currentFilter;

        const isVisible = matchesSearch && matchesCategory;

        card.classList.toggle("hidden", !isVisible);

        if (isVisible) {
            visibleCount++;
        }
    });

    if (noResults) {
        noResults.classList.toggle("visible", visibleCount === 0);
    }
}

if (searchInput) {
    searchInput.addEventListener("input", filterDestinations);
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(filterButton => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", isActive);
        });

        filterDestinations();
    });
});

// Mettre à jour l'affichage au chargement
filterDestinations();
