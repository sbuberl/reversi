(function() {
    var stage = null;

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

            var blackScore = this.blackPlayer.points;
            var whiteScore = this.whitePlayer.points;

            var hasUserMoves = this.user.availableMoves.length != 0;
            var hasAiMoves = this.ai.availableMoves.length != 0;
            if ((hasUserMoves|| hasAiMoves) || (blackScore != 0 && whiteScore != 0 && blackScore + whiteScore != 64)) {
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

            var cells = Grid.cells;
            for (var row = 0; row < 8; ++row) {
                for (var col = 0; col < 8; ++col) {
                    var cell = cells[row][col];
                    var cellPiece = cell.piece;
                    if(cellPiece == Piece.black) {
                        ++blackScore;
                    } else  if(cellPiece == Piece.white) {
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
            this.user.buildMoveList(this.defaultEvaluator);
            this.ai.buildMoveList(this.behavior.evaluator);
        },
        
        defaultEvaluator : function(row, column) {
            return 1;
        },
        
        addHints : function() {
            var userMoves = this.user.availableMoves;
            var userMoveCount = userMoves.length;
            for (var i = 0; i < userMoveCount; ++i) {
                var move = userMoves[i];
                move.cell.addHint();
            }
        },
        
        removeHints : function() {
            var userMoves = this.user.availableMoves;
            var userMoveCount = userMoves.length;
            for (var i = 0; i < userMoveCount; ++i) {
                var move = userMoves[i];
                move.cell.removeHint();
            }
        },
    };
    
    var Scoreboard = {
        height : 51,
        
        draw : function() {
            this.background = new createjs.Shape();
            this.background.graphics.beginFill("#0BA31C").drawRect(1, 1, 407, 50);
            
            this.blackPiece = new createjs.Shape();
            this.blackPiece.graphics.beginStroke("black").beginFill("black").arc(30, 25, 15, 0, Math.PI * 2, false);
            
            this.whitePiece = new createjs.Shape();
            this.whitePiece.graphics.beginStroke("black").beginFill("white").arc(350, 25, 15, 0, Math.PI * 2, false);
            
            stage.addChild(this.background, this.blackPiece, this.whitePiece);
        },
        
        showScores : function(blackScore, whiteScore) {
            this.removeOldText();
            this.blackText = this.buildScoreText(blackScore, 60);
            this.whiteText = this.buildScoreText(whiteScore, 380);
            stage.update();
        },
        
        buildScoreText : function(score, x) {
            var text = new createjs.Text(score, "20px Arial", "black");
            text.x = x;
            text.y = 15;
            
            stage.addChild(text);
            return text;
        },
        
        removeOldText : function() {
            if(this.blackText != null) {
                stage.removeChild(this.blackText);
                this.blackText = null;
            }
            if(this.whiteText != null) {
                stage.removeChild(this.whiteText);
                this.whiteText = null;
            }
        }
    };

    function Cell(row, col, x, y) {
        this.row = row;
        this.column = col;
        this.x = x;
        this.y = y;
        this.piece = Piece.none;
    }

    Cell.prototype.drawRect  = function(parent) {
        if(!this.rectangle) {
            this.rectangle = new createjs.Shape();
            this.rectangle.graphics.beginFill("#0BA31C").drawRect(this.x, this.y, 50, 50);
            this.rectangle.on("click", this.onClick, this);
            parent.addChild(this.rectangle);
        }
    };

    Cell.prototype.addPiece = function(piece) {
        if (this.piece == Piece.none) {
            var index = Grid.emptyCells.indexOf(this);
            if (index != -1) {
                Grid.emptyCells.splice(index, 1);
            }
            this.rectangle.off("click", this.onClick);
        }
        
        this.piece = piece;
        this.pieceShape = new createjs.Shape();

        var pieceX = this.x + 25;
        var pieceY = this.y + 25;
        this.pieceShape.graphics.beginStroke("black").beginFill(piece).arc(pieceX, pieceY, 23, 0, Math.PI * 2, false);
        this.rectangle.parent.addChild(this.pieceShape);
        stage.update();
    };
    
    Cell.prototype.flip = function(newPiece) {
        if (this.piece != Piece.none) {
            this.removePiece();
            this.addPiece(newPiece);
        }
    };
    
    Cell.prototype.addHint = function() {
        this.hintShape = new createjs.Shape();
        var pieceX = this.x + 25;
        var pieceY = this.y + 25;
        this.hintShape.graphics.beginStroke("black").beginFill("#00FFFF").arc(pieceX, pieceY, 5, 0, Math.PI * 2, false);
        this.rectangle.parent.addChild(this.hintShape);
        stage.update();
    };

    Cell.prototype.removeHint = function() {
        if(this.hintShape != null) {
            this.hintShape.parent.removeChild(this.hintShape);
            this.hintShape = null;
            stage.update();
        }
    };
    
    Cell.prototype.removePiece = function() {
        if(this.pieceShape != null) {
            this.pieceShape.parent.removeChild(this.pieceShape);
            this.pieceShape = null;
            stage.update();
        }

    };
    
    Cell.prototype.clear = function() {
        this.piece = Piece.none;
        this.removePiece();
        this.removeHint();
    };
    
    Cell.prototype.onClick = function(event) {
        if (Game.isUserTurn && this.piece == Piece.none) {
            var user = Game.user;
            var move = user.getValidMove(this);
            if(move !== null) {
                user.play(move);
            }
        }
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
            this.availableMoves = [];
        },

        play: function(move) {
            if(!move) {
                return;
            }
            move.cell.addPiece(this.piece);
            this.flipAdjacent(move, 0);
        },

        buildMoveList : function(evaluator) {
            this.availableMoves = [];
            var emptyCells = Grid.emptyCells;
            var emptyCount = emptyCells.length;
            for (var i = 0; i < emptyCount; ++i) {
                var empty = emptyCells[i];
                var move = this.buildMove(empty, evaluator);
                if(move !== null) {
                    this.availableMoves.push(move);
                }
            }
        },
        
        getValidMove : function(cell) {
            var movesCount = this.availableMoves.length;
            for (var i = 0; i < movesCount; ++i) {
                var move = this.availableMoves[i];
                if(move.cell == cell) {
                    return move;
                }
            }
            return null;
        },

        buildMove: function(cell, evaluator) {
            var value = 0;
            var flippedLines = [];
            for (var d = 0; d < 8; d++) {
                var direction = this.getDirection(d);
                var result = this.buildLine(cell, evaluator, direction.rowDelta, direction.colDelta);
                if(result !== null) {
                    value += result;
                    flippedLines.push(d);
                }
            }
            
            if(flippedLines.length > 0) {
                return new MoveResult(cell, value, flippedLines);
            } else {
                return null;
            }
        },

        buildLine: function(cell, evaluator, rowDelta, colDelta) {
            var current;
            var stopCol = colDelta > 0 ? 8 : -1;
            var stopRow = rowDelta > 0 ? 8 : -1;
            var oppositeFound = false;
            var value = 0;

            var cells = Grid.cells;
            for (var row = cell.row + rowDelta, col = cell.column + colDelta; row != stopRow && col != stopCol; row += rowDelta, col += colDelta) {
                current = cells[row][col];
                var currentPiece = current.piece;
                if (currentPiece == Piece.none) {
                    break;
                } else if (currentPiece != this.piece) {
                    oppositeFound = true;
                    value += evaluator(current.row, current.column);
                } else {
                    return oppositeFound ? value : null;
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
                var direction = this.getDirection(line);
                var rowDelta = direction.rowDelta;
                var colDelta = direction.colDelta;
                var cell = move.cell;
                this.flipLine(cell.row + rowDelta, cell.column + colDelta, rowDelta, colDelta);
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
                current = Grid.cells[row][col];
                var currentPiece = current.piece;
                if (currentPiece != this.piece && currentPiece != Piece.none) {
                    current.flip(this.piece);
                    window.setTimeout(this.flipLine.bind(this), 75, row + rowDelta, col + colDelta, rowDelta, colDelta);
                    return;
                }
            }
        },

        getDirection: function() {
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
        }()
    });

    var Grid = {

        init: function() {
            var width = Game.width;
            var height = Game.height;
            this.cells = [];
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
            var container = new createjs.Container();
            this.processCells(function(cell) {
                cell.drawRect(container);
            });
            
            stage.addChild(container);
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

        addPiece: function(row, col, piece) {
            var cell = Grid.cells[row][col];
            cell.addPiece(piece);
        }
    };

    var AiBehavior = Class.extend({
        init: function(evaluator) {
            this.evaluator = evaluator;
        },

        chooseMove : function() {},
        
        selectMove: function() {
            var moves = Game.ai.availableMoves;
            if(moves.length > 0) {
                var index = Math.floor(Math.random() * moves.length);
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
                var weight = this.getWeight(move.cell.row, move.cell.column) + move.value;
                if(weight > maxWeight) {
                    maxWeight = weight;
                    bestMove = move;
                }
            }

            return bestMove;
        }
    });

    window.onload = function() {
        stage = new createjs.Stage('c');
        stage.enableMouseOver();

        Game.init();
        
        document.forms.playAgain.addEventListener("submit", function(event) {
                Game.restart();
                window.location.hash = "#close";
            }, false);
        document.forms.playAgain.addEventListener("reset", function(event) {
                window.location.hash = "#close";
            }, false);
            
        Game.start();

        createjs.Ticker.on("tick", stage);
    };
}());