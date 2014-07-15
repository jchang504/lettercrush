// Implements the Game class for Letterpress Victory 2.0

// global constant variable
BOARD_MAX = 50;
BOARD_MIN = -50;

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
  var bestMoveValues = null;

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
  this.findBestMoves = function(TST, timeLimit) {
    /*
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
    */
    // NAIVE ALGORITHM, no lookahead, evaluate as you generate, keep 5
    bestMoves = [null];
    bestMovesValue = [BOARD_MIN];
    var tilesUsed = [];
    for (var i = 0; i < 25; i++) {
      tilesUsed[i] = 0;
    }
    var movesList = findMoves(TST, tilesUsed, 1);
    console.log('movesList.length: ' + String(movesList.length));
  }

  // private helper methods for findBestMoves

  /* REQUIRES: tilesUsed has 0 for all unused tiles, and used tiles
   * are numbered in order of use. letterNum is one more than the number
   * of tiles used so far.
   * ENSURES: Find and returns an array of possible moves
   */
  function findMoves(TSTNode, tilesUsed, letterNum) {
    var moveList = [];
    for (var i = 0; i < 25; i++) {
      if (tilesUsed[i] == 0) {
        var curr = TSTNode.findSibling(board[i][0]);
        if (curr != null) {
          // add the letter of curr to the used tiles
          var newTilesUsed = tilesUsed.slice(0);
          newTilesUsed[i] = letterNum;
          var next = curr.getNext();
          if (next != null) { // if we can continue, add these
            moveList = findMoves(next, newTilesUsed, letterNum+1);
            if (curr.isEndsWord()) { // if this is also a word, add it
              moveList.push(newTilesUsed);
            }
          }
          else { // we can't continue, so this must be a word; add it
            moveList.push(newTilesUsed);
          }
        }
      }
    }
    return moveList;
  }

  /* Sorts the tiles in the board into vulnerable (light red or white)
   * and invulnerable lists. Returns a random ordering where all the
   * vulnerable tiles occur first, then the invulnerables.
   */
  function makeTileOrder() {
    var redAndWhite = [];
    var blueAndLocked = [];
    for (var i = 0; i < 25; i++) {
      var letter = board[i][0];
      var index = letter.charCodeAt(0) - 97;
      if (board[i][1] > 0 || board[i][1] == -2) {
        if (blueAndLocked[index]) { // if this letter has been added
          blueAndLocked[index][1]++;
        }
        else {
          blueAndLocked[index] = [letter, 1];
        }
      }
      else {
        if (redAndWhite[index]) {
          redAndWhite[index][1]++;
        }
        else {
          redAndWhite[index] = [letter, 1];
        }
      }
    }
    // We only need to eliminate the undefined elements of the array,
    // so this dummy function will work
    var dummyFunc = function() { return true; };
    var first = redAndWhite.filter(dummyFunc);
    var second = blueAndLocked.filter(dummyFunc);
    shuffle(first);
    shuffle(second);
    return first.concat(second);
  }

  // Randomly shuffles the tiles IN PLACE by the KFY shuffle algorithm
  function shuffle(tiles) {
    for (var i = tiles.length - 1; i > 0; i--) {
      var r = Math.floor(Math.random()*(i+1));
      var temp = tiles[i];
      tiles[i] = tiles[r];
      tiles[r] = temp;
    }
  }

  // privileged methods

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
