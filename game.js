const STATUS_COLLISION = -1;
const STATUS_SUCCESS = 1;

const STATUS_KO = -1;
const STATUS_OK = 1;

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

let execution = undefined;

let height = 31;
let width = 20;

let speed = 500;
let xtreme_difficult = false;

let debug = false;

let panel;

window.onload = start_execution;
window.onkeydown = move;

function start_execution() {
    panel = new Panel(height, width);

    const block = random_block();
    panel.set_block(block);

    change_status(EXECUTION_RUNNING);

    execution = setInterval(()=> {
        panel.move_block_y(1);
    }, speed);
}

function stop_execution() {
    clearInterval(execution);
    execution = undefined;
    change_status(EXECUTION_STOPPED);
}

function move(event) {
    if(execution != undefined) {
        if(event.key == "ArrowRight") {
            panel.move_block_x(1);
        }
        if(event.key == "ArrowLeft") {
            panel.move_block_x(-1);
        }
        if(event.key == "ArrowDown") {
            panel.move_block_y(1);
        }
        if(event.key == "ArrowUp") {
            //panel.move_block_y(-1);
        }
        if(event.key == "r") {
            panel.rotate_block();
        }
    }
}

function random_block() {
    const index = Math.floor(Math.random() * BLOCKS.length);
    const color =  Math.floor(Math.random() * (9 - 2 + 1)) + 2;

    const middle_block = BLOCKS[index][0].length / 2;
    const middle_panel = width / 2;
    const position = Math.round(middle_panel - middle_block);
    return new Block(BLOCKS[index], color, position, 0);
}

function increment_score(increment) {
    const score_container = document.getElementById("score-value");
    const score = parseInt(score_container.innerText, 10) + increment;
    score_container.innerText = score;
}

function change_status(status) {
    const stauts_container = document.getElementById("execution-status");
    stauts_container.innerText = status;
}

class Panel {

    height = 0;
    width = 0;

    score = 0;

    matrix = [];
    block = undefined;

    constructor(height, width) {
        this.height = height;
        this.width = width;
        this.matrix = this.new_table();
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

                if(debug) {
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
            stop_execution();
            return;
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
        this.block = random_block();
        this.set_block(this.block);
    }  

    move_block_x(increment) {
        this.clean_block()
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
        this.block.rotate();
        this.update_block();
        this.draw();
    }

    check_rows() {
        for (let index = this.matrix.length -1; index >= 0; index--) {
            const row = this.matrix[index];
            const is_filled = this.check_row(row);
            if(is_filled == STATUS_OK) {
                this.remove_row(index);
                index = index + 1;
                increment_score(100);
            }
        }
    }

    check_row(row) {
        let element;
        for (const field of row) {
            if(element == undefined) {
                element = field;
            }
            if(xtreme_difficult) {
                if(element != field) {
                    return STATUS_KO;
                }
            }
            if(!xtreme_difficult) {
                if(field == 0) {
                    return STATUS_KO;
                }
            }
        }
        return element == FIELD_VOID ? STATUS_KO : STATUS_OK;
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
        this.block = result;
    }

}