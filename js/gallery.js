/* ======================================
   EXPLORE BENIN - GALERIE PHOTOGRAPHIQUE
   Filtres, recherche et visionneuse accessible
====================================== */

(() => {
    function initGallery() {
        const gallery = document.querySelector("#gallery-grid");
        const dialog = document.querySelector("#gallery-dialog");
        if (!gallery || !dialog) return;

        const items = Array.from(gallery.querySelectorAll("[data-gallery-item]"));
        const filterButtons = Array.from(document.querySelectorAll("[data-gallery-filter]"));
        const searchInput = document.querySelector("#gallery-search");
        const noResults = document.querySelector("#gallery-no-results");
        const countLabel = document.querySelector("#gallery-count");

        const dialogImage = dialog.querySelector("#gallery-dialog-image");
        const dialogImageError = dialog.querySelector("#gallery-dialog-image-error");
        const dialogLocation = dialog.querySelector("#gallery-dialog-location");
        const dialogTitle = dialog.querySelector("#gallery-dialog-title");
        const dialogDescription = dialog.querySelector("#gallery-dialog-description");
        const dialogStoryText = dialog.querySelector("#gallery-dialog-story-text");
        const dialogStoryLink = dialog.querySelector("#gallery-dialog-story-link");
        const dialogCredit = dialog.querySelector("#gallery-dialog-credit");
        const dialogLicense = dialog.querySelector("#gallery-dialog-license");
        const dialogCounter = dialog.querySelector("#gallery-dialog-counter");
        const closeButton = dialog.querySelector("#gallery-dialog-close");
        const previousButton = dialog.querySelector("#gallery-dialog-prev");
        const nextButton = dialog.querySelector("#gallery-dialog-next");

        let activeFilter = "all";
        let activeItem = null;
        let activeTrigger = null;

        function normalizeText(value) {
            return String(value || "")
                .toLocaleLowerCase("fr")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
        }

        function visibleItems() {
            return items.filter(item => !item.hidden);
        }

        function updateGallery() {
            const query = searchInput ? normalizeText(searchInput.value) : "";
            let visibleCount = 0;

            items.forEach(item => {
                const categoryMatches = activeFilter === "all" || item.dataset.galleryCategory === activeFilter;
                const searchMatches = normalizeText(`${item.textContent} ${item.dataset.search || ""}`).includes(query);
                const show = categoryMatches && searchMatches;
                item.hidden = !show;
                if (show) visibleCount += 1;
            });

            if (countLabel) {
                countLabel.textContent = `${visibleCount} ${visibleCount > 1 ? "photographies affichées" : "photographie affichée"}`;
            }
            if (noResults) noResults.hidden = visibleCount !== 0;
            if (dialog.open && activeItem && activeItem.hidden) dialog.close();
        }

        function updateDialog(item) {
            const trigger = item?.querySelector("[data-gallery-open]");
            if (!trigger || !dialogImage) return false;

            const imagePath = trigger.dataset.imageSrc || trigger.querySelector("img")?.getAttribute("src") || "";
            dialogImage.alt = trigger.dataset.imageAlt || "Photographie du Bénin";
            dialogImage.hidden = false;
            if (dialogImageError) dialogImageError.hidden = true;
            dialogImage.removeAttribute("src");
            if (imagePath) {
                // The path is resolved from the page URL, just like the gallery thumbnails.
                dialogImage.src = new URL(imagePath, document.baseURI).href;
            } else {
                dialogImage.hidden = true;
                if (dialogImageError) dialogImageError.hidden = false;
            }

            if (dialogLocation) dialogLocation.textContent = trigger.dataset.location || "Bénin";
            if (dialogTitle) dialogTitle.textContent = trigger.dataset.title || trigger.querySelector("img")?.alt || "Photographie";
            if (dialogDescription) dialogDescription.textContent = trigger.dataset.description || "Une photographie de la galerie Explore Bénin.";
            if (dialogStoryText) dialogStoryText.textContent = trigger.dataset.story || "Cette image fait partie du voyage à travers les paysages, les lieux et les cultures du Bénin.";
            if (dialogStoryLink) {
                const storyUrl = trigger.dataset.storyUrl || "";
                if (storyUrl) {
                    dialogStoryLink.href = storyUrl;
                    dialogStoryLink.textContent = `Pour en savoir plus · ${trigger.dataset.storySource || "Source"} ↗`;
                    dialogStoryLink.hidden = false;
                } else {
                    dialogStoryLink.removeAttribute("href");
                    dialogStoryLink.hidden = true;
                }
            }

            const credit = trigger.dataset.credit || "Crédit non renseigné";
            if (dialogCredit) {
                dialogCredit.textContent = `Crédit : ${credit}`;
                if (trigger.dataset.creditUrl) {
                    dialogCredit.href = trigger.dataset.creditUrl;
                    dialogCredit.target = "_blank";
                    dialogCredit.rel = "noopener noreferrer";
                } else {
                    dialogCredit.removeAttribute("href");
                    dialogCredit.removeAttribute("target");
                }
            }
            if (dialogLicense) dialogLicense.textContent = trigger.dataset.license || "";

            const allVisible = visibleItems();
            const index = allVisible.indexOf(item);
            if (dialogCounter) dialogCounter.textContent = index >= 0 ? `Photo ${index + 1} sur ${allVisible.length}` : "";
            if (previousButton) previousButton.disabled = allVisible.length < 2;
            if (nextButton) nextButton.disabled = allVisible.length < 2;
            return true;
        }

        function openDialog() {
            if (dialog.open) return;
            if (typeof dialog.showModal === "function") {
                try {
                    dialog.showModal();
                    return;
                } catch (error) {
                    // Continue with the open-attribute fallback below.
                }
            }
            dialog.setAttribute("open", "");
            dialog.classList.add("gallery-dialog-fallback-open");
        }

        function openItem(item, trigger) {
            if (!item) return;
            activeItem = item;
            activeTrigger = trigger || item.querySelector("[data-gallery-open]");
            if (!updateDialog(item)) return;
            openDialog();
            closeButton?.focus();
        }

        function moveGallery(direction) {
            const currentItems = visibleItems();
            if (currentItems.length < 2 || !activeItem) return;
            const currentIndex = currentItems.indexOf(activeItem);
            const nextIndex = (currentIndex + direction + currentItems.length) % currentItems.length;
            activeItem = currentItems[nextIndex];
            activeTrigger = activeItem.querySelector("[data-gallery-open]");
            updateDialog(activeItem);
        }

        dialogImage?.addEventListener("error", () => {
            if (dialogImageError) dialogImageError.hidden = false;
        });
        dialogImage?.addEventListener("load", () => {
            if (dialogImageError) dialogImageError.hidden = true;
        });

        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                activeFilter = button.dataset.galleryFilter || "all";
                filterButtons.forEach(filterButton => {
                    const isActive = filterButton === button;
                    filterButton.classList.toggle("active", isActive);
                    filterButton.setAttribute("aria-pressed", String(isActive));
                });
                updateGallery();
            });
        });

        searchInput?.addEventListener("input", updateGallery);

        gallery.addEventListener("click", event => {
            const trigger = event.target.closest("[data-gallery-open]");
            if (!trigger || !gallery.contains(trigger)) return;
            openItem(trigger.closest("[data-gallery-item]"), trigger);
        });

        closeButton?.addEventListener("click", () => {
            if (dialog.open && typeof dialog.close === "function") dialog.close();
            else {
                dialog.removeAttribute("open");
                dialog.classList.remove("gallery-dialog-fallback-open");
            }
        });
        previousButton?.addEventListener("click", () => moveGallery(-1));
        nextButton?.addEventListener("click", () => moveGallery(1));

        dialog.addEventListener("click", event => {
            if (event.target === dialog) {
                if (typeof dialog.close === "function") dialog.close();
                else dialog.removeAttribute("open");
            }
        });

        dialog.addEventListener("close", () => {
            activeItem = null;
            const triggerToRestore = activeTrigger;
            activeTrigger = null;
            if (triggerToRestore?.isConnected) triggerToRestore.focus();
        });

        document.addEventListener("keydown", event => {
            if (!dialog.open) return;
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveGallery(-1);
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                moveGallery(1);
            } else if (event.key === "Escape" && dialog.classList.contains("gallery-dialog-fallback-open")) {
                dialog.removeAttribute("open");
                dialog.classList.remove("gallery-dialog-fallback-open");
            }
        });

        updateGallery();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGallery, { once: true });
    } else {
        initGallery();
    }
})();
