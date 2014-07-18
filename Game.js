// Implements the Game class for Letterpress Victory 2.0

// global constant variable
BOARD_MAX = 50;
BOARD_MIN = -50;
BEST_MOVES_LEN = 10;

/* constructor for a Game
 * REQUIRES: aName is a string, aMyTurn is a boolean, aBoard is a valid
 * board 25-array of tiles (each is an array of [letter, color])),
 * aPlayedMoves is an array of strings representing valid words that have
 * been played, and aDate is the current date (a Date object)
 * ENSURES: returns a Game representing these facts
 */
function Game(aName, aMyTurn, aBoard, aBlockedWords, aTST) {
  // public variables
  this.name = aName;
  // private variables
  var date = new Date();
  var myTurn = aMyTurn;
  var board = aBoard;
  var blockedWords = aBlockedWords;
  var TST = aTST;
  var bestMoves = null;
  var bestMoveValues = null;
  // block initial words in TST
  for (var i = 0; i < blockedWords.length; i++) {
    TST.block(blockedWords[i]);
  }

  // Getters
  this.isMyTurn = function() {
    return myTurn;
  }
  this.getBoard = function() {
    return board;
  }

  //temporary
  this.printBoard = function() {
    var boardString = '';
    for (var r = 0; r < 5; r++) {
      boardString += '[';
      for (var c = 0; c < 5; c++) {
        var color = board[5*r+c][1];
        if (color >= 0) {
          color = '+' + String(color);
        }
        else {
          color = String(color);
        }
        boardString += ' ' + color + board[5*r+c][0];
      }
      boardString += ' ]\n';
    }
    console.log(boardString);
  }
  //temporary

  // privileged methods

  /* Plays the move on this game, effecting the necessary board changes.
   */
  this.play = function(move) {
    var state = new GameState(myTurn, board, []);
    state.playMove(move);
    board = state.getBoard(); // update board
    TST.block(state.getPlayedWords[0]); // block word in TST
    myTurn = !myTurn; // change turns
  }

  /* Find and set the bestMoves
   * REQUIRES: timeLimit is a time limit in seconds (minimum 1)
   * ENSURES: finds and sets the bestMoves within at most timeLimit seconds
   */
  this.findBestMoves = function(timeLimit) {
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
    bestMoves = new Array(BEST_MOVES_LEN);
    bestMovesValue = new Array(BEST_MOVES_LEN);
    for (var i = 0; i < BEST_MOVES_LEN; i++) {
      bestMoves[i] = null;
      bestMovesValue[i] = BOARD_MIN;
    }
    var start = new Date();
    var alphaPool = mapTileLocations();
    var move = new Array(25);
    for (var i = 0; i < 25; i++) {
      move[i] = -1;
    }
    // generate moves
    var movesList = findMoves(TST, alphaPool, move, 0);
    var end = new Date();
    console.log('movesList.length: ' + String(movesList.length));
    console.log('movesList generation took: ' + String(end - start));
    // evaluate and find the top 10
    var start = new Date();
    var startState = new GameState(true, board, []);
    for (var i = 0; i < movesList.length; i++) {
      var move = movesList[i];
      var moveValue = startState.valueMove(move);
      var insertIndex = BEST_MOVES_LEN;
      for (var j = BEST_MOVES_LEN-1; j >= 0; j--) {
        if (moveValue > bestMovesValue[j]) {
          insertIndex--;
        }
        else { // once it's less, break because the rest are higher
          break;
        }
      }
      if (insertIndex < BEST_MOVES_LEN) {
        bestMoves[insertIndex] = move;
        bestMovesValue[insertIndex] = moveValue;
      }
    }
    var end = new Date();
    console.log('Selecting bestMoves took: ' + String(end - start));
    for (var i = 0; i < BEST_MOVES_LEN; i++) {
      console.log(bestMoves[i]);
    }
  }

  // private helper methods for findBestMoves

  /* REQUIRES: TSTNode is the desired starting node, alphaPool is a pool
   * of letters mapped to positions by mapTileLocations, move is the move
   * constructed so far (represented as a 25-array, initially filled with
   * -1's), and letterNum is the next index to add a letter position in
   * move (i.e. the number (position) of the next letter in the
   * constructed word.
   * ENSURES: Find and returns an array of possible moves, including all
   * positional combinations of each word!
   */
  function findMoves(TSTNode, alphaPool, move, letterNum) {
    var moveList = [];
    // get the index for this node's letter
    var alphaIndex = TSTNode.getLetter().charCodeAt(0)-97;
    var alphaNum = alphaPool[alphaIndex].length; // number of letter in pool
    if (alphaNum > 0) { // if pool contains this letter
      var next = TSTNode.getNext();
      // use cascading combo theorem
      for (var alphaNum; alphaNum > 0; alphaNum--) { 
        var alphaPoolCopy = new Array(26); // clone the pool
        for (var j = 0; j < 26; j++) {
          alphaPoolCopy[j] = alphaPool[j].slice(0);
        }
        var moveCopy = move.slice(0); // clone the move
        // truncate this letter's pool to length alphaNum
        alphaPoolCopy[alphaIndex].length = alphaNum;
        // remove the ith from the end and add it to the move
        moveCopy[letterNum] = alphaPoolCopy[alphaIndex].pop();
        // if next exists, add moves from further down the TST
        if (next != null) {
          moveList = moveList.concat(findMoves(next, alphaPoolCopy, moveCopy, letterNum+1));
        }
        // if this node ends a word, add the (new) move
        if (TSTNode.isEndsWord()) {
          moveList.push(moveCopy);
        }
      }
    }
    // if left exists, add moves from the left node
    var left = TSTNode.getLeft();
    if (left != null) {
      moveList = moveList.concat(findMoves(left, alphaPool, move, letterNum));
    }
    // if right exists, add moves from the right node
    var right = TSTNode.getRight();
    if (right != null) {
      moveList = moveList.concat(findMoves(right, alphaPool, move, letterNum));
    }
    // finally, return the whole list
    return moveList;
  }

  /* REQUIRES: true
   * ENSURES: returns a 26-array representing the alphabet. Each element
   * is an array of indices of that letter in the board (possibly empty).
   */
  function mapTileLocations() {
    var locs = new Array(26);
    for (var i = 0; i < 26; i++) {
      locs[i] = [];
    }
    for (var i = 0; i < 25; i++) {
      locs[board[i][0].charCodeAt(0) - 97].push(i);
    }
    return locs;
  }

}

