// Paris Tactical RPG 3D - Game Logic
// Isometric 3D tactical game using Three.js

// Game constants
const GRID_SIZE = 2;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const TILE_HEIGHT = 0.1;
const UNIT_HEIGHT = 1.5;

// Enums
const TileType = {
    EMPTY: 0,
    WALL: 1,
    FULL_COVER: 2,
    HALF_COVER: 3,
    FIRE: 4,
    SMOKE: 5
};

const UnitType = {
    RIOTER_BRAWLER: 0,
    RIOTER_MOLOTOV: 1,
    RIOTER_LEADER: 2,
    RIOTER_MEDIC: 3,
    RIOTER_HACKER: 4,
    RIOTER_SHIELD: 5,
    POLICE_OFFICER: 6,
    POLICE_SHIELD: 7,
    POLICE_SNIPER: 8,
    POLICE_TEARGAS: 9,
    POLICE_DRONE: 10
};

const Faction = {
    RIOTER: 0,
    POLICE: 1
};

// Global game state
let scene, camera, renderer, raycaster, mouse;
let gameMap, units = [];
let selectedUnit = null;
let currentFaction = Faction.RIOTER;
let turnNumber = 1;
let gameState = 'playing';
let combatLog = [];

// Attack targeting state
let attackMode = false;
let targetingMode = null; // 'attack', 'ability'
let validTargets = [];

// 3D objects
let mapGroup, unitsGroup, effectsGroup, highlightGroup;
let gridHelper, tiles = [];

// Materials
let materials = {};

// Camera and controls
let cameraTarget = new THREE.Vector3(MAP_WIDTH, 0, MAP_HEIGHT / 2);
let cameraDistance = 25;
let cameraAngle = 0;

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    
    distanceTo(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }
    
    toVector3() {
        return new THREE.Vector3(this.x * GRID_SIZE, 0, this.y * GRID_SIZE);
    }
}

class Tile {
    constructor(type = TileType.EMPTY) {
        this.type = type;
        this.unit = null;
        this.mesh = null;
        this.effects = [];
    }
    
    isPassable() {
        return [TileType.EMPTY, TileType.HALF_COVER, TileType.FIRE, TileType.SMOKE].includes(this.type) && !this.unit;
    }
    
    providesCover() {
        if (this.type === TileType.FULL_COVER) return 0.5;
        if (this.type === TileType.HALF_COVER) return 0.25;
        return 0.0;
    }
}

class Unit {
    constructor(type, position, faction) {
        this.type = type;
        this.position = position;
        this.faction = faction;
        this.maxHp = this.getMaxHp();
        this.hp = this.maxHp;
        this.maxAp = 2;
        this.ap = this.maxAp;
        this.damage = this.getDamage();
        this.range = this.getRange();
        this.moveRange = this.getMoveRange();
        this.alive = true;
        this.mesh = null;
        this.healthBar = null;
        this.isAnimating = false;
    }
    
    getMaxHp() {
        const hpMap = {
            [UnitType.RIOTER_BRAWLER]: 120,
            [UnitType.RIOTER_MOLOTOV]: 80,
            [UnitType.RIOTER_LEADER]: 100,
            [UnitType.RIOTER_MEDIC]: 70,
            [UnitType.RIOTER_HACKER]: 75,
            [UnitType.RIOTER_SHIELD]: 130,
            [UnitType.POLICE_OFFICER]: 100,
            [UnitType.POLICE_SHIELD]: 140,
            [UnitType.POLICE_SNIPER]: 80,
            [UnitType.POLICE_TEARGAS]: 90,
            [UnitType.POLICE_DRONE]: 60
        };
        return hpMap[this.type] || 100;
    }
    
    getDamage() {
        const damageMap = {
            [UnitType.RIOTER_BRAWLER]: 45,
            [UnitType.RIOTER_MOLOTOV]: 60,
            [UnitType.RIOTER_LEADER]: 35,
            [UnitType.RIOTER_MEDIC]: 25,
            [UnitType.RIOTER_HACKER]: 30,
            [UnitType.RIOTER_SHIELD]: 40,
            [UnitType.POLICE_OFFICER]: 50,
            [UnitType.POLICE_SHIELD]: 35,
            [UnitType.POLICE_SNIPER]: 80,
            [UnitType.POLICE_TEARGAS]: 40,
            [UnitType.POLICE_DRONE]: 25
        };
        return damageMap[this.type] || 40;
    }
    
    getRange() {
        const rangeMap = {
            [UnitType.RIOTER_BRAWLER]: 1,
            [UnitType.RIOTER_MOLOTOV]: 4,
            [UnitType.RIOTER_LEADER]: 3,
            [UnitType.RIOTER_MEDIC]: 2,
            [UnitType.RIOTER_HACKER]: 2,
            [UnitType.RIOTER_SHIELD]: 1,
            [UnitType.POLICE_OFFICER]: 4,
            [UnitType.POLICE_SHIELD]: 1,
            [UnitType.POLICE_SNIPER]: 8,
            [UnitType.POLICE_TEARGAS]: 5,
            [UnitType.POLICE_DRONE]: 3
        };
        return rangeMap[this.type] || 3;
    }
    
    getMoveRange() {
        return this.type === UnitType.RIOTER_BRAWLER ? 4 : 3;
    }
    
    getName() {
        const nameMap = {
            [UnitType.RIOTER_BRAWLER]: "Brawler",
            [UnitType.RIOTER_MOLOTOV]: "Molotov",
            [UnitType.RIOTER_LEADER]: "Leader",
            [UnitType.RIOTER_MEDIC]: "Medic",
            [UnitType.RIOTER_HACKER]: "Hacker",
            [UnitType.RIOTER_SHIELD]: "Shield",
            [UnitType.POLICE_OFFICER]: "Officer",
            [UnitType.POLICE_SHIELD]: "Shield Police",
            [UnitType.POLICE_SNIPER]: "Sniper",
            [UnitType.POLICE_TEARGAS]: "Teargas",
            [UnitType.POLICE_DRONE]: "Drone Op"
        };
        return nameMap[this.type] || "Unit";
    }
    
    getColor() {
        if (this.faction === Faction.RIOTER) {
            const colorMap = {
                [UnitType.RIOTER_BRAWLER]: 0xCC3333,
                [UnitType.RIOTER_MOLOTOV]: 0xFF6600,
                [UnitType.RIOTER_LEADER]: 0xFFD700,
                [UnitType.RIOTER_MEDIC]: 0x33CC33,
                [UnitType.RIOTER_HACKER]: 0x8800CC,
                [UnitType.RIOTER_SHIELD]: 0xC0C0C0
            };
            return colorMap[this.type] || 0xFF3333;
        } else {
            const colorMap = {
                [UnitType.POLICE_OFFICER]: 0x000080,
                [UnitType.POLICE_SHIELD]: 0x0000AA,
                [UnitType.POLICE_SNIPER]: 0x3366FF,
                [UnitType.POLICE_TEARGAS]: 0x808080,
                [UnitType.POLICE_DRONE]: 0xC0C0C0
            };
            return colorMap[this.type] || 0x3333FF;
        }
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        this.updateHealthBar();
    }
    
