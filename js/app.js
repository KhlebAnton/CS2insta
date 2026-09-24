const mapsPage = document.querySelector("#mapsPage");
const sidePage = document.querySelector("#sidePage");
const spawnsPage = document.querySelector("#spawnsPage");

const mapsGrid = document.querySelector("#mapsGrid");
const sidesGrid = document.querySelector("#sidesGrid");
const spawnPoints = document.querySelector("#spawnPoints");

const modal = document.querySelector("#lineupModal");

let currentMapId = null;
let currentMap = null;
let currentSideId = null;
let currentSide = null;

function navigate(path) {
    window.location.hash = path || "/";
}

function showPage(page) {
    document.querySelectorAll(".page").forEach((item) => {
        item.classList.remove("is-active");
    });

    page.classList.add("is-active");

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}

function getSideEntries(map) {
    return Object.entries(map?.sides || {});
}

function getSpawnById(side, id) {
    return (side?.spawns || []).find(
        (spawn) => String(spawn.id) === String(id)
    );
}

function getSpawns(side) {
    return Array.isArray(side?.spawns) ? side.spawns : [];
}

function getAimImages(spawn) {
    if (Array.isArray(spawn?.aimImages) && spawn.aimImages.length) {
        return spawn.aimImages.filter(Boolean);
    }

    return spawn?.aimImage ? [spawn.aimImage] : [];
}

// Превью lineup: поддерживаем все варианты, которые могли попасть
// в старые/новые data.js. Если отдельного preview нет — используем
// первый aim-кадр, затем result.
function getSpawnPreview(spawn) {
    if (!spawn) return "";

    return (
        spawn.previewImage ||
        spawn.preview ||
        spawn.image ||
        spawn.thumbnail ||
        spawn.thumb ||
        getAimImages(spawn)[0] ||
        spawn.resultImage ||
        spawn.result ||
        currentSide?.previewImage ||
        ""
    );
}

function renderMaps() {
    const maps = Object.entries(smokeData || {});

    if (!maps.length) {
        mapsGrid.innerHTML = `
            <div class="empty-state">
                <strong>Нет карт</strong>
                <span>Добавь карту через админ-панель.</span>
            </div>
        `;
        return;
    }

    mapsGrid.innerHTML = maps.map(
        ([id, map], index) => `
            <button class="map-card" data-map="${escapeHtml(id)}" type="button">
                <span class="map-card__bg" ${map.previewImage ? `style="background-image:url(${escapeAttribute(map.previewImage)})"` : ""}></span>
                <span class="map-card__pattern"></span>
                <span class="map-card__content">
                    <span class="map-card__number">
                        ${String(index + 1).padStart(2, "0")} / MAP
                    </span>
                    <strong>${escapeHtml(map.name || id)}</strong>
                    <small>Instant smokes</small>
                </span>
                <span class="map-card__arrow">→</span>
            </button>
        `
    ).join("");
}

function renderSides() {
    if (!currentMap) {
        sidesGrid.innerHTML = "";
        return;
    }

    const sides = getSideEntries(currentMap);

    if (!sides.length) {
        sidesGrid.innerHTML = `
            <div class="empty-state">
                <strong>Нет сторон / мест</strong>
                <span>Создай их через админ-панель.</span>
            </div>
        `;
        return;
    }

    sidesGrid.innerHTML = sides.map(
        ([id, side], index) => {
            const label = side.label || id;
            const count = getSpawns(side).length;
            const isT = id.toLowerCase() === "t";
            const isCt = id.toLowerCase() === "ct";

            return `
                <button
                    class="side-card ${isT ? "side-card_t" : ""} ${isCt ? "side-card_ct" : ""}"
                    data-side="${escapeHtml(id)}"
                    type="button"
                >
                    <span class="side-card__image">${side.previewImage || side.mapImage ? `<img src="${escapeAttribute(side.previewImage || side.mapImage)}" alt="">` : ""}</span>
                    <span class="side-card__number">
                        ${String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>${escapeHtml(label)}</strong>
                    <small>${count} ${getLineupWord(count)}</small>
                    <i>→</i>
                </button>
            `;
        }
    ).join("");
}

function getLineupWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return "lineup";
    if (count >= 2 && count <= 4) return "lineups";
    return "lineups";
}