function GameState(aMyTurn, aBoard, aPlayedWords) {
  var myTurn = aMyTurn;
  var board = aBoard;
  var playedWords = aPlayedWords;

  // privileged methods

  this.getBoard = function() {
    return board;
  }

  this.getPlayedWords = function () {
    return playedWords;
  }

  /* REQUIRES: move is a bit (number) array of length 25
   * ENSURES: returns the value of the board after this move
   */
  this.valueMove = function(move) {
    var stateClone = clone();
    stateClone.playMove(move);
    return stateClone.valueBoard();
  }

  this.valueBoard = function() {
    var sum = 0;
    for (var i = 0; i < 25; i++) {
      sum += board[i][1];
    }
    return sum;
  }

  /* move is a 25-array, filled from the left with the positions of the
   * tiles to use in order. The rest are filled with -1.
   */
  this.playMove = function(move) {
    var color = myTurn ? 1 : -1;
    var i = 0;
    var pos = move[i];
    while (pos != -1) {
      if (Math.abs(board[pos][1]) != 2) {
        board[pos][1] = color;
      }
      pos = move[++i];
    }
    updateColors();
    playedWords.push(convertToWord(move));
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

  function convertToWord(move) {
    var word = "";
    var i = 0;
    var pos = move[i];
    while (pos != -1) {
      word += board[pos][0];
      pos = move[++i];
    }
    return word;
  }

  // returns a nameless, dateless clone of this Game
  function clone() {
    var boardClone = new Array(25);
    for (var i = 0; i < 25; i++) {
      boardClone[i] = board[i].slice(0);
    }
    return new GameState(myTurn, boardClone, playedWords.slice(0));
  }
}