    resetAp() {
        this.ap = this.maxAp;
    }
    
    canAttack(targetPos) {
        if (this.ap < 1) return false;
        const distance = this.position.distanceTo(targetPos);
        return distance <= this.range && this.hasLineOfSight(targetPos);
    }
    
    hasLineOfSight(targetPos) {
        const dx = targetPos.x - this.position.x;
        const dy = targetPos.y - this.position.y;
        
        if (dx === 0 && dy === 0) return false;
        
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        if (steps === 0) return true;
        
        const stepX = dx / steps;
        const stepY = dy / steps;
        
        for (let i = 1; i < steps; i++) {
            const checkX = Math.floor(this.position.x + stepX * i);
            const checkY = Math.floor(this.position.y + stepY * i);
            
            if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                if (gameMap.tiles[checkY][checkX].type === TileType.WALL) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    updateHealthBar() {
        if (this.healthBar) {
            const healthPercentage = this.hp / this.maxHp;
            this.healthBar.scale.x = healthPercentage;
            
            // Color based on health
            if (healthPercentage > 0.6) {
                this.healthBar.material.color.setHex(0x00ff00);
            } else if (healthPercentage > 0.3) {
                this.healthBar.material.color.setHex(0xffff00);
            } else {
                this.healthBar.material.color.setHex(0xff0000);
            }
        }
    }
}

class GameMap {
    constructor() {
        this.tiles = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.tiles[y][x] = new Tile();
            }
        }
        this.generateParisianStreet();
    }
    
    generateParisianStreet() {
        // Add walls around the perimeter
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                    this.tiles[y][x].type = TileType.WALL;
                }
            }
        }
        
        // Add cover elements (Parisian street features)
        const coverPositions = [
            [3, 3, TileType.FULL_COVER],   // Barricade
            [7, 5, TileType.HALF_COVER],   // Café table
            [12, 8, TileType.FULL_COVER],  // Overturned car
            [15, 4, TileType.HALF_COVER],  // Bus stop
            [5, 10, TileType.FULL_COVER],  // Metro entrance
            [10, 12, TileType.HALF_COVER], // Fountain
            [8, 8, TileType.HALF_COVER],   // Lamppost
            [6, 7, TileType.HALF_COVER],   // Café chairs
            [14, 6, TileType.FULL_COVER],  // Police barrier
            [9, 4, TileType.HALF_COVER]    // Newspaper stand
        ];
        
        coverPositions.forEach(([x, y, type]) => {
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                this.tiles[y][x].type = type;
            }
        });
    }
    
    isValidPosition(pos) {
        return pos.x >= 0 && pos.x < MAP_WIDTH && pos.y >= 0 && pos.y < MAP_HEIGHT;
    }
    
    getTile(pos) {
        if (this.isValidPosition(pos)) {
            return this.tiles[pos.y][pos.x];
        }
        return null;
    }
    
    canMoveTo(pos) {
        const tile = this.getTile(pos);
        return tile && tile.isPassable();
    }
    
    addUnit(unit) {
        if (this.canMoveTo(unit.position)) {
            units.push(unit);
            this.tiles[unit.position.y][unit.position.x].unit = unit;
            return true;
        }
        return false;
    }
    
    moveUnit(unit, newPos) {
        if (this.canMoveTo(newPos)) {
            // Clear old position
            this.tiles[unit.position.y][unit.position.x].unit = null;
            // Set new position
            unit.position = newPos;
            this.tiles[newPos.y][newPos.x].unit = unit;
            return true;
        }
        return false;
    }
    
    removeUnit(unit) {
        const index = units.indexOf(unit);
        if (index > -1) {
            units.splice(index, 1);
            this.tiles[unit.position.y][unit.position.x].unit = null;
        }
    }
}

// Initialize Three.js scene
function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Camera - Isometric view
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 30;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
    );
    
    // Position camera for isometric view
    camera.position.set(25, 20, 25);
    camera.lookAt(MAP_WIDTH, 0, MAP_HEIGHT / 2);
    
    // Renderer
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Groups for organization
    mapGroup = new THREE.Group();
    unitsGroup = new THREE.Group();
    effectsGroup = new THREE.Group();
    highlightGroup = new THREE.Group();
    
    scene.add(mapGroup);
    scene.add(unitsGroup);
    scene.add(effectsGroup);
    scene.add(highlightGroup);
    
    // Lighting
    setupLighting();
    
    // Materials
    createMaterials();
    
    // Grid helper for better visualization
    gridHelper = new THREE.GridHelper(MAP_WIDTH * GRID_SIZE, MAP_WIDTH, 0x404040, 0x404040);
    gridHelper.position.set((MAP_WIDTH - 1) * GRID_SIZE / 2, 0, (MAP_HEIGHT - 1) * GRID_SIZE / 2);
    scene.add(gridHelper);
}

function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 25);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Point light for dramatic effect
    const pointLight = new THREE.PointLight(0xff6600, 0.5, 100);
    pointLight.position.set(10, 10, 8);
    scene.add(pointLight);
}

function createMaterials() {
    materials = {
        // Tile materials
        empty: new THREE.MeshLambertMaterial({ color: 0xcccccc }),
        wall: new THREE.MeshLambertMaterial({ color: 0x555555 }),
        fullCover: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
        halfCover: new THREE.MeshLambertMaterial({ color: 0xA0A0A0 }),
        fire: new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0x331100 }),
        smoke: new THREE.MeshLambertMaterial({ color: 0x808080, transparent: true, opacity: 0.7 }),
        
        // Highlight materials
        selected: new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 }),
        moveRange: new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 }),
        attackRange: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 }),
        
        // Health bar materials
        healthGreen: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
        healthYellow: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
        healthRed: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        healthBg: new THREE.MeshBasicMaterial({ color: 0x333333 })
    };
}

function create3DMap() {
    // Clear existing map
    mapGroup.clear();
    tiles = [];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        tiles[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = gameMap.tiles[y][x];
            const tileMesh = createTileMesh(tile.type, x, y);
            
            if (tileMesh) {
                tileMesh.position.set(x * GRID_SIZE, 0, y * GRID_SIZE);
                tileMesh.userData = { x, y, type: 'tile' };
                mapGroup.add(tileMesh);
                tiles[y][x] = tileMesh;
                tile.mesh = tileMesh;
            }
        }
    }
}

