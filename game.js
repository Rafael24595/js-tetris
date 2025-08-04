const STATUS_COLLISION = -1;
const STATUS_SUCCESS = 1;

const STATUS_KO = -1;
const STATUS_OK = 1;
const STATUS_OK_PLUS = 2;

const FIELD_VOID = 0;
const FIELD_DYNAMIC = 1;

const EXECUTION_STOPPED = "Stopped";
const EXECUTION_RUNNING = "Running";

const BLOCKS = [
    [
        [1, 1],
        [1, 1],
    ],
    [
        [1, 0, 0],
        [1, 1, 1],
    ],
    [
        [0, 0, 1],
        [1, 1, 1],
    ],
    [
        [0, 1, 0],
        [1, 1, 1],
    ],
    [
        [1, 1, 0],
        [0, 1, 1],
    ],
    [
        [0, 1, 1],
        [1, 1, 0],
    ],
    [
        [1, 1, 1, 1],
    ],
];

const MESSAGES = [
    "Nice!",
    "Fabulous!",
    "Great!",
    "Marvelous!"
];

const MESSAGES_PLUS = [
    "Colorful!",
    "Over the rainbow!",
    "Incredible!"
];

let globalMute = true;
let globalDebug = false;

let game;

window.onload = () => {
    startGame();
    updateMuteIcon(globalMute);
    updateDebugIcon(globalDebug);
};

function startGame() {
    if (game != undefined) {
        game.stopExecution();
    }
    game = new Tetris(31, 20, 350);
    game.launch();
}

class Tetris {

    constructor(height, width, speed) {
        this.time = Date.now();
        this.soundGen = new SoundGenerator().setMute(globalMute);
        this.clock = undefined;
        this.execution = undefined;
        this.height = height;
        this.width = width;
        this.matrix = this.newTable();
        this.block = undefined;
        this.information = new Information();
        this.speed = speed;
        this.xtremeDifficult = false;
        this.debug = globalDebug;
        this.draw = drawGame;
        this.updateTime = updateTime;
        this.updateMuteIcon = updateMuteIcon;
        this.updateDebugIcon = updateDebugIcon;
    }

    launch() {
        this.information.insertTrace("Game started.");

        this.soundGen.play("start");

        const block = this.randomBlock();
        this.setBlock(block);

        this.information.changeStatus(EXECUTION_RUNNING);
        window.onkeydown = this.move.bind(this);

        this.clock = setInterval(() => {
            this.updateTime(this.time);
        }, 1000);

        this.execution = setInterval(() => {
            this.moveBlockY(1);
        }, this.speed);
    }

    setDebug(debug) {
        this.debug = debug;
    }

    stopExecution() {
        clearInterval(this.execution);
        clearInterval(this.clock);
        this.execution = undefined;
        this.information.changeStatus(EXECUTION_STOPPED);
        this.information.insertTrace("Game stopped.");
        this.information.swowMessage("Game Over!");
    }

    move(event) {
        if (event.key == "Escape") {
            startGame();
        }
        
        if (this.execution == undefined) {
            return;
        }

        if (event.key == "ArrowRight") {
            this.soundGen.play("move");
            this.moveBlockX(1);
        }
        if (event.key == "ArrowLeft") {
            this.soundGen.play("move");
            this.moveBlockX(-1);
        }
        if (event.key == "ArrowDown") {
            this.soundGen.play("move");
            this.moveBlockY(1);
        }
        if (event.key == " " || event.key == "m") {
            this.soundGen.play("mirror");
            this.mirrorBlock();
        }
        if (event.key == "ArrowUp" || event.key == "r") {
            this.soundGen.play("rotate");
            this.rotateBlock();
        }
        if (event.key == "s") {
            this.switchMute();
        }
        if (event.key == "d") {
            this.switchDebug();
        }
    }

    randomBlock() {
        const index = Math.floor(Math.random() * BLOCKS.length);
        const color = Math.floor(Math.random() * (9 - 2 + 1)) + 2;

        const middleBlock = BLOCKS[index][0].length / 2;
        const middlePanel = this.width / 2;
        const position = Math.round(middlePanel - middleBlock);

        return new Block(BLOCKS[index], color, position, 0);
    }

