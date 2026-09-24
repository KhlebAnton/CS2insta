const state = {
    data: {},
    mapId: null,
    sideId: null,
    spawnId: null,
    mapFileData: null,
    aimFileData: null,
    resultFileData: null
};

const $ = (s) => document.querySelector(s);

const mapsList = $("#mapsList");
const sidesList = $("#sidesList");
const spawnsList = $("#spawnsList");
const mapStage = $("#mapStage");

function slug(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/gi, "-")
        .replace(/^-|-$/g, "");
}

function getMap() {
    return state.data[state.mapId] || null;
}

function getSide() {
    return getMap()?.sides?.[state.sideId] || null;
}

function getSpawn() {
    return getSide()?.spawns?.find(
        (spawn) => String(spawn.id) === String(state.spawnId)
    ) || null;
}

function renderAll() {
    renderMaps();
    renderSides();
    renderSpawns();
    renderEditor();
}

function renderMaps() {
    const entries = Object.entries(state.data);

    mapsList.innerHTML = entries.length
        ? entries.map(([id, map]) => `
            <button class="list-item ${id === state.mapId ? "active" : ""}"
                    data-map="${escapeHtml(id)}">
                <div>
                    <b>${escapeHtml(map.name || id)}</b>
                    <small>${escapeHtml(id)}</small>
                </div>
                <span>→</span>
            </button>
        `).join("")
        : `<div class="empty-map" style="padding:14px">Нет карт</div>`;
}

function renderSides() {
    const map = getMap();

    if (!map) {
        sidesList.innerHTML =
            `<div class="empty-map" style="padding:14px">Выберите карту</div>`;
        return;
    }

    const entries = Object.entries(map.sides || {});

    sidesList.innerHTML = entries.length
        ? entries.map(([id, side]) => `
            <button class="list-item ${id === state.sideId ? "active" : ""}"
                    data-side="${escapeHtml(id)}">
                <div>
                    <b>${escapeHtml(side.label || id)}</b>
                    <small>${escapeHtml(id)} · ${(side.spawns || []).length} точек</small>
                </div>
                <span>→</span>
            </button>
        `).join("")
        : `<div class="empty-map" style="padding:14px">Нет сторон / мест</div>`;
}

function renderSpawns() {
    const side = getSide();

    if (!side) {
        spawnsList.innerHTML =
            `<div class="empty-map" style="padding:14px">Выберите сторону</div>`;
        return;
    }

    const entries = side.spawns || [];

    spawnsList.innerHTML = entries.length
        ? entries.map((spawn) => `
            <button class="list-item ${String(spawn.id) === String(state.spawnId) ? "active" : ""}"
                    data-spawn="${escapeHtml(spawn.id)}">
                <div>
                    <b>${escapeHtml(spawn.name || "Без названия")}</b>
                    <small>#${escapeHtml(spawn.id)} · ${Number(spawn.x).toFixed(2)}%, ${Number(spawn.y).toFixed(2)}%</small>
                </div>
                <span>→</span>
            </button>
        `).join("")
        : `<div class="empty-map" style="padding:14px">Нет точек</div>`;
}