function createTileMesh(tileType, x, y) {
    let geometry, material, mesh;
    
    switch (tileType) {
        case TileType.EMPTY:
            geometry = new THREE.BoxGeometry(GRID_SIZE * 0.9, TILE_HEIGHT, GRID_SIZE * 0.9);
            material = materials.empty;
            break;
            
        case TileType.WALL:
            geometry = new THREE.BoxGeometry(GRID_SIZE * 0.9, GRID_SIZE, GRID_SIZE * 0.9);
            material = materials.wall;
            break;
            
        case TileType.FULL_COVER:
            geometry = new THREE.BoxGeometry(GRID_SIZE * 0.9, GRID_SIZE * 0.6, GRID_SIZE * 0.9);
            material = materials.fullCover;
            break;
            
        case TileType.HALF_COVER:
            geometry = new THREE.BoxGeometry(GRID_SIZE * 0.7, GRID_SIZE * 0.3, GRID_SIZE * 0.7);
            material = materials.halfCover;
            break;
            
        case TileType.FIRE:
            geometry = new THREE.BoxGeometry(GRID_SIZE * 0.8, TILE_HEIGHT * 2, GRID_SIZE * 0.8);
            material = materials.fire;
            break;
            
        case TileType.SMOKE:
            geometry = new THREE.BoxGeometry(GRID_SIZE * 0.9, GRID_SIZE * 0.5, GRID_SIZE * 0.9);
            material = materials.smoke;
            break;
            
        default:
            return null;
    }
    
    mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    
    // Adjust Y position based on geometry
    if (tileType === TileType.WALL) {
        mesh.position.y = GRID_SIZE / 2;
    } else if (tileType === TileType.FULL_COVER) {
        mesh.position.y = GRID_SIZE * 0.3;
    } else if (tileType === TileType.HALF_COVER) {
        mesh.position.y = GRID_SIZE * 0.15;
    } else if (tileType === TileType.SMOKE) {
        mesh.position.y = GRID_SIZE * 0.25;
    } else {
        mesh.position.y = TILE_HEIGHT / 2;
    }
    
    return mesh;
}

function create3DUnits() {
    unitsGroup.clear();
    
    units.forEach(unit => {
        if (unit.alive) {
            createUnitMesh(unit);
        }
    });
}

function createUnitMesh(unit) {
    // Remove existing mesh
    if (unit.mesh) {
        unitsGroup.remove(unit.mesh);
        if (unit.healthBar) {
            unitsGroup.remove(unit.healthBar.parent);
        }
    }
    
    // Create unit geometry based on type
    let geometry = new THREE.ConeGeometry(0.4, UNIT_HEIGHT, 8);
    
    // Special geometries for specific units
    if (unit.type === UnitType.RIOTER_SHIELD || unit.type === UnitType.POLICE_SHIELD) {
        geometry = new THREE.BoxGeometry(0.6, UNIT_HEIGHT, 0.6);
    } else if (unit.type === UnitType.POLICE_DRONE) {
        geometry = new THREE.SphereGeometry(0.3, 8, 6);
    }
    
    const material = new THREE.MeshLambertMaterial({ color: unit.getColor() });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(
        unit.position.x * GRID_SIZE,
        UNIT_HEIGHT / 2,
        unit.position.y * GRID_SIZE
    );
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { unit: unit, type: 'unit' };
    
    // Create health bar
    createHealthBar(unit, mesh);
    
    unit.mesh = mesh;
    unitsGroup.add(mesh);
}

function createHealthBar(unit, unitMesh) {
    const healthBarGroup = new THREE.Group();
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const bgMesh = new THREE.Mesh(bgGeometry, materials.healthBg);
    bgMesh.position.set(0, UNIT_HEIGHT + 0.3, 0);
    healthBarGroup.add(bgMesh);
    
    // Health fill
    const healthGeometry = new THREE.PlaneGeometry(1, 0.1);
    const healthMesh = new THREE.Mesh(healthGeometry, materials.healthGreen);
    healthMesh.position.set(0, UNIT_HEIGHT + 0.31, 0);
    healthBarGroup.add(healthMesh);
    
    // Make health bars always face camera
    healthBarGroup.lookAt(camera.position);
    
    unit.healthBar = healthMesh;
    unitMesh.add(healthBarGroup);
    
    unit.updateHealthBar();
}