    setBlock(block) {
        this.block = block;
        const blocked = this.updateBlock();
        if (blocked == STATUS_COLLISION) {
            this.cleanBlock();
            this.soundGen.play("gameover")
            this.stopExecution();
        }

        if (blocked != STATUS_COLLISION) {
            this.information.incrementBlocks();
        }

        this.draw(this);
    }

    cleanBlock() {
        this.updateBlock(FIELD_VOID)
    }

    updateBlock(forceField) {
        for (const [indexY, row] of this.block.block.entries()) {
            for (const [indexX, field] of row.entries()) {
                if (field == 0) {
                    continue;
                }

                const height = this.block.y + indexY;
                const okHeight = 0 <= height && height < this.height;

                const width = this.block.x + indexX;
                const okWidth = 0 <= width && width < this.width;

                const is_void = okHeight && this.matrix[this.block.y + indexY][this.block.x + indexX] < 2;

                if (!okHeight || !okWidth || !is_void) {
                    return STATUS_COLLISION;
                }

                const value = forceField != undefined ? forceField : field;
                this.matrix[this.block.y + indexY][this.block.x + indexX] = value;
            }
        }
        return STATUS_SUCCESS;
    }

    fixBlock() {
        this.updateBlock(this.block.color);
        this.block = this.randomBlock();
        this.setBlock(this.block);
    }

    moveBlockX(increment) {
        this.cleanBlock();
        this.block.x = this.block.x + increment
        if (this.updateBlock() == STATUS_COLLISION) {
            this.cleanBlock();
            this.block.x = this.block.x + (increment * - 1)
            this.updateBlock();
        }
        this.draw(this);
    }

    moveBlockY(increment) {
        this.cleanBlock();
        this.block.y = this.block.y + increment
        if (this.updateBlock() != STATUS_COLLISION) {
            this.draw(this);
            return;
        }

        this.cleanBlock();
        this.block.y = this.block.y + (increment * - 1)
        this.updateBlock();
        if (increment > 0) {
            this.fixBlock();
            this.soundGen.play("drop");
            this.checkRows();
        }
    }

    rotateBlock() {
        this.cleanBlock();
        const original = this.block;
        this.block = this.block.rotate();
        if (this.updateBlock() == STATUS_COLLISION) {
            this.cleanBlock();
            this.block = original;
            this.updateBlock();
        }
        this.draw(this);
    }

    mirrorBlock() {
        this.cleanBlock();
        const original = this.block;
        this.block = this.block.mirror();
        if (this.updateBlock() == STATUS_COLLISION) {
            this.cleanBlock();
            this.block = original;
            this.updateBlock();
        }
        this.draw(this);
    }

    checkRows() {
        const multiplier = 0.5;
        let linesMultiplier = 1;
        for (let index = this.matrix.length - 1; index >= 0; index--) {
            const row = this.matrix[index];

            const status = this.checkRow(row);
            if (status == STATUS_KO) {
                continue;
            }

            this.removeRow(index);
            index = index + 1;

            this.information.incrementScore(100 * status * linesMultiplier);

            let messageMultiplier = "";
            if (linesMultiplier > 1) {
                messageMultiplier = ` x${linesMultiplier}`;
            }

            let message = "";
            if (status == STATUS_OK) {
                this.information.insertTrace(`Line removed${messageMultiplier}.`);
                const position = Math.floor(Math.random() * MESSAGES.length);
                message = MESSAGES[position];
                this.soundGen.play("line");
                if(linesMultiplier < 3.5) {
                    linesMultiplier += multiplier;
                }
            }
            if (status == STATUS_OK_PLUS) {
                this.information.insertTrace(`Color line removed${messageMultiplier}.`);
                const position = Math.floor(Math.random() * MESSAGES_PLUS.length);
                message = MESSAGES_PLUS[position];
                this.soundGen.play("line-color");
                if(linesMultiplier < 3.5) {
                    linesMultiplier += multiplier * 2;
                }
            }

            this.information.swowMessage(message);
        }
    }