function renderEditor() {
    const map = getMap();
    const side = getSide();
    const spawn = getSpawn();

    $("#workspaceEyebrow").textContent =
        map
            ? `${map.name || state.mapId}${side ? " / " + (side.label || state.sideId) : ""}`
            : "ВЫБЕРИТЕ КАРТУ";

    $("#workspaceTitle").textContent =
        spawn?.name || side?.label || map?.name || "Карта";

    $("#deleteCurrentBtn").style.display =
        (spawn || side || map) ? "" : "none";

    // Общие данные карты.
    $("#mapIdInput").value = state.mapId || "";
    $("#mapNameInput").value = map?.name || "";

    // Теперь изображение принадлежит SIDE.
    $("#mapImagePathInput").value = side?.mapImage || "";

    // Side.
    $("#sideIdInput").value = state.sideId || "";
    $("#sideLabelInput").value = side?.label || "";

    // Spawn.
    $("#nameInput").value = spawn?.name || "";
    $("#xInput").value = spawn?.x ?? "";
    $("#yInput").value = spawn?.y ?? "";
    $("#throwInput").value = spawn?.throw || "";
    $("#targetInput").value = spawn?.target || "";
    $("#positionInput").value = spawn?.position || "";
    $("#noteInput").value = spawn?.note || "";

    $("#aimPathInput").value = spawn?.aimImage || "";
    $("#resultPathInput").value = spawn?.resultImage || "";

    $("#mapImageName").textContent =
        state.mapFileData ? state.mapFileData.name : "Файл не выбран";

    $("#aimImageName").textContent =
        state.aimFileData ? state.aimFileData.name : "Файл не выбран";

    $("#resultImageName").textContent =
        state.resultFileData ? state.resultFileData.name : "Файл не выбран";

    renderMapStage();
}

function renderMapStage() {
    const side = getSide();

    if (!side) {
        mapStage.innerHTML =
            `<div class="empty-map">Сначала выбери или создай место</div>`;
        return;
    }

    const src = state.mapFileData?.data || side.mapImage;

    if (!src) {
        mapStage.innerHTML = `
            <div class="empty-map">
                У этого места нет изображения карты.<br>
                Выбери файл справа.
            </div>
        `;
        return;
    }

    mapStage.innerHTML = `
        <img id="editorMapImage" src="${escapeAttribute(src)}" alt="">
    `;

    (side.spawns || []).forEach((spawn) => {
        const marker = document.createElement("button");

        marker.type = "button";
        marker.className =
            "marker" +
            (String(spawn.id) === String(state.spawnId) ? " active" : "");

        marker.style.left = `${Number(spawn.x) || 0}%`;
        marker.style.top = `${Number(spawn.y) || 0}%`;

        marker.innerHTML = `
            ${escapeHtml(spawn.id)}
            <span>${escapeHtml(spawn.name || "")}</span>
        `;

        marker.addEventListener("click", (event) => {
            event.stopPropagation();
            selectSpawn(spawn.id);
        });

        mapStage.appendChild(marker);
    });

    $("#editorMapImage").addEventListener("click", (event) => {
        const rect = event.currentTarget.getBoundingClientRect();

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        createOrMoveSpawn(x, y);
    });
}

function selectMap(id) {
    state.mapId = id;
    state.sideId = null;
    state.spawnId = null;
    clearFileState();
    renderAll();
}

function selectSide(id) {
    state.sideId = id;
    state.spawnId = null;
    clearFileState();
    renderAll();
}

function selectSpawn(id) {
    state.spawnId = id;
    clearFileState();
    renderAll();
}

function addMap() {
    const id = prompt("ID карты, например: mirage");

    if (!id) return;

    const clean = slug(id);

    if (!clean) return;

    if (state.data[clean]) {
        alert("Такая карта уже существует.");
        return;
    }

    const name =
        prompt("Название карты:", id) || id;

    state.data[clean] = {
        name,
        sides: {}
    };

    state.mapId = clean;
    state.sideId = null;
    state.spawnId = null;

    renderAll();
}

function addSide() {
    const map = getMap();

    if (!map) {
        alert("Сначала выбери карту.");
        return;
    }

    const id = prompt(
        "ID стороны / места:\nнапример: t, ct, mid, a-site, b-site"
    );

    if (!id) return;

    const clean = slug(id);

    if (map.sides[clean]) {
        alert("Такое место уже существует.");
        return;
    }

    const label =
        prompt("Название:", id.toUpperCase()) ||
        id.toUpperCase();

    map.sides[clean] = {
        label,
        mapImage: "",
        spawns: []
    };

    state.sideId = clean;
    state.spawnId = null;

    renderAll();
}