function setupEventListeners() {
    // Mouse events
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    
    // Keyboard events
    document.addEventListener('keydown', onKeyDown);
    
    // UI events
    document.getElementById('endTurnBtn').addEventListener('click', endTurn);
    document.getElementById('helpBtn').addEventListener('click', showHelp);
    
    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onMouseDown(event) {
    event.preventDefault();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Handle targeting mode (attack or ability)
    if (targetingMode && selectedUnit) {
        const tileIntersects = raycaster.intersectObjects(mapGroup.children);
        if (tileIntersects.length > 0) {
            const intersection = tileIntersects[0];
            const tileData = intersection.object.userData;
            const targetPos = new Position(tileData.x, tileData.y);
            
            if (targetingMode === 'attack') {
                handleTargetedAttack(targetPos);
            } else if (targetingMode === 'ability') {
                handleTargetedAbility(targetPos);
            }
            
            exitTargetingMode();
            return;
        }
    }
    
    // Check for unit clicks first
    const unitIntersects = raycaster.intersectObjects(unitsGroup.children);
    if (unitIntersects.length > 0) {
        const clickedUnit = unitIntersects[0].object.userData.unit;
        if (clickedUnit && clickedUnit.faction === currentFaction) {
            exitTargetingMode(); // Exit targeting if selecting new unit
            selectUnit(clickedUnit);
            return;
        } else if (targetingMode === 'attack' && clickedUnit && clickedUnit.faction !== currentFaction) {
            // Direct attack on enemy unit
            if (selectedUnit.canAttack(clickedUnit.position)) {
                tryAttack(clickedUnit);
                exitTargetingMode();
                return;
            }
        }
    }
    
    // Then check for tile clicks (movement or empty targeting)
    const tileIntersects = raycaster.intersectObjects(mapGroup.children);
    if (tileIntersects.length > 0) {
        const intersection = tileIntersects[0];
        const tileData = intersection.object.userData;
        
        if (tileData && selectedUnit && !targetingMode) {
            const targetPos = new Position(tileData.x, tileData.y);
            tryMoveUnit(targetPos);
        }
    }
    
    // Click on empty space - exit targeting mode
    if (targetingMode) {
        exitTargetingMode();
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onKeyDown(event) {
    if (gameState !== 'playing') return;
    
    switch (event.code) {
        case 'KeyE':
            if (selectedUnit && currentFaction === Faction.RIOTER) {
                if (targetingMode === 'attack') {
                    exitTargetingMode();
                } else {
                    enterAttackMode();
                }
            }
            break;
            
        case 'KeyQ':
            if (selectedUnit && currentFaction === Faction.RIOTER) {
                if (targetingMode === 'ability') {
                    exitTargetingMode();
                } else {
                    enterAbilityMode();
                }
            }
            break;
            
        case 'KeyH':
            if (selectedUnit) {
                showUnitHelp();
            }
            break;
            
        case 'Space':
            event.preventDefault();
            endTurn();
            break;
            
        case 'Escape':
            if (targetingMode) {
                exitTargetingMode();
            }
            break;
            
        // Camera controls
        case 'KeyW':
            cameraTarget.z -= 2;
            updateCamera();
            break;
        case 'KeyS':
            cameraTarget.z += 2;
            updateCamera();
            break;
        case 'KeyA':
            cameraTarget.x -= 2;
            updateCamera();
            break;
        case 'KeyD':
            cameraTarget.x += 2;
            updateCamera();
            break;
    }
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 30;
    
    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCamera() {
    camera.position.set(
        cameraTarget.x + 15,
        20,
        cameraTarget.z + 15
    );
    camera.lookAt(cameraTarget);
}

function selectUnit(unit) {
    selectedUnit = unit;
    exitTargetingMode(); // Clear any active targeting
    updateHighlights();
    updateUI();
    addCombatLog(`Selected ${unit.getName()}`);
}

function updateHighlights() {
    // Clear existing highlights
    highlightGroup.clear();
    
    if (!selectedUnit) return;
    
    // Highlight selected unit
    const selectedHighlight = new THREE.Mesh(
        new THREE.RingGeometry(0.8, 1.2, 16),
        materials.selected
    );
    selectedHighlight.position.set(
        selectedUnit.position.x * GRID_SIZE,
        0.02,
        selectedUnit.position.y * GRID_SIZE
    );
    selectedHighlight.rotation.x = -Math.PI / 2;
    highlightGroup.add(selectedHighlight);
    
    if (selectedUnit.ap > 0) {
        // Show movement range
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const pos = new Position(x, y);
                const distance = selectedUnit.position.distanceTo(pos);
                
                if (distance <= selectedUnit.moveRange && gameMap.canMoveTo(pos)) {
                    const moveHighlight = new THREE.Mesh(
                        new THREE.RingGeometry(0.6, 0.8, 16),
                        materials.moveRange
                    );
                    moveHighlight.position.set(x * GRID_SIZE, 0.01, y * GRID_SIZE);
                    moveHighlight.rotation.x = -Math.PI / 2;
                    highlightGroup.add(moveHighlight);
                }
                
                // Show attack range for enemies
                const tile = gameMap.getTile(pos);
                if (tile && tile.unit && tile.unit.faction !== currentFaction && 
                    selectedUnit.canAttack(pos)) {
                    const attackHighlight = new THREE.Mesh(
                        new THREE.RingGeometry(0.4, 0.6, 16),
                        materials.attackRange
                    );
                    attackHighlight.position.set(x * GRID_SIZE, 0.03, y * GRID_SIZE);
                    attackHighlight.rotation.x = -Math.PI / 2;
                    highlightGroup.add(attackHighlight);
                }
            }
        }
    }
}

function tryMoveUnit(targetPos) {
    if (!selectedUnit || selectedUnit.ap < 1) return;
    
    const distance = selectedUnit.position.distanceTo(targetPos);
    
    if (distance <= selectedUnit.moveRange && gameMap.canMoveTo(targetPos)) {
        // Animate movement
        animateUnitMovement(selectedUnit, targetPos);
        
        gameMap.moveUnit(selectedUnit, targetPos);
        selectedUnit.ap -= 1;
        
        updateHighlights();
        updateUI();
        addCombatLog(`${selectedUnit.getName()} moves to (${targetPos.x}, ${targetPos.y})`);
    }
}

function animateUnitMovement(unit, targetPos) {
    if (!unit.mesh) return;
    
    const startPos = unit.mesh.position.clone();
    const endPos = new THREE.Vector3(targetPos.x * GRID_SIZE, UNIT_HEIGHT / 2, targetPos.y * GRID_SIZE);
    
    unit.isAnimating = true;
    
    let progress = 0;
    const animationSpeed = 0.1;
    
    function animate() {
        progress += animationSpeed;
        
        if (progress >= 1) {
            unit.mesh.position.copy(endPos);
            unit.isAnimating = false;
            return;
        }
        
        unit.mesh.position.lerpVectors(startPos, endPos, progress);
        requestAnimationFrame(animate);
    }
    
    animate();
}

function enterAttackMode() {
    if (!selectedUnit || selectedUnit.ap < 1) {
        addCombatLog("Cannot attack - no AP remaining!");
        return;
    }
    
    targetingMode = 'attack';
    updateTargetHighlights();
    addCombatLog(`${selectedUnit.getName()} - Select target to attack (ESC to cancel)`);
}

function enterAbilityMode() {
    if (!selectedUnit || selectedUnit.ap < 1) {
        addCombatLog("Cannot use ability - no AP remaining!");
        return;
    }
    
    // Check if unit has a targeted ability
    if (selectedUnit.type === UnitType.RIOTER_MOLOTOV) {
        targetingMode = 'ability';
        updateTargetHighlights();
        addCombatLog(`${selectedUnit.getName()} - Select target location for molotov (ESC to cancel)`);
    } else {
        // Use non-targeted abilities immediately
        handleAbilityKey();
    }
}

function exitTargetingMode() {
    targetingMode = null;
    validTargets = [];
    updateHighlights(); // Restore normal highlights
}

function updateTargetHighlights() {
    if (!selectedUnit || !targetingMode) return;
    
    // Clear existing highlights
    highlightGroup.clear();
    
    // Highlight selected unit
    const selectedHighlight = new THREE.Mesh(
        new THREE.RingGeometry(0.8, 1.2, 16),
        materials.selected
    );
    selectedHighlight.position.set(
        selectedUnit.position.x * GRID_SIZE,
        0.02,
        selectedUnit.position.y * GRID_SIZE
    );
    selectedHighlight.rotation.x = -Math.PI / 2;
    highlightGroup.add(selectedHighlight);
    
    if (targetingMode === 'attack') {
        // Show all valid attack targets
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const pos = new Position(x, y);
                
                // Check if we can attack this position
                if (selectedUnit.canAttack(pos)) {
                    const tile = gameMap.getTile(pos);
                    let highlightColor = materials.attackRange;
                    
                    // Different color for positions with enemies
                    if (tile && tile.unit && tile.unit.faction !== currentFaction) {
                        highlightColor = new THREE.MeshBasicMaterial({ 
                            color: 0xff0000, 
                            transparent: true, 
                            opacity: 0.6 
                        });
                    }
                    
                    const attackHighlight = new THREE.Mesh(
                        new THREE.RingGeometry(0.4, 0.8, 16),
                        highlightColor
                    );
                    attackHighlight.position.set(x * GRID_SIZE, 0.03, y * GRID_SIZE);
                    attackHighlight.rotation.x = -Math.PI / 2;
                    highlightGroup.add(attackHighlight);
                }
            }
        }
    } else if (targetingMode === 'ability' && selectedUnit.type === UnitType.RIOTER_MOLOTOV) {
        // Show molotov range
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const pos = new Position(x, y);
                const distance = selectedUnit.position.distanceTo(pos);
                
                if (distance <= selectedUnit.range) {
                    const abilityHighlight = new THREE.Mesh(
                        new THREE.RingGeometry(0.4, 0.8, 16),
                        new THREE.MeshBasicMaterial({ 
                            color: 0xff6600, 
                            transparent: true, 
                            opacity: 0.4 
                        })
                    );
                    abilityHighlight.position.set(x * GRID_SIZE, 0.03, y * GRID_SIZE);
                    abilityHighlight.rotation.x = -Math.PI / 2;
                    highlightGroup.add(abilityHighlight);
                    
                    // Show 3x3 area preview if hovering
                    // (This could be enhanced with mouse hover detection)
                }
            }
        }
    }
}

