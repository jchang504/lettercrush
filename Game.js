// Implements the Game class for Letterpress Victory 2.0

/* constructor for a Game
 * REQUIRES: aName is a string, aMyTurn is a boolean, aBoard is a valid
 * board 25-array of tiles (each is an array of [letter, color])),
 * aPlayedMoves is an array of strings representing valid words that have
 * been played, and aDate is the current date (a Date object)
 * ENSURES: returns a Game representing these facts
 */
function Game(aName, aMyTurn, aBoard, aPlayedMoves, aDate) {
  // public variables
  this.name = aName;
  // private variables
  var myTurn = aMyTurn;
  var board = aBoard;
  var playedMoves = aPlayedMoves;
  var date = aDate;
  var bestMoves = null;

  // Getters
  this.isMyTurn = function() {
    return myTurn;
  }
  this.getBoard = function() {
    return board;
  }
  this.getPlayedMoves = function() {
    return playedMoves;
  }

  //temporary
  this.printBoard = function() {
    var boardString = '';
    for (var r = 0; r < 5; r++) {
      boardString += '[';
      for (var c = 0; c < 5; c++) {
        boardString += ' ' + String(board[5*r+c][1]);
      }
      boardString += ' ]\n';
    }
    console.log(boardString);
  }
  //temporary

  // privileged methods
  /* Find and set the bestMoves
   * REQUIRES: timeLimit is a time limit in seconds (minimum 1)
   * ENSURES: finds and sets the bestMoves within at most timeLimit seconds
   */
  this.findBestMoves = function(timeLimit) {
    var count = 0;
    var endTime = new Date().getTime() + 1000*timeLimit;
    for (var i = 0; i < 1000000000; i++) {
      if (count % 1000000 == 0 && new Date().getTime() >= endTime) {
        console.log('Timed out.');
        break;
      }
      count++;
    }
    console.log(count);
  }

  /* REQUIRES: move is a bit (number) array of length 25
   * ENSURES: returns the value of the board after this move
   */
  this.valueMove = function(move) {
    var gameClone = clone();
    gameClone.playMove(move);
    return gameClone.valueBoard();
  }

  this.valueBoard = function() {
    var sum = 0;
    for (var i = 0; i < 25; i++) {
      sum += board[i][1];
    }
    return sum;
  }

  // move is a bit (number) array of length 25
  this.playMove = function(move) {
    var color = myTurn ? 1 : -1;
    for (var i = 0; i < 25; i++) {
      if (move[i] == 1 && Math.abs(board[i][1]) != 2) {
        board[i][1] = color;
      }
    }
    updateColors();
    myTurn = !myTurn;
  }

  // private methods
  function updateColors() {
    for (var r = 0; r < 5; r++)
    {
      for (var c = 0; c < 5; c++) {
        var myColor = board[5*r+c][1];
        // if not white...
        if (myColor != 0) {
          if (r > 0 && board[5*(r-1)+c][1] * myColor <= 0 ||
              r < 4 && board[5*(r+1)+c][1] * myColor <= 0 ||
              c > 0 && board[5*r+(c-1)][1] * myColor <= 0 ||
              c < 4 && board[5*r+(c+1)][1] * myColor <= 0) {
            board[5*r+c][1] = (myColor > 0) ? 1 : -1;
          }
          else {
            board[5*r+c][1] = (myColor > 0) ? 2 : -2;
          }
        }
      }
    }
  }

  // returns a nameless, dateless clone of this Game
  function clone() {
    var boardClone = [];
    for (var i = 0; i < 25; i++) {
      boardClone[i] = board[i].slice(0);
    }
    return new Game(null, myTurn, boardClone, playedMoves.slice(0), null);
  }

}
