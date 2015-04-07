/*
 * Grid类
 * 2048游戏的模型类
 */

//构造函数
function Grid(size) {
    this.size = size;
    this.cells = [];
    for(var i = 0; i < this.size; i++) {
        var row = [];
        for(var j = 0; j < this.size; j++)
            row.push(null);
        this.cells.push(row);
    }
}

//随机设置一个空着的单元格，并返回该单元格
Grid.prototype.SetRandomEmptyCell = function() {
    var emptyCells = this.GetEmptyCells();
    if(emptyCells.length == 0) 
        return null;
    var cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.cells[cell.x][cell.y] = Math.random() < 0.9 ? 2 : 4;
    return cell;
};

Grid.prototype.GetEmptyCells = function() {
    var emptyCells = [];
    for(var i = 0; i < this.size; i++)
        for(var j =0; j < this.size; j++)
            if(this.cells[i][j] == null)
                emptyCells.push({x:i,y:j});
    return emptyCells;
};

//根据不同方向遍历的向量
//a[x][y] 向上遍历时x-1,y不变（0）
Grid.vector = {
    up:{x:-1,y:0},//up
    down:{x:1,y:0},//down
    right:{x:0,y:1},//right
    left:{x:0,y:-1}//left
};

//遍历路径
Grid.prototype.GetDirectionPath = function(vector) {
    var x = [], y = [];
    for(var i = 0; i < this.size; i++) {
        x.push(i);
        y.push(i);
    }
    if(vector.x == 1) x.reverse();
    if(vector.y == 1) y.reverse();
    return {x:x,y:y};
}
//移动
Grid.prototype.Move = function(vector) {
    var path = this.GetDirectionPath(vector);
    var that = this;
    var move = [];
    var merged = [];
    for(var i = 0; i < this.size; i++) {
        merged.push([]);
        for(var j = 0; j < this.size; j++)
            merged[i].push(0);
    }
        
    //遍历并移动
    path.x.forEach(function(i){
        path.y.forEach(function(j){
            if(that.cells[i][j]) {
                var newCellx = i + vector.x;
                var newCelly = j + vector.y;
                    
                while(newCellx >= 0 && newCellx < that.size && newCelly >= 0 && newCelly < that.size) {
                    //寻找vector方向第一个非空的位置
                    if(that.cells[newCellx][newCelly])
                        break
                    else{
                        newCellx = newCellx + vector.x;
                        newCelly = newCelly + vector.y;
                    }
                }
                if(newCellx >= 0 && newCellx < that.size && newCelly >= 0 && newCelly < that.size &&
                   !merged[newCellx][newCelly] && that.cells[newCellx][newCelly] == that.cells[i][j]) {
                    //如果该非空位置的值和当前值相等，合并
                    //that.Print();
                    console.log("move from " + i + " " + j + " to " + newCellx + " " + newCelly + " merge");
                    that.cells[newCellx][newCelly] = that.cells[i][j] * 2;
                    that.cells[i][j] = null;
                    merged[newCellx][newCelly] = 1;
                    move.push({from:{x:i,y:j},to:{x:newCellx,y:newCelly},merge:1});
                }else{//向后移动一格
                    newCellx = newCellx - vector.x;
                    newCelly = newCelly - vector.y;
                    if(newCellx == i && newCelly == j)
                        ;
                    else{
                        //that.Print();
                        console.log("move from " + i + " " + j + " to " + newCellx + " " + newCelly);
                        that.cells[newCellx][newCelly] = that.cells[i][j];
                        that.cells[i][j] = null;
                        move.push({from:{x:i,y:j},to:{x:newCellx,y:newCelly}});
                    }
                }
            }
        });
    });
    //console.log(move);
    return move;
}

//按键映射
var keyMap = {
    38:Grid.vector.up,
    87:Grid.vector.up,
    39:Grid.vector.right,
    68:Grid.vector.right,
    40:Grid.vector.down,
    83:Grid.vector.down,
    37:Grid.vector.left,
    65:Grid.vector.left,
}
/*
 * 调试相关
 */
Grid.prototype.Print = function() {
    for(var i = 0; i < this.cells.length; i++) {
        var s = "";
        for(var j = 0; j < this.cells[i].length; j++) {
            if(this.cells[i][j] == null)
                s = s + "0" + "\t";
            else
                s = s + this.cells[i][j] + "\t"; 
        }
        console.log(s);
    }
}
Grid.prototype.u = function() {
    return this.Play(Grid.vector.up);
}
Grid.prototype.d = function() {
    return this.Play(Grid.vector.down);
}
Grid.prototype.r = function() {
    return this.Play(Grid.vector.right);
}
Grid.prototype.l = function() {
    return this.Play(Grid.vector.left);
}
Grid.prototype.Play = function(vector) {
    var m = this.Move(vector);
    if(m.length == 0)
        console.log("can't move")
    else
        this.SetRandomEmptyCell()
    this.Print();
    return m;
}