function handleTargetedAttack(targetPos) {
    if (!selectedUnit || selectedUnit.ap < 1) return;
    
    // Check if target position is valid for attack
    if (!selectedUnit.canAttack(targetPos)) {
        addCombatLog("Invalid target - out of range or no line of sight!");
        return;
    }
    
    const targetTile = gameMap.getTile(targetPos);
    
    // If there's an enemy unit, attack it directly
    if (targetTile && targetTile.unit && targetTile.unit.faction !== currentFaction) {
        tryAttack(targetTile.unit);
    } else {
        // Attack empty position (for area effects or missed shots)
        selectedUnit.ap -= 1;
        addCombatLog(`${selectedUnit.getName()} attacks position (${targetPos.x}, ${targetPos.y}) but hits nothing!`);
        updateUI();
    }
}

function handleTargetedAbility(targetPos) {
    if (!selectedUnit || selectedUnit.ap < 1) return;
    
    if (selectedUnit.type === UnitType.RIOTER_MOLOTOV) {
        // Check if target is within range
        const distance = selectedUnit.position.distanceTo(targetPos);
        if (distance > selectedUnit.range) {
            addCombatLog("Target out of range for molotov!");
            return;
        }
        
        useMolotovAbilityTargeted(targetPos);
    }
}

function useMolotovAbilityTargeted(centerPos) {
    if (selectedUnit.ap < 1) return;
    
    // Create fire in 3x3 area around target position
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const firePos = new Position(centerPos.x + dx, centerPos.y + dy);
            
            if (gameMap.isValidPosition(firePos)) {
                const tile = gameMap.getTile(firePos);
                if (tile.type === TileType.EMPTY || tile.type === TileType.HALF_COVER) {
                    tile.type = TileType.FIRE;
                    
                    // Update tile mesh
                    if (tile.mesh) {
                        mapGroup.remove(tile.mesh);
                    }
                    
                    const newMesh = createTileMesh(TileType.FIRE, firePos.x, firePos.y);
                    if (newMesh) {
                        newMesh.position.set(firePos.x * GRID_SIZE, 0, firePos.y * GRID_SIZE);
                        newMesh.userData = { x: firePos.x, y: firePos.y, type: 'tile' };
                        mapGroup.add(newMesh);
                        tile.mesh = newMesh;
                    }
                    
                    // Damage unit in fire
                    if (tile.unit) {
                        tile.unit.takeDamage(20);
                        createDamageEffect(firePos, 20);
                        
                        if (!tile.unit.alive) {
                            gameMap.removeUnit(tile.unit);
                            if (tile.unit.mesh) {
                                unitsGroup.remove(tile.unit.mesh);
                            }
                        }
                    }
                }
            }
        }
    }
    
    selectedUnit.ap -= 1;
    addCombatLog(`${selectedUnit.getName()} throws molotov at (${centerPos.x}, ${centerPos.y})!`);
    updateUI();
}

// Keep the old handleAttackKey for backwards compatibility (auto-attack nearest)
function handleAttackKey() {
    // This is now called for non-targeted abilities
    if (!selectedUnit || selectedUnit.ap < 1) return;
    
    switch (selectedUnit.type) {
        case UnitType.RIOTER_MEDIC:
            useHealAbility();
            break;
        case UnitType.RIOTER_HACKER:
            useHackAbility();
            break;
        case UnitType.RIOTER_SHIELD:
            useShieldAbility();
            break;
        case UnitType.RIOTER_LEADER:
            useInspireAbility();
            break;
        default:
            // For units without special abilities, do nothing
            addCombatLog(`${selectedUnit.getName()} has no special ability`);
            break;
    }
}

function tryAttack(target) {
    if (!selectedUnit || selectedUnit.ap < 1) return;
    
    if (selectedUnit.canAttack(target.position)) {
        let damage = selectedUnit.damage;
        
        // Apply cover reduction
        const targetTile = gameMap.getTile(target.position);
        const coverReduction = targetTile.providesCover();
        damage = Math.floor(damage * (1 - coverReduction));
        
        // Add randomness
        damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
        
        // Create damage effect
        createDamageEffect(target.position, damage);
        
        // Apply damage
        target.takeDamage(damage);
        selectedUnit.ap -= 1;
        
        const coverText = coverReduction > 0 ? ` (through ${Math.floor(coverReduction * 100)}% cover)` : '';
        addCombatLog(`${selectedUnit.getName()} deals ${damage} damage to ${target.getName()}${coverText}`);
        
        if (!target.alive) {
            gameMap.removeUnit(target);
            addCombatLog(`${target.getName()} is eliminated!`);
            
            // Remove mesh
            if (target.mesh) {
                unitsGroup.remove(target.mesh);
            }
        }
        
        updateHighlights();
        updateUI();
        checkWinConditions();
    }
}

function handleAbilityKey() {
    if (!selectedUnit || selectedUnit.ap < 1) return;
    
    switch (selectedUnit.type) {
        case UnitType.RIOTER_MOLOTOV:
            useMolotovAbility();
            break;
        case UnitType.RIOTER_MEDIC:
            useHealAbility();
            break;
        case UnitType.RIOTER_HACKER:
            useHackAbility();
            break;
        case UnitType.RIOTER_SHIELD:
            useShieldAbility();
            break;
        case UnitType.RIOTER_LEADER:
            useInspireAbility();
            break;
    }
}

