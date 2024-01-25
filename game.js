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


let game;;

window.onload = start_game;

function start_game() {
    game = new Tetris(31, 20, 350);
    //game.active_debug();
    game.launch();
}


class Tetris {

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
        const block = this.random_block();
        this.set_block(block);
    
        this.information.change_status(EXECUTION_RUNNING);
        window.onkeydown = this.move.bind(this);
    
        this.execution = setInterval(()=> {
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
        this.information.swow_message("Game Over!")
    }
    
    move(event) {
        if(this.execution != undefined) {
            if(event.key == "ArrowRight") {
                this.move_block_x(1);
            }
            if(event.key == "ArrowLeft") {
                this.move_block_x(-1);
            }
            if(event.key == "ArrowDown") {
                this.move_block_y(1);
            }
            if(event.key == "ArrowUp") {
                //this.move_block_y(-1);
            }
            if(event.key == "r") {
                this.rotate_block();
            }
        }
    }
    
    random_block() {
        const index = Math.floor(Math.random() * BLOCKS.length);
        const color =  Math.floor(Math.random() * (9 - 2 + 1)) + 2;
    
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

                if(this.debug) {
                    value_container.textContent = panel_field;
                    value_container.classList.add("debug-text");
                }

                value_container.classList.add("color-" + panel_field);
                value_container.classList.add("block-fragment");

                if(panel_field == 0) {
                    value_container.classList.add("void");
                }

                if(panel_field == FIELD_DYNAMIC) {
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
        if(blocked == STATUS_COLLISION) {
            this.clean_block();
            this.stop_execution();
        }
        this.draw();
    }

    clean_block() {
        this.update_block(FIELD_VOID)  
    }

    update_block(force_field) {
        for (const [index_y, row] of this.block.block.entries()) {
            for (const [index_x, field] of row.entries()) {
                if(field != 0) {
                    const height = this.block.y + index_y;
                    const ok_height = 0 <= height && height < this.height;
    
                    const width = this.block.x + index_x;
                    const ok_width = 0 <= width && width < this.width;
    
                    const is_void = ok_height && this.matrix[this.block.y + index_y][this.block.x + index_x] < 2;
                    
                    if(ok_height && ok_width && is_void) {
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
        if(this.update_block() == STATUS_COLLISION) {
            this.clean_block();
            this.block.x = this.block.x + (increment * - 1)
            this.update_block();
        }
        this.draw();
    }
    
    move_block_y(increment) {
        this.clean_block();
        this.block.y = this.block.y + increment
        if(this.update_block() == STATUS_COLLISION) {
            this.clean_block();
            this.block.y = this.block.y + (increment * - 1)
            this.update_block();
            if(increment > 0 ) {
                this.fix_block();
                this.check_rows();
            }
        }
        this.draw();
    }

    rotate_block() {
        this.clean_block();
        const original = this.block;
        this.block = this.block.rotate();
        if(this.update_block() == STATUS_COLLISION) {
            this.clean_block();
            this.block = original;
            this.update_block();
        }
        this.draw();
    }

    check_rows() {
        for (let index = this.matrix.length -1; index >= 0; index--) {
            const row = this.matrix[index];

            const status = this.check_row(row);
            if(status == STATUS_KO) {
                return;
            }

            this.remove_row(index);
            index = index + 1;

            this.information.increment_score(100 * status);

            let message = "";
            if(status == STATUS_OK) {
                const position = Math.floor(Math.random() * MESSAGES.length);
                message = MESSAGES[position];
            }
            if(status == STATUS_OK_PLUS) {
                const position = Math.floor(Math.random() * MESSAGES_PLUS.length);
                message = MESSAGES_PLUS[position];
            }

            this.information.swow_message(message);
        }
    }

    check_row(row) {
        let element;
        for (const field of row) {
            if(element == undefined) {
                element = field;
            }

            if(element != field) {
                element = -1;
                if(this.xtreme_difficult) {
                    return STATUS_KO;
                }
            }

            if(field == 0) {
                return STATUS_KO;
            }
        }

        if(element == -1) {
            return STATUS_OK
        }

        return STATUS_OK_PLUS;
    }

    remove_row(index) {
        this.clean_block();
        this.matrix.splice(index, 1);
        this.matrix.unshift(this.new_row());
        this.update_block();
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
                row.push(value)
            }
            result.push(row)
        }
        return new Block(result, this.color, this.x, this.y);
    }

    rotate_copy() {
        this.block = this.rotate_copy().block;
    }

}

class Information {

    score;

    constructor() {
        this.score = 0;
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
        setTimeout(()=> {
            message_container.innerHTML = ""
        }, 1000);
    }

}