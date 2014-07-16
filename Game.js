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
function Game(aName, aMyTurn, aBoard, aPlayedWords, aDate) {
  // public variables
  this.name = aName;
  // private variables
  var myTurn = aMyTurn;
  var board = aBoard;
  var playedWords = aPlayedWords;
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
  this.getPlayedWords = function() {
    return playedWords;
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

  /* Find and set the bestMoves
   * REQUIRES: timeLimit is a time limit in seconds (minimum 1)
   * ENSURES: finds and sets the bestMoves within at most timeLimit seconds
   */
  this.findBestMoves = function(TSTRoot, timeLimit) {
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
    // NAIVE ALGORITHM, no lookahead, keep 5
    bestMoves = new Array(BEST_MOVES_LEN);
    bestMovesValue = new Array(BEST_MOVES_LEN);
    for (var i = 0; i < BEST_MOVES_LEN; i++) {
      bestMoves[i] = null;
      bestMovesValue[i] = BOARD_MIN;
    }
    var alphaPool = mapTileLocations();
    var move = new Array(25);
    for (var i = 0; i < 25; i++) {
      move[i] = -1;
    }
    // generate moves
    var movesList = findMoves(TSTRoot, alphaPool, move, 0);
    console.log('movesList.length: ' + String(movesList.length));
    // evaluate and find the top 10
    for (var i = 0; i < movesList.length; i++) {
      var move = movesList[i];
      var moveValue = this.valueMove(move);
      var insertIndex = BEST_MOVES_LEN;
      for (var j = BEST_MOVES_LEN-1; j >= 0; j--) {
        if (moveValue > bestMovesValue[j]) {
          insertIndex--;
        }
        else { // once it's less, break because the rest are higher
          break;
        }
      }
      if (insertIndex < BEST_MOVES_LEN && !hasBeenPlayed(convertToWord(move))) {
        bestMoves[insertIndex] = move;
        bestMovesValue[insertIndex] = moveValue;
      }
    }
    for (var i = 0; i < BEST_MOVES_LEN; i++) {
      console.log(convertToWord(bestMoves[i]));
    }
  }

  // private helper methods for findBestMoves

  /* REQUIRES: TSTNode is the desired starting node, alphaPool is a pool
   * of letters mapped to positions by mapTileLocations, move is the move
   * constructed so far (represented as a 25-array, initially filled with
   * -1's), and letterNum is the next index to add a letter position in
   * move (i.e. the number (position) of the next letter in the
   * constructed word.
   * ENSURES: Find and returns an array of possible moves
   */
  function findMoves(TSTNode, alphaPool, move, letterNum) {
    var moveList = [];
    // get the index for this node's letter
    var alphaIndex = TSTNode.getLetter().charCodeAt(0)-97;
    if (alphaPool[alphaIndex].length > 0) { // if pool contains this letter
      var alphaPoolCopy = new Array(26); // clone the pool
      for (var i = 0; i < 26; i++) {
        alphaPoolCopy[i] = alphaPool[i].slice(0);
      }
      var moveCopy = move.slice(0); // clone the move
      // remove letter from pool, and mark position in move
      moveCopy[letterNum] = alphaPoolCopy[alphaIndex].pop();
      var next = TSTNode.getNext();
      // if next exists, add moves from further down the TST
      if (next != null) {
        moveList = findMoves(TSTNode.getNext(), alphaPoolCopy, moveCopy, letterNum+1);
      }
      // if this node ends a word, add the (new) move
      if (TSTNode.isEndsWord()) {
        moveList.push(moveCopy);
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
   * IMPORTANT: considers vulnerability of tiles from myTurn == true
   * perspective, should ONLY be called from this perspective for accurate
   * tile ordering.
   */
  function mapTileLocations() {
    // one array for vulnerable, one for invulnerable
    var vuln = new Array(26); 
    var invuln = new Array(26);
    for (var i = 0; i < 26; i++) {
      vuln[i] = []; 
      invuln[i] = [];
    }
    for (var i = 0; i < 25; i++) {
      if (board[i][1] > 0 || board[i][1] == -2) {
        invuln[board[i][0].charCodeAt(0) - 97].push(i);
      }
      else {
        vuln[board[i][0].charCodeAt(0) - 97].push(i);
      }
    }
    // now combine both with vulnerable first
    var locs = new Array(26);
    for (var i = 0; i < 26; i++) {
      shuffle(vuln[i]);
      locs[i] = vuln[i].concat(invuln[i]);
    }
    return locs;
  }

  // count up the letters in array by letter index
  function unmapToAlpha(move) {
    var alphaSet = new Array(26);
    for (var i = 0; i < 26; i++) {
      alphaSet[i] = 0;
    }
    var i = 0;
    var pos = move[i];
    while (pos != -1) {
      alphaSet[board[pos][0].fromCharAt(0) - 97]++;
      pos = move[++i];
    }
    return alphaSet;
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

  function hasBeenPlayed(word) {
    for (var i = 0; i < playedWords.length; i++) {
      if (word == playedWords[i]) {
        return true;
      }
    }
    return false;
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

  // returns a nameless, dateless clone of this Game
  function clone() {
    var boardClone = new Array(25);
    for (var i = 0; i < 25; i++) {
      boardClone[i] = board[i].slice(0);
    }
    return new Game(null, myTurn, boardClone, playedWords.slice(0), null);
  }

}