function useMolotovAbility() {
    const center = selectedUnit.position;
    
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const firePos = new Position(center.x + dx, center.y + dy);
            
            if (gameMap.isValidPosition(firePos)) {
                const tile = gameMap.getTile(firePos);
                if (tile.type === TileType.EMPTY || tile.type === TileType.HALF_COVER) {
                    tile.type = TileType.FIRE;
                    
                    // Update tile mesh
                    if (tile.mesh) {
                        mapGroup.remove(tile.mesh);
                    }
                    
                    const newMesh = createTileMesh(TileType.FIRE, firePos.x, firePos.y);
                    if (newMesh) {
                        newMesh.position.set(firePos.x * GRID_SIZE, 0, firePos.y * GRID_SIZE);
                        newMesh.userData = { x: firePos.x, y: firePos.y, type: 'tile' };
                        mapGroup.add(newMesh);
                        tile.mesh = newMesh;
                    }
                    
                    // Damage unit in fire
                    if (tile.unit) {
                        tile.unit.takeDamage(20);
                        createDamageEffect(firePos, 20);
                        
                        if (!tile.unit.alive) {
                            gameMap.removeUnit(tile.unit);
                            if (tile.unit.mesh) {
                                unitsGroup.remove(tile.unit.mesh);
                            }
                        }
                    }
                }
            }
        }
    }
    
    selectedUnit.ap -= 1;
    addCombatLog(`${selectedUnit.getName()} creates a fire area!`);
    updateUI();
}

function useHealAbility() {
    const healed = [];
    
    units.forEach(unit => {
        if (unit.faction === currentFaction && 
            unit !== selectedUnit && 
            unit.position.distanceTo(selectedUnit.position) <= 2) {
            
            const oldHp = unit.hp;
            unit.hp = Math.min(unit.maxHp, unit.hp + 30);
            const healAmount = unit.hp - oldHp;
            
            if (healAmount > 0) {
                unit.updateHealthBar();
                createHealEffect(unit.position, healAmount);
                healed.push(`${unit.getName()} (+${healAmount})`);
            }
        }
    });
    
    selectedUnit.ap -= 1;
    
    if (healed.length > 0) {
        addCombatLog(`${selectedUnit.getName()} heals: ${healed.join(', ')}`);
    } else {
        addCombatLog(`${selectedUnit.getName()} finds no allies to heal`);
    }
    
    updateUI();
}

function useHackAbility() {
    const center = selectedUnit.position;
    
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const smokePos = new Position(center.x + dx, center.y + dy);
            
            if (gameMap.isValidPosition(smokePos)) {
                const tile = gameMap.getTile(smokePos);
                if (tile.type === TileType.EMPTY) {
                    tile.type = TileType.SMOKE;
                    
                    // Update tile mesh
                    if (tile.mesh) {
                        mapGroup.remove(tile.mesh);
                    }
                    
                    const newMesh = createTileMesh(TileType.SMOKE, smokePos.x, smokePos.y);
                    if (newMesh) {
                        newMesh.position.set(smokePos.x * GRID_SIZE, 0, smokePos.y * GRID_SIZE);
                        newMesh.userData = { x: smokePos.x, y: smokePos.y, type: 'tile' };
                        mapGroup.add(newMesh);
                        tile.mesh = newMesh;
                    }
                }
            }
        }
    }
    
    selectedUnit.ap -= 1;
    addCombatLog(`${selectedUnit.getName()} deploys smoke screen!`);
    updateUI();
}

function useShieldAbility() {
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
        const shieldPos = new Position(selectedUnit.position.x + dx, selectedUnit.position.y + dy);
        
        if (gameMap.isValidPosition(shieldPos)) {
            const tile = gameMap.getTile(shieldPos);
            if (tile.type === TileType.EMPTY && !tile.unit) {
                tile.type = TileType.HALF_COVER;
                
                // Update tile mesh
                if (tile.mesh) {
                    mapGroup.remove(tile.mesh);
                }
                
                const newMesh = createTileMesh(TileType.HALF_COVER, shieldPos.x, shieldPos.y);
                if (newMesh) {
                    newMesh.position.set(shieldPos.x * GRID_SIZE, 0, shieldPos.y * GRID_SIZE);
                    newMesh.userData = { x: shieldPos.x, y: shieldPos.y, type: 'tile' };
                    mapGroup.add(newMesh);
                    tile.mesh = newMesh;
                }
                break;
            }
        }
    }
    
    selectedUnit.ap -= 1;
    addCombatLog(`${selectedUnit.getName()} deploys temporary cover!`);
    updateUI();
}

function useInspireAbility() {
    const inspired = [];
    
    units.forEach(unit => {
        if (unit.faction === currentFaction && 
            unit !== selectedUnit && 
            unit.position.distanceTo(selectedUnit.position) <= 3) {
            
            unit.ap = Math.min(unit.maxAp, unit.ap + 1);
            inspired.push(unit.getName());
        }
    });
    
    selectedUnit.ap -= 1;
    
    if (inspired.length > 0) {
        addCombatLog(`${selectedUnit.getName()} inspires: ${inspired.join(', ')} (+1 AP)`);
    } else {
        addCombatLog(`${selectedUnit.getName()} finds no allies to inspire`);
    }
    
    updateUI();
}

