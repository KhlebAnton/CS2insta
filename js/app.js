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
        (spawn) =>
            String(spawn.id) === String(id)
    );
}

function renderMaps() {
    const maps = Object.entries(
        smokeData || {}
    );

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
            <button
                class="map-card"
                data-map="${escapeHtml(id)}"
                type="button"
            >
                <span class="map-card__bg"></span>
                <span class="map-card__pattern"></span>

                <span class="map-card__content">
                    <span class="map-card__number">
                        ${String(index + 1).padStart(2, "0")} / MAP
                    </span>

                    <strong>
                        ${escapeHtml(map.name || id)}
                    </strong>

                    <small>
                        Instant smokes
                    </small>
                </span>

                <span class="map-card__arrow">
                    →
                </span>
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
            const label =
                side.label || id;

            const count =
                side.spawns?.length || 0;

            const isT =
                id.toLowerCase() === "t";

            const isCt =
                id.toLowerCase() === "ct";

            return `
                <button
                    class="side-card
                        ${isT ? "side-card_t" : ""}
                        ${isCt ? "side-card_ct" : ""}"
                    data-side="${escapeHtml(id)}"
                    type="button"
                >
                    <span class="side-card__number">
                        ${String(index + 1).padStart(2, "0")}
                    </span>

                    <strong>
                        ${escapeHtml(label)}
                    </strong>

                    <small>
                        ${count} ${getLineupWord(count)}
                    </small>

                    <i>→</i>
                </button>
            `;
        }
    ).join("");
}

function getLineupWord(count) {
    if (
        count % 10 === 1 &&
        count % 100 !== 11
    ) {
        return "lineup";
    }

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

    document.querySelector(
        "#sideMapName"
    ).textContent =
        (
            map.name ||
            id
        ).toUpperCase();

    renderSides();

    showPage(sidePage);

    if (updateUrl) {
        navigate(`/${id}`);
    }
}

function openSide(id, updateUrl = true) {
    if (!currentMap?.sides?.[id]) {
        renderSides();
        showPage(sidePage);
        return;
    }

    currentSideId = id;
    currentSide = currentMap.sides[id];

    renderSpawns();

    showPage(spawnsPage);

    if (updateUrl) {
        navigate(
            `/${currentMapId}/${id}`
        );
    }
}

function renderSpawns() {
    if (!currentMap || !currentSide) {
        return;
    }

    const side = currentSide;

    const spawns =
        side.spawns || [];

    document.querySelector(
        "#spawnEyebrow"
    ).textContent =
        `${(
            currentMap.name ||
            currentMapId
        ).toUpperCase()} / ${(
            side.label ||
            currentSideId
        ).toUpperCase()}`;

    document.querySelector(
        "#mapToolbarName"
    ).textContent =
        (
            currentMap.name ||
            currentMapId
        ).toUpperCase();

    document.querySelector(
        "#mapToolbarSide"
    ).textContent =
        (
            side.label ||
            currentSideId
        ).toUpperCase();

    document.querySelector(
        "#spawnCount"
    ).textContent =
        spawns.length;

    const image =
        document.querySelector(
            "#spawnMapImage"
        );

    // ВАЖНО:
    // карта теперь принадлежит текущей стороне.
    image.src =
        side.mapImage || "";

    image.alt =
        `${currentMap.name || currentMapId} ${
            side.label || currentSideId
        }`;

    spawnPoints.innerHTML =
        spawns.map(
            (spawn) => `
                <button
                    class="spawn-point"
                    style="
                        left:${Number(spawn.x) || 0}%;
                        top:${Number(spawn.y) || 0}%
                    "
                    data-spawn="${escapeHtml(spawn.id)}"
                    type="button"
                    aria-label="${escapeHtml(
                        spawn.name ||
                        `Spawn ${spawn.id}`
                    )}"
                >
                    ${escapeHtml(spawn.id)}
                    <span>SPAWN</span>
                </button>
            `
        ).join("");
}

