const STATUS_COLLISION = -1;
const STATUS_SUCCESS = 1;

const FIELD_VOID = 0;
const FIELD_DYNAMIC = 1;

let run = true;
let height = 30;
let width = 25;

let panel;

window.onload = start;
window.onkeydown = move;

function start() {

    panel = new Panel(height, width);
    let block = new Block(square, 2, 12, 0);

    panel.set_block(block);

    /*setInterval(()=> {
        console.log("move!")
        panel.update()
    }, 500)*/

}

function move(event) {
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
        panel.move_block_y(-1);
    }
}

class Panel {

    height = 0;
    width = 0;

    matrix = [];
    block = undefined;

    constructor(height, width) {
        this.height = height
        this.width = width
        for(var i = 0; i < height; i++) {
            let row = []
            for(var j = 0; j < width; j++) {
                row.push(0);
            }
            this.matrix.push(row);
        }
    }

    draw() {
        let container = document.getElementById("panel");
        container.innerHTML = "";
        let table = document.createElement("table");
    
        for (const panel_row of this.matrix) {
            let row = document.createElement("tr");
            for (const panel_field of panel_row) {
                let field = document.createElement("td");
                field.textContent = panel_field;
                field.classList.add("color-" + panel_field);
                if(panel_field == FIELD_DYNAMIC) {
                    field.classList.add("dynamic-element");
                }
                row.appendChild((field));
            }
            table.appendChild(row);
        }
    
        container.appendChild(table);
    }

    set_block(block) {
        this.block = block;
        this.update_block();
        this.draw();
    }

    clean_block() {
        this.update_block(FIELD_VOID)  
    }

    update_block(force_field) {
        for (const [index_y, row] of this.block.block.entries()) {
            for (const [index_x, field] of row.entries()) {

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
        return STATUS_SUCCESS;
    }  

    fix_block() {
        this.update_block(this.block.color);
        this.block = new Block(square, 2, 12, 0);
        this.update_block();
        this.draw();
    }  

    move_block_x(increment) {
        this.clean_block()
        this.block.x = this.block.x + increment
        if(this.update_block() == STATUS_COLLISION) {
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
            }
        }
        this.draw();
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

}

const square = [
    [1, 1],
    [1, 1],
]