function createDamageEffect(position, damage) {
    // Create floating damage number effect
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    context.fillStyle = '#ff0000';
    context.font = '32px bold Arial';
    context.textAlign = 'center';
    context.fillText(`-${damage}`, 64, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(
        position.x * GRID_SIZE,
        UNIT_HEIGHT + 1,
        position.y * GRID_SIZE
    );
    sprite.scale.set(2, 1, 1);
    
    effectsGroup.add(sprite);
    
    // Animate the damage number
    let time = 0;
    const animate = () => {
        time += 0.05;
        sprite.position.y += 0.02;
        sprite.material.opacity = Math.max(0, 1 - time);
        
        if (time < 1) {
            requestAnimationFrame(animate);
        } else {
            effectsGroup.remove(sprite);
        }
    };
    animate();
}

function createHealEffect(position, healAmount) {
    // Create floating heal number effect
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    context.fillStyle = '#00ff00';
    context.font = '32px bold Arial';
    context.textAlign = 'center';
    context.fillText(`+${healAmount}`, 64, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(
        position.x * GRID_SIZE,
        UNIT_HEIGHT + 1,
        position.y * GRID_SIZE
    );
    sprite.scale.set(2, 1, 1);
    
    effectsGroup.add(sprite);
    
    // Animate the heal number
    let time = 0;
    const animate = () => {
        time += 0.05;
        sprite.position.y += 0.02;
        sprite.material.opacity = Math.max(0, 1 - time);
        
        if (time < 1) {
            requestAnimationFrame(animate);
        } else {
            effectsGroup.remove(sprite);
        }
    };
    animate();
}

function endTurn() {
    // Exit any targeting mode
    exitTargetingMode();
    
    // Reset AP for current faction
    units.forEach(unit => {
        if (unit.faction === currentFaction) {
            unit.resetAp();
        }
    });
    
    // Switch faction
    if (currentFaction === Faction.RIOTER) {
        currentFaction = Faction.POLICE;
        aiTurn();
    } else {
        currentFaction = Faction.RIOTER;
        turnNumber++;
    }
    
    selectedUnit = null;
    updateHighlights();
    updateUI();
    checkWinConditions();
}

function aiTurn() {
    addCombatLog("Police turn begins...");
    
    const policeUnits = units.filter(u => u.faction === Faction.POLICE && u.alive);
    
    // Process each police unit
    let unitIndex = 0;
    
    function processNextUnit() {
        if (unitIndex >= policeUnits.length) {
            // AI turn complete
            setTimeout(() => {
                currentFaction = Faction.RIOTER;
                turnNumber++;
                updateUI();
                addCombatLog("Rioter turn begins!");
            }, 1000);
            return;
        }
        
        const unit = policeUnits[unitIndex];
        aiMakeDecision(unit);
        
        unitIndex++;
        setTimeout(processNextUnit, 800); // Delay between AI actions
    }
    
    setTimeout(processNextUnit, 500);
}

function aiMakeDecision(unit) {
    const enemies = units.filter(u => u.faction === Faction.RIOTER && u.alive);
    if (enemies.length === 0) return;
    
    // Prioritize targets
    const prioritizedTargets = aiPrioritizeTargets(unit, enemies);
    if (prioritizedTargets.length === 0) return;
    
    const target = prioritizedTargets[0];
    
    // Check if we can attack
    if (unit.canAttack(target.position)) {
        aiAttack(unit, target);
        return;
    }
    
    // Try to move tactically
    if (!aiMoveTactically(unit, target)) {
        // Fallback: move towards target
        aiMoveTowards(unit, target.position);
    }
}

function aiPrioritizeTargets(unit, enemies) {
    const scoredEnemies = enemies.map(enemy => {
        let score = 0;
        const distance = unit.position.distanceTo(enemy.position);
        
        // Threat scores
        const threatScores = {
            [UnitType.RIOTER_MOLOTOV]: 100,
            [UnitType.RIOTER_LEADER]: 80,
            [UnitType.RIOTER_MEDIC]: 70,
            [UnitType.RIOTER_BRAWLER]: 60,
            [UnitType.RIOTER_HACKER]: 50,
            [UnitType.RIOTER_SHIELD]: 40
        };
        score += threatScores[enemy.type] || 50;
        
        // Prioritize wounded enemies
        if (enemy.hp < enemy.maxHp * 0.5) score += 30;
        
        // Prioritize closer enemies
        score += Math.max(0, 50 - distance * 5);
        
        // Prioritize enemies not in cover
        const targetTile = gameMap.getTile(enemy.position);
        if (targetTile.providesCover() === 0) score += 20;
        
        return { enemy, score };
    });
    
    scoredEnemies.sort((a, b) => b.score - a.score);
    return scoredEnemies.map(item => item.enemy);
}

function aiAttack(unit, target) {
    let damage = unit.damage;
    const targetTile = gameMap.getTile(target.position);
    const coverReduction = targetTile.providesCover();
    damage = Math.floor(damage * (1 - coverReduction));
    damage = Math.floor(damage * (0.8 + Math.random() * 0.4));
    
    createDamageEffect(target.position, damage);
    
    const coverText = coverReduction > 0 ? ` (through ${Math.floor(coverReduction * 100)}% cover)` : '';
    addCombatLog(`${unit.getName()} deals ${damage} damage to ${target.getName()}${coverText}`);
    
    target.takeDamage(damage);
    unit.ap -= 1;
    
    if (!target.alive) {
        gameMap.removeUnit(target);
        addCombatLog(`${target.getName()} is eliminated!`);
        
        if (target.mesh) {
            unitsGroup.remove(target.mesh);
        }
    }
}

function aiMoveTactically(unit, target) {
    let bestPos = null;
    let bestScore = -1000;
    
    // Check positions within movement range
    for (let dx = -unit.moveRange; dx <= unit.moveRange; dx++) {
        for (let dy = -unit.moveRange; dy <= unit.moveRange; dy++) {
            if (Math.abs(dx) + Math.abs(dy) > unit.moveRange) continue;
            
            const newPos = new Position(unit.position.x + dx, unit.position.y + dy);
            
            if (!gameMap.isValidPosition(newPos) || !gameMap.canMoveTo(newPos)) continue;
            
            const score = aiEvaluatePosition(unit, newPos, target);
            
            if (score > bestScore) {
                bestScore = score;
                bestPos = newPos;
            }
        }
    }
    
    if (bestPos && !bestPos.equals(unit.position)) {
        animateUnitMovement(unit, bestPos);
        gameMap.moveUnit(unit, bestPos);
        unit.ap -= 1;
        addCombatLog(`${unit.getName()} moves tactically`);
        return true;
    }
    
    return false;
}

function aiEvaluatePosition(unit, pos, target) {
    let score = 0;
    const distance = pos.distanceTo(target.position);
    
    // Distance scoring based on unit type
    if (unit.type === UnitType.POLICE_SNIPER) {
        const idealDistance = Math.floor(unit.range / 2);
        score -= Math.abs(distance - idealDistance) * 5;
    } else {
        score -= distance * 3;
    }
    
    // Cover bonus
    const tile = gameMap.getTile(pos);
    if (tile.providesCover() > 0) score += 20;
    
    // Can attack from this position
    const tempUnit = { ...unit, position: pos };
    if (tempUnit.position.distanceTo(target.position) <= unit.range) {
        score += 50;
    }
    
    // Avoid being too close to multiple enemies
    let enemyProximity = 0;
    units.forEach(enemy => {
        if (enemy.faction === Faction.RIOTER && enemy.alive) {
            const enemyDistance = pos.distanceTo(enemy.position);
            if (enemyDistance <= 2) enemyProximity++;
        }
    });
    score -= enemyProximity * 15;
    
    return score;
}

function aiMoveTowards(unit, targetPos) {
    let bestPos = null;
    let bestDistance = Infinity;
    
    // Check adjacent positions
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            
            const newPos = new Position(unit.position.x + dx, unit.position.y + dy);
            
            if (gameMap.isValidPosition(newPos) && gameMap.canMoveTo(newPos)) {
                const distance = newPos.distanceTo(targetPos);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestPos = newPos;
                }
            }
        }
    }
    
    if (bestPos) {
        animateUnitMovement(unit, bestPos);
        gameMap.moveUnit(unit, bestPos);
        unit.ap -= 1;
    }
}

function checkWinConditions() {
    const riotersAlive = units.some(u => u.faction === Faction.RIOTER && u.alive);
    const policeAlive = units.some(u => u.faction === Faction.POLICE && u.alive);
    
    if (!riotersAlive) {
        gameState = 'defeat';
        showGameOver('DEFEAT!', 'Police have suppressed the uprising!', 'defeat');
    } else if (!policeAlive) {
        gameState = 'victory';
        showGameOver('VICTORY!', 'The rioters have triumphed!', 'victory');
    }
}

