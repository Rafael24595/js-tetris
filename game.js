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
    "Marvelous!",
    "Follow the train!"
];

const MESSAGES_PLUS = [
    "Colorful!",
    "Over the rainbow!",
    "Incredible!"
];

let globalMute = true;

let game;

window.onload = start_game;

function start_game() {
    if (game != undefined) {
        game.stop_execution();
    }
    game = new Tetris(31, 20, 350);
    //game.active_debug();
    game.launch();
}


class Tetris {

    soundGen

    execution;

    height;
    width;
    matrix;
    block;

    information;

    speed;
    xtreme_difficult;

    debug;

    constructor(height, width, speed) {
        this.soundGen = new SoundGenerator().setMute(globalMute);
        this.execution = undefined;
        this.height = height;
        this.width = width;
        this.matrix = this.new_table();
        this.block = undefined;
        this.information = new Information();
        this.speed = speed;
        this.xtreme_difficult = false;
        this.debug = false;
    }

    launch() {
        this.information.insert_trace("Game started.");

        this.soundGen.play("start");

        const block = this.random_block();
        this.set_block(block);

        this.information.change_status(EXECUTION_RUNNING);
        window.onkeydown = this.move.bind(this);

        this.execution = setInterval(() => {

            this.move_block_y(1);
        }, this.speed);
    }

    active_debug() {
        this.debug = true;
    }

    deactive_debug() {
        this.debug = false;
    }

    stop_execution() {
        clearInterval(this.execution);
        this.execution = undefined;
        this.information.change_status(EXECUTION_STOPPED);
        this.information.insert_trace("Game stopped.");
        this.information.swow_message("Game Over!");
    }

    move(event) {
        if (this.execution != undefined) {
            if (event.key == "ArrowRight") {
                this.soundGen.play("move");
                this.move_block_x(1);
            }
            if (event.key == "ArrowLeft") {
                this.soundGen.play("move");
                this.move_block_x(-1);
            }
            if (event.key == "ArrowDown") {
                this.soundGen.play("move");
                this.move_block_y(1);
            }
            /*if (event.key == "ArrowUp") {
                this.move_block_y(-1);
            }*/
            if (event.key == " " || event.key == "m") {
                this.soundGen.play("mirror");
                this.mirror_block();
            }
            if (event.key == "ArrowUp" || event.key == "r") {
                this.soundGen.play("rotate");
                this.rotate_block();
            }
            if (event.key == "s") {
                switch_mute();
            }
        }
    }

    random_block() {
        const index = Math.floor(Math.random() * BLOCKS.length);
        const color = Math.floor(Math.random() * (9 - 2 + 1)) + 2;

        const middle_block = BLOCKS[index][0].length / 2;
        const middle_panel = this.width / 2;
        const position = Math.round(middle_panel - middle_block);

        return new Block(BLOCKS[index], color, position, 0);
    }

    draw() {
        let container = document.getElementById("panel");
        container.innerHTML = "";
        let table = document.createElement("table");

        for (const panel_row of this.matrix) {
            let row = document.createElement("tr");
            for (const panel_field of panel_row) {
                let field = document.createElement("td");
                let value_container = document.createElement("div");

                if (this.debug) {
                    value_container.textContent = panel_field;
                    value_container.classList.add("debug-text");
                }

                value_container.classList.add("color-" + panel_field);
                value_container.classList.add("block-fragment");

                if (panel_field == 0) {
                    value_container.classList.add("void");
                }

                if (panel_field == FIELD_DYNAMIC) {
                    value_container.classList.add("dynamic");
                    value_container.classList.add("color-" + this.block.color);
                }

                field.appendChild(value_container);
                row.appendChild((field));
            }
            table.appendChild(row);
        }

        container.appendChild(table);
    }

    set_block(block) {
        this.block = block;
        const blocked = this.update_block();
        if (blocked == STATUS_COLLISION) {
            this.clean_block();
            this.soundGen.play("gameover")
            this.stop_execution();
        }

        if (blocked != STATUS_COLLISION) {
            this.information.increment_blocks();
        }

        this.draw();
    }

    clean_block() {
        this.update_block(FIELD_VOID)
    }

    update_block(force_field) {
        for (const [index_y, row] of this.block.block.entries()) {
            for (const [index_x, field] of row.entries()) {
                if (field != 0) {
                    const height = this.block.y + index_y;
                    const ok_height = 0 <= height && height < this.height;

                    const width = this.block.x + index_x;
                    const ok_width = 0 <= width && width < this.width;

                    const is_void = ok_height && this.matrix[this.block.y + index_y][this.block.x + index_x] < 2;

                    if (ok_height && ok_width && is_void) {
                        const value = force_field != undefined ? force_field : field;
                        this.matrix[this.block.y + index_y][this.block.x + index_x] = value;
                    } else {
                        return STATUS_COLLISION;
                    }
                }
            }
        }
        return STATUS_SUCCESS;
    }

    fix_block() {
        this.update_block(this.block.color);
        this.block = this.random_block();
        this.set_block(this.block);
    }