function addSpawn() {
    const side = getSide();

    if (!side) {
        alert("Сначала выбери сторону / место.");
        return;
    }

    if (!side.mapImage && !state.mapFileData) {
        alert(
            "Сначала добавь изображение карты для этого места."
        );
        return;
    }

    const id = nextSpawnId(side);

    side.spawns.push({
        id,
        name: "Новая точка",
        x: 50,
        y: 50,
        throw: "Jumpthrow",
        target: "",
        position: "",
        aimImage: "",
        resultImage: "",
        note: ""
    });

    state.spawnId = id;

    renderAll();
}

function nextSpawnId(side) {
    return (side.spawns || []).reduce(
        (max, spawn) =>
            Math.max(max, Number(spawn.id) || 0),
        0
    ) + 1;
}

function createOrMoveSpawn(x, y) {
    const side = getSide();

    if (!side) {
        alert("Сначала создай/выбери место.");
        return;
    }

    let spawn = getSpawn();

    if (!spawn) {
        const id = nextSpawnId(side);

        spawn = {
            id,
            name: "Новая точка",
            x,
            y,
            throw: "Jumpthrow",
            target: "",
            position: "",
            aimImage: "",
            resultImage: "",
            note: ""
        };

        side.spawns.push(spawn);
        state.spawnId = id;
    } else {
        spawn.x = +x.toFixed(2);
        spawn.y = +y.toFixed(2);
    }

    renderAll();
}

function saveForm() {
    const map = getMap();

    if (!map) {
        alert("Нет выбранной карты.");
        return;
    }

    const newMapId =
        slug($("#mapIdInput").value || state.mapId);

    if (!newMapId) {
        alert("Укажи ID карты.");
        return;
    }

    if (
        newMapId !== state.mapId &&
        state.data[newMapId]
    ) {
        alert("Этот ID карты уже занят.");
        return;
    }

    if (newMapId !== state.mapId) {
        state.data[newMapId] = map;
        delete state.data[state.mapId];
        state.mapId = newMapId;
    }

    map.name =
        $("#mapNameInput").value.trim() ||
        state.mapId;

    const side = getSide();

    if (!side) {
        renderAll();
        alert("Карта сохранена.");
        return;
    }

    // Главное изменение:
    // изображение сохраняется в SIDE, а не в MAP.
    side.label =
        $("#sideLabelInput").value.trim() ||
        state.sideId;

    if (state.mapFileData) {
        side.mapImage = state.mapFileData.data;
    } else {
        side.mapImage =
            $("#mapImagePathInput").value.trim();
    }

    const spawn = getSpawn();

    if (spawn) {
        spawn.name =
            $("#nameInput").value.trim() ||
            "Новая точка";

        spawn.x = Number($("#xInput").value) || 0;
        spawn.y = Number($("#yInput").value) || 0;

        spawn.throw =
            $("#throwInput").value.trim();

        spawn.target =
            $("#targetInput").value.trim();

        spawn.position =
            $("#positionInput").value.trim();

        spawn.note =
            $("#noteInput").value.trim();

        spawn.aimImage =
            $("#aimPathInput").value.trim();

        spawn.resultImage =
            $("#resultPathInput").value.trim();

        if (state.aimFileData) {
            spawn.aimImage =
                state.aimFileData.data;
        }

        if (state.resultFileData) {
            spawn.resultImage =
                state.resultFileData.data;
        }
    }

    clearFileState();
    renderAll();

    alert(
        "Сохранено. Теперь нажми «Скачать data.js»."
    );
}

function deleteCurrent() {
    const spawn = getSpawn();
    const side = getSide();
    const map = getMap();

    if (spawn && side) {
        if (!confirm("Удалить эту точку?")) return;

        side.spawns =
            side.spawns.filter(
                (item) =>
                    String(item.id) !==
                    String(state.spawnId)
            );

        state.spawnId = null;
    } else if (side && map) {
        if (!confirm("Удалить это место / сторону?")) return;

        delete map.sides[state.sideId];

        state.sideId = null;
        state.spawnId = null;
    } else if (map) {
        if (!confirm("Удалить карту целиком?")) return;

        delete state.data[state.mapId];

        state.mapId = null;
        state.sideId = null;
        state.spawnId = null;
    }

    renderAll();
}