function showGameOver(title, message, type) {
    const overlay = document.getElementById('gameOverlay');
    const titleElement = document.getElementById('gameOverTitle');
    const messageElement = document.getElementById('gameOverMessage');
    
    titleElement.textContent = title;
    titleElement.className = type;
    messageElement.textContent = message;
    
    overlay.style.display = 'flex';
}

function showHelp() {
    const helpText = selectedUnit ? getUnitHelp(selectedUnit) : getGeneralHelp();
    alert(helpText);
}

function getUnitHelp(unit) {
    const abilities = {
        [UnitType.RIOTER_BRAWLER]: "High damage melee fighter with extended movement range",
        [UnitType.RIOTER_MOLOTOV]: "Q: Create 3x3 fire area that damages units",
        [UnitType.RIOTER_LEADER]: "Q: Inspire nearby allies (+1 AP)",
        [UnitType.RIOTER_MEDIC]: "Q: Heal nearby allies (+30 HP)",
        [UnitType.RIOTER_HACKER]: "Q: Create smoke screen for concealment",
        [UnitType.RIOTER_SHIELD]: "Q: Deploy temporary cover"
    };
    
    const abilityText = abilities[unit.type] || "No special ability";
    
    return `${unit.getName()} (${unit.faction === Faction.RIOTER ? 'Rioter' : 'Police'})
HP: ${unit.hp}/${unit.maxHp}
AP: ${unit.ap}/${unit.maxAp}
Damage: ${unit.damage}
Range: ${unit.range}
Move: ${unit.moveRange}

Ability: ${abilityText}`;
}

function getGeneralHelp() {
    return `Paris Tactical RPG 3D - Controls:

Mouse: Click to select units and move them
E: Attack nearest enemy in range
Q: Use unit's special ability
H: Show unit help
Space: End turn
WASD: Move camera
Mouse Wheel: Zoom

Objective: Eliminate all enemy units!

Cover System:
- Brown objects: 50% damage reduction
- Gray objects: 25% damage reduction
- Use cover strategically to survive!`;
}

function showUnitHelp() {
    if (selectedUnit) {
        const helpText = getUnitHelp(selectedUnit);
        addCombatLog(helpText.replace(/\n/g, ' | '));
    }
}

function updateUI() {
    // Update turn info
    document.getElementById('turnNumber').textContent = turnNumber;
    const factionElement = document.getElementById('currentFaction');
    factionElement.textContent = currentFaction === Faction.RIOTER ? 'RIOTERS' : 'POLICE';
    factionElement.className = currentFaction === Faction.RIOTER ? 'faction-rioter' : 'faction-police';
    
    // Update unit counts
    const rioterCount = units.filter(u => u.faction === Faction.RIOTER && u.alive).length;
    const policeCount = units.filter(u => u.faction === Faction.POLICE && u.alive).length;
    document.getElementById('rioterCount').textContent = rioterCount;
    document.getElementById('policeCount').textContent = policeCount;
    
    // Update selected unit info
    const unitInfoElement = document.getElementById('selectedUnitData');
    if (selectedUnit) {
        const abilityInfo = getAbilityInfo(selectedUnit.type);
        unitInfoElement.innerHTML = `
            <div><strong>${selectedUnit.getName()}</strong></div>
            <div class="health-bar">
                <div class="health-fill" style="width: ${(selectedUnit.hp / selectedUnit.maxHp) * 100}%"></div>
            </div>
            <div>HP: ${selectedUnit.hp}/${selectedUnit.maxHp}</div>
            <div>AP: ${selectedUnit.ap}/${selectedUnit.maxAp}</div>
            <div>Damage: ${selectedUnit.damage}</div>
            <div>Range: ${selectedUnit.range}</div>
            <div>Move: ${selectedUnit.moveRange}</div>
            ${abilityInfo ? `<div><strong>Ability:</strong> ${abilityInfo}</div>` : ''}
        `;
    } else {
        unitInfoElement.innerHTML = '<p>Select a unit to view details</p>';
    }
}

function getAbilityInfo(unitType) {
    const abilities = {
        [UnitType.RIOTER_MOLOTOV]: "Fire Area (Q)",
        [UnitType.RIOTER_LEADER]: "Inspire (Q)",
        [UnitType.RIOTER_MEDIC]: "Heal (Q)",
        [UnitType.RIOTER_HACKER]: "Smoke (Q)",
        [UnitType.RIOTER_SHIELD]: "Deploy Cover (Q)"
    };
    return abilities[unitType] || null;
}

function addCombatLog(message) {
    combatLog.push(message);
    if (combatLog.length > 8) {
        combatLog.shift();
    }
    
    const logElement = document.getElementById('logContent');
    logElement.innerHTML = combatLog.map(msg => `<div>${msg}</div>`).join('');
    logElement.scrollTop = logElement.scrollHeight;
    
    console.log(message);
}

function setupUnits() {
    // Add rioter units
    const rioterPositions = [[2, 2], [2, 4], [4, 2], [4, 4], [6, 3]];
    const rioterTypes = [
        UnitType.RIOTER_BRAWLER,
        UnitType.RIOTER_MOLOTOV,
        UnitType.RIOTER_LEADER,
        UnitType.RIOTER_MEDIC,
        UnitType.RIOTER_HACKER
    ];
    
    rioterPositions.forEach(([x, y], i) => {
        const unit = new Unit(rioterTypes[i], new Position(x, y), Faction.RIOTER);
        gameMap.addUnit(unit);
    });
    
    // Add police units
    const policePositions = [[16, 10], [16, 12], [14, 11], [18, 11], [17, 9]];
    const policeTypes = [
        UnitType.POLICE_OFFICER,
        UnitType.POLICE_OFFICER,
        UnitType.POLICE_SHIELD,
        UnitType.POLICE_SNIPER,
        UnitType.POLICE_TEARGAS
    ];
    
    policePositions.forEach(([x, y], i) => {
        const unit = new Unit(policeTypes[i], new Position(x, y), Faction.POLICE);
        gameMap.addUnit(unit);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update fire effects
    effectsGroup.children.forEach(effect => {
        if (effect.material && effect.material.emissive) {
            const time = Date.now() * 0.005;
            const intensity = 0.1 + Math.sin(time) * 0.05;
            effect.material.emissive.setHex(0x331100);
        }
    });
    
    // Rotate health bars to always face camera
    unitsGroup.children.forEach(unitMesh => {
        if (unitMesh.children.length > 0) {
            unitMesh.children[0].lookAt(camera.position);
        }
    });
    
    renderer.render(scene, camera);
}

// Initialize game
function initGame() {
    initThreeJS();
    setupEventListeners();
    
    gameMap = new GameMap();
    setupUnits();
    
    create3DMap();
    create3DUnits();
    updateUI();
    
    addCombatLog("Welcome to Paris Tactical RPG 3D!");
    addCombatLog("Rioters vs Police - Battle begins!");
    
    animate();
}

// Start the game when the page loads
window.addEventListener('load', initGame);