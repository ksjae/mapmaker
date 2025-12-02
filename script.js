document.addEventListener('DOMContentLoaded', () => {
    const GRID_COLS = 35;
    const GRID_ROWS = 30;

    // State
    const state = {
        tool: 'wall', // 'wall', 'floor', 'eraser', 'icon'
        floorColor: 'green', // 'green', 'red', 'yellow', 'blue'
        isDrawing: false,
        grid: Array(GRID_ROWS).fill().map(() => Array(GRID_COLS).fill(null)), // Stores icon IDs
        vWalls: Array(GRID_ROWS).fill().map(() => Array(GRID_COLS + 1).fill(false)),
        hWalls: Array(GRID_ROWS + 1).fill().map(() => Array(GRID_COLS).fill(false)),
        floors: Array(GRID_ROWS).fill().map(() => Array(GRID_COLS).fill(null)), // Stores color strings
        lastMouseX: 0,
        lastMouseY: 0,
        mouseHistory: [] // Stores {x, y, time}
    };

    // DOM Elements
    const gridContainer = document.getElementById('grid-container');
    const colHeaders = document.getElementById('col-headers');
    const rowHeaders = document.getElementById('row-headers');
    const iconPalette = document.getElementById('icon-palette');
    const toolBtns = document.querySelectorAll('.tool-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Icon List
    const icons = [
        "0.png", "1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png", "9.png",
        "Alphabet E.png", "Closed Door.png", "Debris.png", "Door.png", "Down stairs.png", "Exclamation.png",
        "Hand.png", "O.png", "Question.png", "Treasure Chest.png", "Up stairs.png", "X.png",
        "axis.png", "boat.png", "bonfire.png", "bridgedown.png", "bridgeleft.png", "bridgeright.png", "bridgeup.png",
        "bug.png", "chestopen.png", "crystal.png", "down.png", "eo.png", "fishing.png", "floating bridge.png",
        "golem.png", "harvest.png", "hole.png", "holetrap.png", "ice.png", "jumpdown.png", "jumpup.png",
        "ladder.png", "left.png", "leftrightblue.png", "leftrightyellow.png", "lever.png", "monster.png",
        "pedestaldown.png", "pedestalup.png", "pick.png", "portal.png", "quest.png", "right.png", "rock.png",
        "scale.png", "shear.png", "sign.png", "stone.png", "switch.png", "tent.png", "tombstone.png",
        "twinkle.png", "up.png", "updownblue.png", "updownyellow.png", "wallgimmick.png", "marker.webp"
    ];

    // Initialization
    function init() {
        createGrid();
        createHeaders();
        loadIcons();
        setupEventListeners();
    }

    function createHeaders() {
        // Columns: 1 to 7 (each covers 5 cells)
        for (let i = 1; i <= 7; i++) {
            const el = document.createElement('div');
            el.className = 'col-header';
            el.textContent = i;
            colHeaders.appendChild(el);
        }
        // Rows: A to F (each covers 5 cells)
        const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
        for (let i = 0; i < 6; i++) {
            const el = document.createElement('div');
            el.className = 'row-header';
            el.textContent = rowLabels[i];
            rowHeaders.appendChild(el);
        }
    }

    function createGrid() {
        gridContainer.style.setProperty('--grid-cols', GRID_COLS);
        gridContainer.style.setProperty('--grid-rows', GRID_ROWS);

        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                cell.addEventListener('dragover', (e) => e.preventDefault());
                cell.addEventListener('drop', handleDrop);
                cell.addEventListener('mousedown', handleCellClick);
                cell.addEventListener('mouseenter', handleCellEnter);

                gridContainer.appendChild(cell);

                const hWall = document.createElement('div');
                hWall.className = 'h-wall';
                hWall.dataset.r = r;
                hWall.dataset.c = c;
                hWall.dataset.type = 'h';
                cell.appendChild(hWall);

                const vWall = document.createElement('div');
                vWall.className = 'v-wall';
                vWall.dataset.r = r;
                vWall.dataset.c = c;
                vWall.dataset.type = 'v';
                cell.appendChild(vWall);

                if (c === GRID_COLS - 1) {
                    const vWallRight = document.createElement('div');
                    vWallRight.className = 'v-wall';
                    vWallRight.style.left = 'auto';
                    vWallRight.style.right = '-3px';
                    vWallRight.dataset.r = r;
                    vWallRight.dataset.c = c + 1;
                    vWallRight.dataset.type = 'v';
                    cell.appendChild(vWallRight);
                }

                if (r === GRID_ROWS - 1) {
                    const hWallBottom = document.createElement('div');
                    hWallBottom.className = 'h-wall';
                    hWallBottom.style.top = 'auto';
                    hWallBottom.style.bottom = '-3px';
                    hWallBottom.dataset.r = r + 1;
                    hWallBottom.dataset.c = c;
                    hWallBottom.dataset.type = 'h';
                    cell.appendChild(hWallBottom);
                }
            }
        }
    }

    function loadIcons() {
        icons.forEach(iconName => {
            const div = document.createElement('div');
            div.className = 'palette-icon';
            div.draggable = true;

            const img = document.createElement('img');
            img.src = `icon/${iconName}`;
            img.alt = iconName;

            div.appendChild(img);
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'new',
                    name: iconName
                }));
                // Don't switch tool here, keep current tool or just let drop handle it
            });

            iconPalette.appendChild(div);
        });
    }

    function setupEventListeners() {
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (btn.id.startsWith('tool-floor-')) {
                    state.tool = 'floor';
                    state.floorColor = btn.dataset.color;
                } else {
                    state.tool = btn.id.replace('tool-', '');
                }
            });
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const tabId = btn.dataset.tab;
                document.getElementById(`${tabId}-panel`).classList.add('active');
            });
        });

        document.addEventListener('mouseup', () => {
            state.isDrawing = false;
        });

        document.addEventListener('mousemove', (e) => {
            state.lastMouseX = e.clientX;
            state.lastMouseY = e.clientY;

            // Add to history
            const now = Date.now();
            state.mouseHistory.push({ x: e.clientX, y: e.clientY, time: now });

            // Keep only recent history (last 10 points or 100ms)
            if (state.mouseHistory.length > 10) {
                state.mouseHistory.shift();
            }
            // Also prune old points
            state.mouseHistory = state.mouseHistory.filter(p => now - p.time < 150);
        });

        gridContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('v-wall') || e.target.classList.contains('h-wall')) {
                state.isDrawing = true;
                toggleWall(e.target, e);
            }
        });

        gridContainer.addEventListener('mouseover', (e) => {
            if (!state.isDrawing) return;

            if (state.tool === 'wall' || state.tool === 'eraser') {
                if (e.target.classList.contains('v-wall') || e.target.classList.contains('h-wall')) {
                    toggleWall(e.target, e);
                }
            }
        });
    }

    function toggleWall(el, event) {
        const r = parseInt(el.dataset.r);
        const c = parseInt(el.dataset.c);
        const type = el.dataset.type;

        // Deadzone check
        if (event) {
            const rect = el.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const DEADZONE = -4; // pixels from edge

            if (type === 'v') {
                // Vertical wall: check top and bottom edges
                if (y < DEADZONE || y > rect.height - DEADZONE) return;
            } else if (type === 'h') {
                // Horizontal wall: check left and right edges
                if (x < DEADZONE || x > rect.width - DEADZONE) return;
            }

            // Axis locking with trajectory
            if (state.isDrawing && state.tool === 'wall' && state.mouseHistory.length > 1) {
                // Calculate total delta from history
                const first = state.mouseHistory[0];
                const last = state.mouseHistory[state.mouseHistory.length - 1];
                const dx = Math.abs(last.x - first.x);
                const dy = Math.abs(last.y - first.y);

                // If moving significantly more in one direction, lock to that axis
                // Using 1.5 factor for stronger locking
                if (dx > dy * 1.5) { // Horizontal movement
                    if (type === 'v') return; // Ignore vertical walls
                } else if (dy > dx * 1.5) { // Vertical movement
                    if (type === 'h') return; // Ignore horizontal walls
                }
            }
        }

        const isEraser = state.tool === 'eraser';

        if (state.tool === 'wall' || isEraser) {
            const shouldBeActive = !isEraser;

            if (shouldBeActive) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }

            if (type === 'v') state.vWalls[r][c] = shouldBeActive;
            if (type === 'h') state.hWalls[r][c] = shouldBeActive;
        }
    }

    function handleCellClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        if (state.tool === 'floor') {
            state.isDrawing = true;
            paintFloor(cell);
        } else if (state.tool === 'eraser') {
            state.isDrawing = true;
            eraseCell(cell);
        }
    }

    function handleCellEnter(e) {
        if (!state.isDrawing) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;

        if (state.tool === 'floor') {
            paintFloor(cell);
        } else if (state.tool === 'eraser') {
            eraseCell(cell);
        }
    }

    function paintFloor(cell) {
        const r = cell.dataset.r;
        const c = cell.dataset.c;

        // Remove existing floor classes
        cell.classList.remove('floor-green', 'floor-red', 'floor-yellow', 'floor-blue');

        // Add new color
        cell.classList.add(`floor-${state.floorColor}`);
        state.floors[r][c] = state.floorColor;
    }

    function eraseCell(cell) {
        const r = cell.dataset.r;
        const c = cell.dataset.c;

        // Erase Floor
        cell.classList.remove('floor-green', 'floor-red', 'floor-yellow', 'floor-blue');
        state.floors[r][c] = null;

        // Erase Icon
        const img = cell.querySelector('img');
        if (img) {
            img.remove();
            state.grid[r][c] = null;
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const dataRaw = e.dataTransfer.getData('application/json');
        if (!dataRaw) return;

        const data = JSON.parse(dataRaw);
        const cell = e.target.closest('.cell');

        if (cell) {
            const r = parseInt(cell.dataset.r);
            const c = parseInt(cell.dataset.c);

            // If moving from another cell, clear source
            if (data.type === 'move') {
                const srcR = data.r;
                const srcC = data.c;

                // Clear source cell visual
                const srcCell = document.querySelector(`.cell[data-r="${srcR}"][data-c="${srcC}"]`);
                if (srcCell) {
                    const srcImg = srcCell.querySelector('img');
                    if (srcImg) srcImg.remove();
                }
                state.grid[srcR][srcC] = null;
            }

            // Place in new cell
            // Remove existing icon if any
            const existing = cell.querySelector('img');
            if (existing) existing.remove();

            const img = document.createElement('img');
            img.src = `icon/${data.name}`;
            img.draggable = true;

            // Add drag start for this new icon instance
            img.addEventListener('dragstart', (ev) => {
                ev.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'move',
                    name: data.name,
                    r: r,
                    c: c
                }));
                ev.stopPropagation(); // Prevent cell drag issues
            });

            cell.appendChild(img);
            state.grid[r][c] = data.name;
        }
    }

    init();
});