function readFile(file, setter, nameElement) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        setter({
            data: reader.result,
            name: file.name
        });

        $(nameElement).textContent = file.name;
    };

    reader.readAsDataURL(file);
}

function clearFileState() {
    state.mapFileData = null;
    state.aimFileData = null;
    state.resultFileData = null;
}

function dataToJs() {
    return `/* Generated by CS2 Insta Smokes Admin */\nconst smokeData = ${JSON.stringify(state.data, null, 4)};\n`;
}

function download(filename, content) {
    const blob = new Blob(
        [content],
        { type: "text/javascript;charset=utf-8" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    setTimeout(
        () => URL.revokeObjectURL(link.href),
        1000
    );
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

$("#mapsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-map]");

    if (button) {
        selectMap(button.dataset.map);
    }
});

$("#sidesList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-side]");

    if (button) {
        selectSide(button.dataset.side);
    }
});

$("#spawnsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-spawn]");

    if (button) {
        selectSpawn(button.dataset.spawn);
    }
});

$("#addMapBtn").onclick = addMap;
$("#addSideBtn").onclick = addSide;
$("#addSpawnBtn").onclick = addSpawn;
$("#saveBtn").onclick = saveForm;
$("#deleteCurrentBtn").onclick = deleteCurrent;

$("#exportBtn").onclick = () => {
    download("data.js", dataToJs());
};

$("#importBtn").onclick = () => {
    $("#importFile").click();
};

$("#importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const text = await file.text();

    const match =
        text.match(
            /const\s+smokeData\s*=\s*([\s\S]*?);\s*$/
        );

    let imported = null;

    if (match) {
        try {
            imported = Function(
                `"use strict"; return (${match[1]})`
            )();
        } catch (error) {
            console.error(error);
        }
    }

    if (!imported) {
        try {
            imported = JSON.parse(text);
        } catch (error) {
            console.error(error);
        }
    }

    if (
        !imported ||
        typeof imported !== "object"
    ) {
        alert("Не удалось прочитать data.js.");
        return;
    }

    // Миграция старого формата:
    // map.mapImage -> каждый side.mapImage
    Object.values(imported).forEach((map) => {
        if (
            map.mapImage &&
            map.sides
        ) {
            Object.values(map.sides).forEach((side) => {
                if (!side.mapImage) {
                    side.mapImage = map.mapImage;
                }
            });

            delete map.mapImage;
        }

        Object.values(map.sides || {}).forEach((side) => {
            if (!Array.isArray(side.spawns)) {
                side.spawns = [];
            }

            if (!side.mapImage) {
                side.mapImage = "";
            }
        });
    });

    state.data = imported;
    state.mapId = null;
    state.sideId = null;
    state.spawnId = null;

    renderAll();

    alert(
        "data.js импортирован. Старый mapImage автоматически перенесён в стороны."
    );
});

$("#mapImageInput").addEventListener(
    "change",
    (event) => {
        readFile(
            event.target.files[0],
            (value) => {
                state.mapFileData = value;
                renderMapStage();
            },
            "#mapImageName"
        );
    }
);

$("#aimImageInput").addEventListener(
    "change",
    (event) => {
        readFile(
            event.target.files[0],
            (value) => {
                state.aimFileData = value;
            },
            "#aimImageName"
        );
    }
);

$("#resultImageInput").addEventListener(
    "change",
    (event) => {
        readFile(
            event.target.files[0],
            (value) => {
                state.resultFileData = value;
            },
            "#resultImageName"
        );
    }
);

state.data = {};
renderAll();