    checkRow(row) {
        let element;
        for (const field of row) {
            if (element == undefined) {
                element = field;
            }

            if (element != field) {
                element = -1;
                if (this.xtremeDifficult) {
                    return STATUS_KO;
                }
            }

            if (field == 0) {
                return STATUS_KO;
            }
        }

        if (element == -1) {
            return STATUS_OK;
        }

        return STATUS_OK_PLUS;
    }

    removeRow(index) {
        this.cleanBlock();
        this.matrix.splice(index, 1);
        this.matrix.unshift(this.newRow());
        this.updateBlock();
        this.information.incrementLines();
        this.draw(this);
    }

    newTable() {
        let table = new Array(this.height);
        table.fill([]);
        return table.map((_, index) => table[index] = this.newRow());
    }

    newRow() {
        let row = new Array(this.width);
        row.fill(FIELD_VOID);
        return row;
    }

    switchMute() {
        globalMute = !this.soundGen.mute;
        this.soundGen.setMute(globalMute);
        this.soundGen.play("unmute");
        this.updateMuteIcon(globalMute);
    }

    switchDebug() {
        globalDebug = !this.debug;
        this.setDebug(globalDebug);
        if (globalDebug) {
            this.soundGen.play("showdebug");
        }
        this.updateDebugIcon(globalDebug);
    }

}

class Block {

    block = [];
    color = 0;
    x = 0;
    y = 0;

    constructor(block, color, x, y) {
        this.block = block;
        this.color = color;
        this.x = x;
        this.y = y;
    }

    rotate() {
        let result = [];
        for (let x = 0; x < this.block[0].length; x++) {
            let row = [];
            for (let y = this.block.length - 1; 0 <= y; y--) {
                const value = this.block[y][x];
                row.push(value);
            }
            result.push(row);
        }
        return new Block(result, this.color, this.x, this.y);
    }

    mirror() {
        let result = [];
        for (let y = 0; y < this.block.length; y++) {
            let row = [];
            for (let x = this.block[y].length - 1; x >= 0; x--) {
                const value = this.block[y][x];
                row.push(value);
            }
            result.push(row);
        }
        return new Block(result, this.color, this.x, this.y);
    }

    rotateCopy() {
        this.block = this.rotateCopy().block;
    }

}

class Information {

    constructor() {
        this.score = 0;
        this.blocks = 0;
        this.lines = 0;
        this.start = Date.now();
        this.traces = [];
        this.printData = printData;
    }

    incrementScore(increment) {
        const scoreContainer = document.getElementById("execution-score");
        this.score = this.score + increment;
        scoreContainer.innerText = this.score;
    }

    changeStatus(status) {
        const stautsContainer = document.getElementById("execution-status");
        stautsContainer.innerText = status;
    }

    swowMessage(message) {
        const messageContainer = document.getElementById("execution-message");
        messageContainer.innerHTML = message;
        setTimeout(() => {
            messageContainer.innerHTML = ""
        }, 1000);
    }

    insertTrace(trace) {
        this.traces.push(trace);
        this.printData(this);
    }

    incrementBlocks() {
        this.blocks = this.blocks + 1;
        this.printData(this);
    }

    incrementLines() {
        this.lines = this.lines + 1;
        this.printData(this);
    }

}

class SoundGenerator {