function openMap(id, updateUrl = true) {
    const map = smokeData?.[id];

    if (!map) {
        showPage(mapsPage);
        return;
    }

    currentMapId = id;
    currentMap = map;
    currentSideId = null;
    currentSide = null;

    document.querySelector("#sideMapName").textContent =
        (map.name || id).toUpperCase();

    renderSides();
    showPage(sidePage);

    if (updateUrl) navigate(`/${id}`);

}

function openSide(id, updateUrl = true) {
    if (!currentMap?.sides?.[id]) {
        renderSides();
        showPage(sidePage);
        return;
    }

    currentSideId = id;
    currentSide = currentMap.sides[id];

    const spawns = getSpawns(currentSide);

    // ВАЖНО: даже если lineup только один, экран выбора
    // оставляем. Это позволяет использовать один и тот же
    // сценарий для мест с 1, 2 или большим количеством lineup.
    renderSpawns();
    showPage(spawnsPage);

    if (updateUrl) {
        navigate(`/${currentMapId}/${id}`);
    }
}

function renderSpawns() {
    if (!currentMap || !currentSide) return;

    const side = currentSide;
    const spawns = getSpawns(side);
    const image = document.querySelector("#spawnMapImage");
    const spawnMap = document.querySelector(".spawn-map");

    document.querySelector("#spawnEyebrow").textContent =
        `${(currentMap.name || currentMapId).toUpperCase()} / ${(side.label || currentSideId).toUpperCase()}`;

    document.querySelector("#mapToolbarName").textContent =
        (currentMap.name || currentMapId).toUpperCase();

    document.querySelector("#mapToolbarSide").textContent =
        (side.label || currentSideId).toUpperCase();

    document.querySelector("#spawnCount").textContent = spawns.length;

    // Если карты нет, не оставляем битую картинку.
    if (side.mapImage) {
        image.src = side.mapImage;
        image.alt = `${currentMap.name || currentMapId} ${side.label || currentSideId}`;
        image.style.display = "";
        spawnMap.classList.remove("spawn-map_no-image");
        spawnPoints.classList.remove("spawn-points_no-map");
    } else {
        image.removeAttribute("src");
        image.alt = "";
        image.style.display = "none";
        spawnMap.classList.add("spawn-map_no-image");
        spawnPoints.classList.add("spawn-points_no-map");
    }

    spawnPoints.innerHTML = spawns.map(
        (spawn) => {
            const hasCoords =
                Number.isFinite(Number(spawn.x)) &&
                Number.isFinite(Number(spawn.y));

            if (spawns.length === 1) {
                console.log("Создается единственный spawn:", spawn);
            }


            return `
                <button
                    class="spawn-point ${hasCoords && side.mapImage ? "" : "spawn-point_no-map"} ${spawns.length === 1 ? "spawn-one-btn" : ""}"
                    ${hasCoords && side.mapImage && spawns.length !== 1
                    ? `style="left:${Number(spawn.x) || 0}%;top:${Number(spawn.y) || 0}%"`
                    : ""}
                    data-spawn="${escapeHtml(spawn.id)}"
                    type="button"
                    aria-label="${escapeHtml(spawn.name || `Spawn ${spawn.id}`)}"
                >
                    ${!side.mapImage ? `<span class="spawn-point__preview">${getSpawnPreview(spawn) ? `<img src="${escapeAttribute(getSpawnPreview(spawn))}" alt="${escapeAttribute(spawn.name || "Lineup")}">` : `<span class="spawn-point__preview_empty">Нет превью</span>`}</span>` : ""}
                    <span class="spawn-point__id">${escapeHtml(spawn.id)}</span>
                    <span>${escapeHtml(spawn.name || "SPAWN")}</span>
                    ${spawn.position ? `<small>${escapeHtml(spawn.position)}</small>` : ""}
                </button>
            `;
        }
    ).join("");
}