function openLineup(spawn) {
    const mapName =
        currentMap.name ||
        currentMapId;

    const sideName =
        currentSide.label ||
        currentSideId;

    document.querySelector(
        "#lineupEyebrow"
    ).textContent =
        `${mapName.toUpperCase()} / ${sideName.toUpperCase()} SPAWN ${spawn.id}`;

    document.querySelector(
        "#lineupTitle"
    ).textContent =
        spawn.name ||
        `Spawn ${spawn.id}`;

    document.querySelector(
        "#lineupThrow"
    ).textContent =
        (
            spawn.throw ||
            "—"
        ).toUpperCase();

    document.querySelector(
        "#lineupPosition"
    ).textContent =
        spawn.position ||
        "—";

    document.querySelector(
        "#lineupMethod"
    ).textContent =
        spawn.throw ||
        "—";

    document.querySelector(
        "#lineupTarget"
    ).textContent =
        spawn.target ||
        "—";

    document.querySelector(
        "#lineupNote"
    ).textContent =
        spawn.note ||
        "Описание для этого lineup пока не добавлено.";

    const aim =
        document.querySelector(
            "#lineupAim"
        );

    const result =
        document.querySelector(
            "#lineupResult"
        );

    aim.src =
        spawn.aimImage ||
        "";

    result.src =
        spawn.resultImage ||
        "";

    aim.alt =
        `${spawn.name || "Lineup"} — прицеливание`;

    result.alt =
        `${spawn.name || "Lineup"} — результат`;

    modal.classList.add(
        "is-open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}

function closeModal() {
    modal.classList.remove(
        "is-open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}

function initFromUrl() {
    const path =
        window.location.hash
            .replace(/^#\/?/, "")
            .replace(/\/$/, "");

    const parts =
        path.split("/")
            .filter(Boolean);

    if (!parts.length) {
        currentMapId = null;
        currentMap = null;
        currentSideId = null;
        currentSide = null;

        showPage(mapsPage);
        return;
    }

    const mapId =
        decodeURIComponent(parts[0]);

    if (!smokeData?.[mapId]) {
        showPage(mapsPage);
        return;
    }

    currentMapId = mapId;
    currentMap =
        smokeData[mapId];

    document.querySelector(
        "#sideMapName"
    ).textContent =
        (
            currentMap.name ||
            mapId
        ).toUpperCase();

    renderSides();

    if (!parts[1]) {
        currentSideId = null;
        currentSide = null;

        showPage(sidePage);
        return;
    }

    const sideId =
        decodeURIComponent(parts[1]);

    if (
        !currentMap.sides?.[sideId]
    ) {
        currentSideId = null;
        currentSide = null;

        showPage(sidePage);
        return;
    }

    currentSideId = sideId;
    currentSide =
        currentMap.sides[sideId];

    renderSpawns();

    showPage(spawnsPage);
}

mapsGrid.addEventListener(
    "click",
    (event) => {
        const card =
            event.target.closest(
                "[data-map]"
            );

        if (!card) return;

        openMap(
            card.dataset.map
        );
    }
);

sidesGrid.addEventListener(
    "click",
    (event) => {
        const card =
            event.target.closest(
                "[data-side]"
            );

        if (!card) return;

        openSide(
            card.dataset.side
        );
    }
);

spawnPoints.addEventListener(
    "click",
    (event) => {
        const button =
            event.target.closest(
                "[data-spawn]"
            );

        if (
            !button ||
            !currentSide
        ) {
            return;
        }

        const spawn =
            getSpawnById(
                currentSide,
                button.dataset.spawn
            );

        if (spawn) {
            openLineup(spawn);
        }
    }
);

modal.addEventListener(
    "click",
    (event) => {
        if (
            event.target.hasAttribute(
                "data-close"
            )
        ) {
            closeModal();
        }
    }
);

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape" &&
            modal.classList.contains(
                "is-open"
            )
        ) {
            closeModal();
        }
    }
);

document.querySelector(
    "#backToMaps"
).addEventListener(
    "click",
    () => {
        closeModal();
        navigate("/");
    }
);

document.querySelector(
    "#backToSide"
).addEventListener(
    "click",
    () => {
        closeModal();

        if (currentMapId) {
            navigate(
                `/${currentMapId}`
            );
        } else {
            navigate("/");
        }
    }
);

function escapeHtml(value) {
    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

window.addEventListener(
    "hashchange",
    initFromUrl
);

renderMaps();
initFromUrl();
