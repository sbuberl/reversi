(function() {
    var Piece = {
        none: "#0BA31C",
        white: "#FFFFFF",
        black: "#000000"
    };

    var Game = {
        canvas: document.getElementById("c"),

        init: function() {
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            Graphics.init(this.canvas);
            Ctrl.init(this.canvas);
            Grid.init();
            this.blackPlayer = new Player(Piece.black);
            this.whitePlayer = new Player(Piece.white);
            Scoreboard.draw();
            Grid.draw();
        },

        start: function() {
            this.settings = Settings.current.clone();
            this.setPlayers();
            if(this.settings.difficulty == "normal") {
                this.behavior = new NormalAiBehavior();
            } else {
                this.behavior = new EasyAiBehavior();
            }
            
            Grid.addPiece(3, 3, Piece.black);
            Grid.addPiece(3, 4, Piece.white);
            Grid.addPiece(4, 3, Piece.white);
            Grid.addPiece(4, 4, Piece.black);
            
            Scoreboard.showScores(2, 2);
            
            this.buildMoveLists();
            
            if(!this.isUserTurn) {
                this.aiTurn();
            } else if(this.settings.showHints) {
                this.addHints();
            }
        },
        
        restart : function() {
            Grid.reset();
            this.start();
        },

        setPlayers : function() {
            var isUserBlack;
            switch(this.settings.colorChoice) {
                case "black":
                    isUserBlack = true;
                    break;
                case "white":
                    isUserBlack = false;
                    break;
                default:
                    isUserBlack = Math.random() >= 0.5;
                    break;
            }
            
            if(isUserBlack) {
                this.user = this.blackPlayer;
                this.ai = this.whitePlayer;
            } else {
                this.user = this.whitePlayer;
                this.ai = this.blackPlayer;
            }
            
            this.isUserTurn = isUserBlack;
        },
        
        switchTurns: function() {
            var showHints = this.settings.showHints;
            if(this.isUserTurn && showHints) {
                this.removeHints();
            }

            this.fixScores();
            this.buildMoveLists();

            var hasUserMoves = this.user.availableMoves().length != 0;
            var hasAiMoves = this.ai.availableMoves().length != 0;
            if (hasUserMoves|| hasAiMoves) {
                if(!hasUserMoves) {
                    this.isUserTurn = false;
                } else if(!hasAiMoves) {
                    this.isUserTurn = true;
                } else {
                    this.isUserTurn = !this.isUserTurn;
                }
                
                if (!this.isUserTurn) {
                    window.setTimeout(this.aiTurn.bind(this), 75);
                } else if(showHints) {
                    this.addHints();
                }
            } else {
                 window.setTimeout(this.gameover.bind(this), 75);
            }
        },

        gameover : function() {
            var userScore = this.user.points;
            var computerScore = this.ai.points;

            var text;
            if(userScore == computerScore)
                text = "Tie Game!";
            else if(userScore > computerScore || computerScore == 0)
                text = "You Win!";
            else
                text = "You Lose!";
                
            document.getElementById('result_text').innerHTML = text;
            window.location.hash = "#gameover";
        },

        fixScores: function() {
            var blackScore = 0;
            var whiteScore = 0;

            var values = Grid.board.values;
            for (var row = 0; row < 8; ++row) {
                for (var col = 0; col < 8; ++col) {
                    var piece = values[row][col];
                    if(piece == Piece.black) {
                        ++blackScore;
                    } else  if(piece == Piece.white) {
                        ++whiteScore;
                    }
                }
            }

            this.blackPlayer.points = blackScore;
            this.whitePlayer.points = whiteScore;
            
            Scoreboard.showScores(blackScore, whiteScore);
        },
        
        aiTurn: function() {
            var move = this.behavior.selectMove();
            this.ai.play(move);
        },
        
        buildMoveLists : function() {
            Grid.board.buildMoveList(this.defaultEvaluator, this.behavior.evaluator);
        },
        
        defaultEvaluator : function(row, column) {
            return 1;
        },
        
        addHints : function() {
            var userMoves = this.user.availableMoves();
            var userMoveCount = userMoves.length;
            for (var i = 0; i < userMoveCount; ++i) {
                var move = userMoves[i];
                var cell = Grid.cells[move.row][move.column];
                cell.addHint();
            }
        },
        
        removeHints : function() {
            var userMoves = this.user.availableMoves();
            var userMoveCount = userMoves.length;
            for (var i = 0; i < userMoveCount; ++i) {
                var move = userMoves[i];
                var cell = Grid.cells[move.row][move.column];
                cell.removeHint();
            }
        },
    };
    
    var Scoreboard = {
        height : 51,
        
        draw : function() {
            Graphics.fillEmptyBlock(1, 1, 407, 50);
            Graphics.drawPiece(30, 25, 15, "black");
            Graphics.drawPiece(350, 25, 15, "white");
        },
        
        showScores : function(blackScore, whiteScore) {
            Graphics.fillEmptyBlock(60, 15, 25, 20);
            Graphics.fillEmptyBlock(380, 15, 25, 20);
            Graphics.showScore(blackScore, 60);
            Graphics.showScore(whiteScore, 380);
        }
    };
    
    var Graphics = {
        init : function(canvas) {
            this.context = canvas.getContext("2d");
        },
        
        fillEmptyBlock : function(x, y, width, height) {
            this.context.fillStyle = "#0BA31C";
            this.context.fillRect(x, y, width, height);
        },
        
        drawPiece : function(x, y, radius, color) {
            this.context.beginPath();
            this.context.strokeStyle = "#000000";
            this.context.arc(x, y, radius, 0, Math.PI * 2, false);
            this.context.fillStyle = color;
            this.context.fill();
            this.context.stroke();
            this.context.closePath();
        },
        
         drawHint : function(x, y) {
            this.context.beginPath();
            this.context.strokeStyle = "#000000";
            var pieceX = x + 25;
            var pieceY = y + 25;
            this.context.arc(pieceX, pieceY, 5, 0, Math.PI * 2, false);
            this.context.fillStyle = "#00FFFF";
            this.context.fill();
            this.context.stroke();
            this.context.closePath();
        },
        
        showScore : function(score, x) {
    		this.context.font = "20px Arial";
			this.context.fillStyle= "black";
			this.context.fillText(score, x, 30);
        }
    };

    function Cell(row, col, x, y) {
        this.row = row;
        this.column = col;
        this.x = x;
        this.y = y;
        this.hasHint = false;
    }

    Cell.prototype.drawRect  = function() {
        Graphics.fillEmptyBlock(this.x, this.y, 50, 50);
    };

    Cell.prototype.addPiece = function(piece) {
        this.hasHint = false;
        Grid.board.setValue(this.row, this.column, piece);
        Graphics.drawPiece(this.x + 25, this.y + 25, 23, piece);
    };
    
    Cell.prototype.addHint = function() {
        Graphics.drawHint(this.x, this.y);
        this.hasHint = true;
    };

    Cell.prototype.removeHint = function() {
        if(this.hasHint) {
            this.drawRect();
            this.hasHint = false;
        }
    };
    
    Cell.prototype.clear = function() {
        Grid.board.setValue(this.row, this.column, Piece.none);
        Graphics.fillEmptyBlock(this.x, this.y, 50, 50);
    };

    function MoveResult(cell, value, flippedLines) {
        this.cell = cell;
        this.value = value;
        this.flippedLines = flippedLines;
    }
    
    var Player = Class.extend({
        init: function(piece) {
            this.piece = piece;
            this.points = 2;
            if(piece == Piece.black) {
                this.availableMoves = function() {
                    return Grid.board.blackMoves;
                };
            } else {
                this.availableMoves = function() {
                    return Grid.board.whiteMoves;
                };
            }
        },

        play: function(move) {
            if(!move) {
                return;
            }
            var cell = Grid.cells[move.row][move.column];
            cell.addPiece(this.piece);
            this.flipAdjacent(move, 0);
        },
        
        getValidMove : function(row, column) {
            var moves = this.availableMoves();
            var movesCount = moves.length;
            for (var i = 0; i < movesCount; ++i) {
                var move = moves[i];
                if(move.row == row && move.column == column) {
                    return move;
                }
            }
            return null;
        },
        
        flipAdjacent : function(move, lineIndex)
        {
            var flippedLines = move.flippedLines;
            if(lineIndex < flippedLines.length)
            {
                var line = flippedLines[lineIndex];
                var direction = Board.getDirection(line);
                var rowDelta = direction.rowDelta;
                var colDelta = direction.colDelta;
                this.flipLine(move.row + rowDelta, move.column + colDelta, rowDelta, colDelta);
                window.setTimeout(this.flipAdjacent.bind(this), 75, move, lineIndex + 1);
            } else {
                window.setTimeout(Game.switchTurns.bind(Game), 300);
            }
        },

        flipLine: function(row, col, rowDelta, colDelta) {
            var current;
            var stopCol = colDelta > 0 ? 8 : -1;
            var stopRow = rowDelta > 0 ? 8 : -1;

            if (row != stopRow && col != stopCol) {
                var current = Grid.board.getValue(row, col);
                if (current != this.piece && current != Piece.none) {
                    var currentCell = Grid.cells[row][col];
                    currentCell.addPiece(this.piece);
                    window.setTimeout(this.flipLine.bind(this), 75, row + rowDelta, col + colDelta, rowDelta, colDelta);
                    return;
                }
            }
        }
    });
    
    function BoardCell(row, column) {
        this.row = row;
        this.column = column;
    }   
    
    function EvaluateResult(row, column, board, value, flippedLines) {
        this.row = row;
        this.column = column;
        this.board = board;
        this.value = value;
        this.flippedLines = flippedLines;
    }    

    function Board(initialize) {
        initialize = typeof initialize !== 'undefined' ?  initialize : true;
        if(initialize) {
            this.values = [];
            this.emptyCells = [];
            this.blackMoves = [];
            this.whiteMoves = [];
            this.userMoves = [];
            this.aiMoves = [];
            
            for (var row = 0; row < 8; row += 1) {
                this.values[row] = [];
                for (var col = 0; col < 8; col += 1) {
                    this.values[row][col] = Piece.none;
                    this.emptyCells.push(new BoardCell(row, col));
                }
            }
        }
    }
    
    Board.prototype.clone = function()
    {
        var newBoard = new Board(false);
        var newValues = [];
        for (var i = 0; i < this.values.length; i++)
            newValues[i] = this.values[i].slice();
        newBoard.values = newValues;
        newBoard.emptyCells = this.emptyCells.slice();
        newBoard.userMoves = this.userMoves.slice();
        newBoard.aiMoves = this.aiMoves.slice();
        if(Game.user.piece == Piece.black) {
            newBoard.blackMoves = newBoard.userMoves;
            newBoard.whiteMoves = newBoard.aiMoves;
        } else {
            newBoard.blackMoves = newBoard.aiMoves;
            newBoard.whiteMoves = newBoard.userMoves;
        }
        
        return newBoard;
    };
    
    Board.prototype.getValue = function(row, col) {
        return this.values[row][col];
    };
    
    Board.prototype.setValue = function(row, col, piece) {
        this.values[row][col] = piece;
        this.removeEmpty(row, col);
    };
    
    Board.prototype.removeEmpty = function(row, col) {
        var emptyCells = this.emptyCells;
        var emptyCount = emptyCells.length;
        for (var i = 0; i < emptyCount; ++i) {
            var empty = emptyCells[i];
            if(empty.row == row && empty.column == col) {
                emptyCells.splice(i, 1);
                return;
            }
        }
    };
    
    Board.prototype.evaluate = function(row, col, piece, evaluator) {
        var tempBoard = this.clone();
        var value = 0;
        var flippedLines = [];
        for (var d = 0; d < 8; d++) {
            var direction = Board.getDirection(d);
            var result = tempBoard.evaluateLine(row, col, piece, evaluator, direction.rowDelta, direction.colDelta);
            if(result !== null) {
                value += result;
                flippedLines.push(d);
            }
        }
        
        if(flippedLines.length > 0) {
            tempBoard.setValue(row, col, piece);
            return new EvaluateResult(row, col, tempBoard, value, flippedLines);
        } else {
            return null;
        }
    };

    Board.prototype.evaluateLine = function(cellRow, cellColumn, piece, evaluator, rowDelta, colDelta) {
        var current;
        var stopCol = colDelta > 0 ? 8 : -1;
        var stopRow = rowDelta > 0 ? 8 : -1;
        var oppositeFound = false;
        var value = 0;

        var cells = this.values;
        for (var row = cellRow + rowDelta, col = cellColumn + colDelta; row != stopRow && col != stopCol; row += rowDelta, col += colDelta) {
            current = cells[row][col];
            if (current == Piece.none) {
                break;
            } else if (current != piece) {
                oppositeFound = true;
                value += evaluator(row, col);
                this.values[row][col] = piece;
            } else {
                return oppositeFound ? value : null;
            }
        }

        return null;
    };
    
    Board.prototype.buildMoveList = function(userEval, aiEval) {
        this.userMoves = [];
        this.aiMoves = [];
        var userPiece = Game.user.piece;
        var aiPiece = Game.ai.piece;
        
        var emptyCells = this.emptyCells;
        var emptyCount = emptyCells.length;
        for (var i = 0; i < emptyCount; ++i) {
            var empty = emptyCells[i];
            this.checkMove(empty, userPiece, this.userMoves, userEval);
            this.checkMove(empty, aiPiece, this.aiMoves, aiEval);
        }
        
        if(Game.user.piece == Piece.black) {
            this.blackMoves = this.userMoves;
            this.whiteMoves = this.aiMoves;
        } else {
            this.blackMoves = this.aiMoves;
            this.whiteMoves = this.userMoves;
        }
    };
    
    Board.prototype.checkMove = function(empty, color, moveList, evaluator) {
        var move = this.evaluate(empty.row, empty.column, color, evaluator);
        if(move !== null) {
            moveList.push(move);
        }
    };
    
    Board.getDirection = function() {
        var directions = [
            { rowDelta: -1, colDelta: -1 },
            { rowDelta: -1, colDelta: 0 },
            { rowDelta: -1, colDelta: 1 },
            { rowDelta: 0, colDelta: -1 },
            { rowDelta: 0, colDelta: 1  },
            { rowDelta: 1, colDelta: -1 },
            { rowDelta: 1, colDelta: 0 },
            { rowDelta: 1, colDelta: 1 }
        ];
        return function(index) {
            return directions[index];
        };
    }();
    
    var Grid = {

        init: function() {
            var width = Game.width;
            var height = Game.height;
            this.cells = [];
            this.board = new Board();
            this.emptyCells = [];
            for (var y = Scoreboard.height + 1, row = 0; y < height; y += 51, row += 1) {
                this.cells[row] = [];
                for (var x = 1, col = 0; x < width; x += 51, col += 1) {
                    var cell = new Cell(row, col, x, y);
                    this.cells[row][col] = cell;
                }
            }
        },

        draw: function() {
            this.processCells(function(cell) {
                cell.drawRect();
            });
        },
        
        reset : function() {
            this.processCells(function(cell) {
                cell.clear();
            });
        },
        
        processCells : function(processor) {
            this.emptyCells = [];
            var numRows = this.cells.length;
            for (var row = 0; row < numRows; row += 1) {
                var numCols = this.cells[row].length;
                for (var col = 0; col < numCols; col += 1) {
                    var cell = this.cells[row][col];
                    this.emptyCells.push(cell);
                    processor(cell);
                }
            }
        },

        addPiece: function(row, col, piece) 
        {
            var cell = Grid.cells[row][col];
            cell.addPiece(piece);
        }
    };
    
    var Ctrl = {        
        init : function(canvas) {
            canvas.addEventListener("click", this.cellClicked, true);
        },

        cellClicked : function(event) {
            if(Game.isUserTurn) {
                var canvas = Game.canvas;
                var gridX = event.pageX - canvas.offsetLeft;
                var gridY = event.pageY - canvas.offsetTop - Scoreboard.height;
                if(gridY >= 0) {
                    var row = Math.floor(gridY/51);
                    var col = Math.floor(gridX/51);  
                    if (Grid.board.getValue(row, col) == Piece.none) {
                        var user = Game.user;
                        var move = user.getValidMove(row, col);
                        if(move !== null) {
                            user.play(move);
                        }
                    }
                }
                
            }
        }
    };

    var AiBehavior = Class.extend({
        init: function(evaluator) {
            this.evaluator = evaluator;
        },

        chooseMove : function() {},
        
        selectMove: function() {
            var moves = Game.ai.availableMoves();
            if(moves.length > 0) {
                return this.chooseMove(moves);
            } else {
                window.setTimeout(Game.switchTurns.bind(Game), 75);
            }
        }
    });

    var EasyAiBehavior = AiBehavior.extend({
        init: function() {
            this._super(Game.defaultEvaluator);
        },

        chooseMove: function(moves) {
            var index = Math.floor(Math.random() * moves.length);
            return moves[index];
        }
    });
    
    var NormalAiBehavior = AiBehavior.extend({
        init: function() {
            this._super(this.getWeight);
        },

        getWeight : function() {
            var weights = [ [100, -10, 10, 6, 6, 10, -10, 100],
						    [-10, -20, 1, 2, 2, 1, -20, -10],
						    [10, 1, 5, 4, 4, 5, 1, 10],
						    [6, 2, 4, 2, 2, 4, 2, 6],
							[6, 2, 4, 2, 2, 4, 2, 6],
						    [10, 1, 5, 4, 4, 5, 1, 10],
						    [-10, -20, 1, 2, 2, 1, -20, -10],
    						[100, -10, 11, 6, 6, 11, -10, 100]];
		    return function(row, col) {
		        return weights[row][col];
		    }
        }(),
        
        chooseMove: function(moves) {
            var maxWeight = -1000;
            var bestMove = null;
            
            var count = moves.length;
            for (var i = 0; i < count; ++i) {
                var move = moves[i];
                var weight = this.getWeight(move.row, move.column) + move.value;
                if(weight > maxWeight) {
                    maxWeight = weight;
                    bestMove = move;
                }
            }

            return bestMove;
        }
    });
                if(weight > maxWeight) {
                    maxWeight = weight;
                    bestMove = move;
                }
            }

            return bestMove;
        }
    });

    window.onload = function() {
        Game.init();
        
        document.forms.playAgain.addEventListener("submit", function(event) {
                Game.restart();
                window.location.hash = "#close";
            }, false);
        document.forms.playAgain.addEventListener("reset", function(event) {
                window.location.hash = "#close";
            }, false);
            
        Game.start();
    };
}());