function openLineup(spawn) {
    if (!spawn) return;

    const mapName = currentMap?.name || currentMapId;
    const sideName = currentSide?.label || currentSideId;

    document.querySelector("#lineupEyebrow").textContent =
        `${String(mapName).toUpperCase()} / ${String(sideName).toUpperCase()} SPAWN ${spawn.id}`;

    document.querySelector("#lineupTitle").textContent =
        spawn.name || `Spawn ${spawn.id}`;

    document.querySelector("#lineupThrow").textContent =
        (spawn.throw || "—").toUpperCase();

    document.querySelector("#lineupPosition").textContent =
        spawn.position || "—";

    document.querySelector("#lineupMethod").textContent =
        spawn.throw || "—";

    document.querySelector("#lineupTarget").textContent =
        spawn.target || "—";

    document.querySelector("#lineupNote").textContent =
        spawn.note || "Описание для этого lineup пока не добавлено.";

    renderLineupImages(spawn);

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function renderLineupImages(spawn) {
    const aimImages = getAimImages(spawn);
    const aim = document.querySelector("#lineupAim");
    const result = document.querySelector("#lineupResult");

    // Поддерживаем старую HTML-разметку: первый Aim показывается в #lineupAim.
    if (aimImages.length) {
        aim.src = aimImages[0];
        aim.alt = `${spawn.name || "Lineup"} — прицеливание 1`;
        aim.style.display = "";
    } else {
        aim.removeAttribute("src");
        aim.style.display = "none";
    }

    let gallery = document.querySelector("#lineupAimGallery");

    if (!gallery) {
        gallery = document.createElement("div");
        gallery.id = "lineupAimGallery";
        gallery.className = "lineup-aim-gallery";

        const aimParent = aim.parentElement;
        aimParent.appendChild(gallery);
    }

    gallery.innerHTML = "";

    // Если картинок несколько — выводим дополнительные кадры.
    aimImages.slice(1).forEach((src, index) => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = `${spawn.name || "Lineup"} — прицеливание ${index + 2}`;
        gallery.appendChild(img);
    });

    if (result) {
        if (spawn.resultImage) {
            result.src = spawn.resultImage;
            result.alt = `${spawn.name || "Lineup"} — результат`;
            result.style.display = "";
        } else {
            result.removeAttribute("src");
            result.style.display = "none";
        }
    }
}

function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function initFromUrl() {
    const path = window.location.hash
        .replace(/^#\/?/, "")
        .replace(/\/$/, "");

    const parts = path.split("/").filter(Boolean);

    if (!parts.length) {
        currentMapId = null;
        currentMap = null;
        currentSideId = null;
        currentSide = null;
        showPage(mapsPage);
        return;
    }

    const mapId = decodeURIComponent(parts[0]);

    if (!smokeData?.[mapId]) {
        showPage(mapsPage);
        return;
    }

    currentMapId = mapId;
    currentMap = smokeData[mapId];

    document.querySelector("#sideMapName").textContent =
        (currentMap.name || mapId).toUpperCase();

    renderSides();

    if (!parts[1]) {
        currentSideId = null;
        currentSide = null;
        showPage(sidePage);
        return;
    }

    const sideId = decodeURIComponent(parts[1]);

    if (!currentMap.sides?.[sideId]) {
        currentSideId = null;
        currentSide = null;
        showPage(sidePage);
        return;
    }

    currentSideId = sideId;
    currentSide = currentMap.sides[sideId];

    const spawns = getSpawns(currentSide);

    if (parts[2]) {
        const spawn = getSpawnById(currentSide, decodeURIComponent(parts[2]));

        if (spawn) {
            openLineup(spawn);
            return;
        }
    }

    renderSpawns();
    showPage(spawnsPage);
}

mapsGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-map]");
    if (!card) return;
    openMap(card.dataset.map);
});

sidesGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-side]");
    if (!card) return;
    openSide(card.dataset.side);
});

spawnPoints.addEventListener("click", (event) => {
    const button = event.target.closest("[data-spawn]");

    if (!button || !currentSide) return;

    const spawn = getSpawnById(
        currentSide,
        button.dataset.spawn
    );

    if (spawn) {
        navigate(`/${currentMapId}/${currentSideId}/${spawn.id}`);
        openLineup(spawn);
    }
});

modal.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close")) {
        closeModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        modal.classList.contains("is-open")
    ) {
        closeModal();
    }
});

document.querySelector("#backToMaps").addEventListener("click", () => {
    closeModal();
    navigate("/");
});

document.querySelector("#backToSide").addEventListener("click", () => {
    closeModal();

    if (currentMapId) {
        navigate(`/${currentMapId}`);
    } else {
        navigate("/");
    }
});

function escapeAttribute(value) {
    return escapeHtml(value);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.addEventListener("hashchange", initFromUrl);

renderMaps();
initFromUrl();