    constructor() {
        this.mute = false;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    setMute(mute) {
        this.mute = mute
        return this;
    }

    play(type) {
        if (this.mute) {
            return;
        }

        switch (type) {
            case "start":
                this.startCompose();
                break;
            case "move":
                this.beep(200, 0.05, "sine");
                break;
            case "rotate":
                this.beep(300, 0.07, "square");
                break;
            case "mirror":
                this.beep(600, 0.07, "");
                break;
            case "drop":
                this.dropSound(150, 0.1);
                break;
            case "line":
                this.lineClearSound(400, 600, 0.2);
                break;
            case "line-color":
                this.lineClearSound(100, 800, 0.3);
                break;
            case "gameover":
                this.noise(0.5);
                break;
            case "unmute":
                this.unmuteCompose();
                break;
            case "showdebug":
                this.showDebugCompose();
                break;
        }

        return this;
    }

    beep(frequency, duration, type, when) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        if (type == undefined) {
            type = "sine";
        }

        if (when == undefined) {
            when = this.audioCtx.currentTime;
        }

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.value = 0.2;

        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start(when);
        osc.stop(when + duration);

        return this;
    }

    noise(duration, when) {
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.2;
        }

        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.connect(this.audioCtx.destination);
        noiseSource.start(when);

        return this;
    }

    dropSound(frequency, duration) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "triangle";
        osc.frequency.value = frequency;

        gain.gain.value = 0.3;

        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);

        return this;
    }

    lineClearSound(startFreq, endFreq, duration) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(startFreq, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.audioCtx.currentTime + duration);

        gain.gain.value = 0.1;

        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);

        return this;
    }

    startCompose() {
        const now = this.audioCtx.currentTime;

        this.beep(300, 0.1, "square", now)
            .beep(400, 0.1, "square", now + 0.15)
            .beep(500, 0.1, "square", now + 0.3);
    }

    unmuteCompose() {
        const now = this.audioCtx.currentTime;

        this.beep(800, 0.05, "square", now)
            .beep(900, 0.05, "square", now + 0.15);
    }

    showDebugCompose() {
        const now = this.audioCtx.currentTime;

        this.beep(900, 0.1, "square", now)
            .beep(500, 0.1, "square", now + 0.15)
            .beep(700, 0.1, "square", now + 0.3);
    }

}

function drawGame(tetris) {
    let container = document.getElementById("panel");
    container.innerHTML = "";
    let table = document.createElement("table");

    for (const panelRow of tetris.matrix) {
        let row = document.createElement("tr");
        for (const panelField of panelRow) {
            let field = document.createElement("td");
            let valueContainer = document.createElement("div");

            if (tetris.debug) {
                valueContainer.textContent = panelField;
                valueContainer.classList.add("debug-text");
            }

            valueContainer.classList.add("color-" + panelField);
            valueContainer.classList.add("block-fragment");

            if (panelField == 0) {
                valueContainer.classList.add("void");
            }

            if (panelField == FIELD_DYNAMIC) {
                valueContainer.classList.add("dynamic");
                valueContainer.classList.add("color-" + tetris.block.color);
            }

            field.appendChild(valueContainer);
            row.appendChild((field));
        }
        table.appendChild(row);
    }

    container.appendChild(table);
}

function printData(info) {
    const scoreContainer = document.getElementById("r-sidebar-body");
    scoreContainer.innerHTML = "";

    const blocks = document.createElement("span");
    blocks.classList.add("trace");
    blocks.textContent = "# Blocks spawned: " + info.blocks;

    scoreContainer.appendChild(blocks);

    const lines = document.createElement("span");
    lines.classList.add("trace");
    lines.textContent = "# Lines removed: " + info.lines;

    scoreContainer.appendChild(lines);

    scoreContainer.appendChild(document.createElement("br"));

    for (const message of info.traces) {
        const node = document.createElement("span");
        node.classList.add("trace");
        node.innerHTML = "&nbsp;&nbsp;> " + message;
        scoreContainer.appendChild(node);
    }
}

function updateTime(time) {
    time = Date.now() - time;

    const totalSeconds = Math.floor(time / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    const button = document.getElementById("game-time");
    button.innerText = `${hours}:${minutes}:${seconds}`;
}

function updateDebugIcon(status) {
    const button = document.getElementById("debug-button");
    if (status) {
        button.classList.remove("grayscale")
    } else {
        button.classList.add("grayscale")
    }
}

function updateMuteIcon(status) {
    const icon = status ? "🔈" : "🔊";
    const button = document.getElementById("mute-button");
    button.innerText = icon;
}