    move_block_x(increment) {
        this.clean_block();
        this.block.x = this.block.x + increment
        if (this.update_block() == STATUS_COLLISION) {
            this.clean_block();
            this.block.x = this.block.x + (increment * - 1)
            this.update_block();
        }
        this.draw();
    }

    move_block_y(increment) {
        this.clean_block();
        this.block.y = this.block.y + increment
        if (this.update_block() != STATUS_COLLISION) {
            this.draw();
            return;
        }

        this.clean_block();
        this.block.y = this.block.y + (increment * - 1)
        this.update_block();
        if (increment > 0) {
            this.fix_block();
            this.soundGen.play("drop");
            this.check_rows();
        }
    }

    rotate_block() {
        this.clean_block();
        const original = this.block;
        this.block = this.block.rotate();
        if (this.update_block() == STATUS_COLLISION) {
            this.clean_block();
            this.block = original;
            this.update_block();
        }
        this.draw();
    }

    mirror_block() {
        this.clean_block();
        const original = this.block;
        this.block = this.block.mirror();
        if (this.update_block() == STATUS_COLLISION) {
            this.clean_block();
            this.block = original;
            this.update_block();
        }
        this.draw();
    }

    check_rows() {
        for (let index = this.matrix.length - 1; index >= 0; index--) {
            const row = this.matrix[index];

            const status = this.check_row(row);
            if (status == STATUS_KO) {
                continue;
            }

            this.remove_row(index);
            index = index + 1;

            this.information.increment_score(100 * status);

            let message = "";
            if (status == STATUS_OK) {
                this.information.insert_trace("Line removed.");
                const position = Math.floor(Math.random() * MESSAGES.length);
                message = MESSAGES[position];
                this.soundGen.play("line");
            }
            if (status == STATUS_OK_PLUS) {
                this.information.insert_trace("Color line removed.");
                const position = Math.floor(Math.random() * MESSAGES_PLUS.length);
                message = MESSAGES_PLUS[position];
                this.soundGen.play("line-color");
            }

            this.information.swow_message(message);
        }
    }

    check_row(row) {
        let element;
        for (const field of row) {
            if (element == undefined) {
                element = field;
            }

            if (element != field) {
                element = -1;
                if (this.xtreme_difficult) {
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

    remove_row(index) {
        this.clean_block();
        this.matrix.splice(index, 1);
        this.matrix.unshift(this.new_row());
        this.update_block();
        this.information.increment_lines();
        this.draw();
    }

    new_table() {
        let table = new Array(this.height);
        table.fill([]);
        return table.map((_, index) => table[index] = this.new_row());
    }

    new_row() {
        let row = new Array(this.width);
        row.fill(FIELD_VOID);
        return row;
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
            for (let x = this.block[y].length - 1; x >= 0 ; x--) {
                const value = this.block[y][x];
                row.push(value);
            }
            result.push(row);
        }
        return new Block(result, this.color, this.x, this.y);
    }

    rotate_copy() {
        this.block = this.rotate_copy().block;
    }

}

class Information {

    score;
    blocks;
    lines;
    start;
    traces;

    constructor() {
        this.score = 0;
        this.blocks = 0;
        this.lines = 0;
        this.start = Date.now();
        this.traces = [];
    }

    increment_score(increment) {
        const score_container = document.getElementById("execution-score");
        this.score = this.score + increment;
        score_container.innerText = this.score;
    }

    change_status(status) {
        const stauts_container = document.getElementById("execution-status");
        stauts_container.innerText = status;
    }

    swow_message(message) {
        const message_container = document.getElementById("execution-message");
        message_container.innerHTML = message;
        setTimeout(() => {
            message_container.innerHTML = ""
        }, 1000);
    }

    insert_trace(trace) {
        this.traces.push(trace);
        this.print_data();
    }

    increment_blocks() {
        this.blocks = this.blocks + 1;
        this.print_data();
    }

    increment_lines() {
        this.lines = this.lines + 1;
        this.print_data();
    }

    print_data() {
        const score_container = document.getElementById("r-sidebar-body");
        score_container.innerHTML = "";

        const blocks = document.createElement("span");
        blocks.classList.add("trace");
        blocks.textContent = "# Blocks spawned: " + this.blocks;

        score_container.appendChild(blocks);

        const lines = document.createElement("span");
        lines.classList.add("trace");
        lines.textContent = "# Lines removed: " + this.lines;

        score_container.appendChild(lines);

        score_container.appendChild(document.createElement("br"));

        for (const message of this.traces) {
            const node = document.createElement("span");
            node.classList.add("trace");
            node.innerHTML = "&nbsp;&nbsp;> " + message;
            score_container.appendChild(node);
        }
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
        if(this.mute) {
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
        }

        return this;
    }

    beep(frequency, duration, type, when) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        if(type == undefined) {
            type = "sine";
        }

        if(when == undefined) {
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

    noise(duration) {
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.2;
        }

        const noiseSource = this.audioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.connect(this.audioCtx.destination);
        noiseSource.start();
        
        return this;
    }

}

function switch_mute() {
    globalMute = !game.soundGen.mute;
    const icon = globalMute ? "🔈" : "🔊";
    game.soundGen.setMute(globalMute);
    const button = document.getElementById("mute-button");
    game.soundGen.play("unmute");
    button.innerText = icon;
}