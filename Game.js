// Implements the Game and GameState classes

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
function Game(aName, aMyTurn, aBoard, blockedWords, aTst) {
  // public variables
  this.name = aName;
  // private variables
  var date = new Date();
  var myTurn = aMyTurn;
  var board = aBoard;
  var tst = aTst;
  var bestMoves = null;
  var bestMoveValues = null;
  // block initial words in TST
  for (var i = 0; i < blockedWords.length; i++) {
    tst.block(blockedWords[i]);
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
    board = state.board; // update board
    tst.block(state.playedWords[0]); // block word in TST
    myTurn = !myTurn; // change turns
  }

  /* Find and set the bestMoves
   * REQUIRES: depth is the goal depth to search to; timeLimit is a time
   * limit in seconds (minimum 1)
   * ENSURES: finds and sets the bestMoves using minimax with alpha-beta
   * pruning up to depth plies, or as far as it can get within at most
   * timeLimit seconds
   */
  this.findBestMoves = function(depth, timeLimit) {
    var endTime = new Date().getTime() + 1000*timeLimit;
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
    var movesList = findMoves(tst.getRoot(), alphaPool, move, 0);
    var end = new Date();
    console.log('movesList.length: ' + String(movesList.length));
    console.log('movesList generation took: ' + String(end - start));
    // evaluate and find the top 10
    var start = new Date();
    var startState = new GameState(myTurn, board, []);
    var count = 0;
    for (var i = 0; i < movesList.length; i++) {
      if (count % 100 == 0 && new Date().getTime() > endTime) {
        console.log('Timed out.');
        break;
      }
      var move = movesList[i];
      var moveValue = startState.valueMove(move, movesList, depth, BOARD_MIN, BOARD_MAX);
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
      count++;
    }
    var end = new Date();
    console.log('Selecting bestMoves took: ' + String(end - start));
    for (var i = 0; i < BEST_MOVES_LEN; i++) {
      console.log(bestMoves[i]);
    }
  }

  // private helper methods for findBestMoves

  /* REQUIRES: tstNode is the desired starting node, alphaPool is a pool
   * of letters mapped to positions by mapTileLocations, move is the move
   * constructed so far (represented as a 25-array, initially filled with
   * -1's), and letterNum is the next index to add a letter position in
   * move (i.e. the number (position) of the next letter in the
   * constructed word.
   * ENSURES: Find and returns an array of possible moves, including all
   * positional combinations of each word!
   */
  function findMoves(tstNode, alphaPool, move, letterNum) {
    var moveList = [];
    // get the index for this node's letter
    var alphaIndex = tstNode.letter.charCodeAt(0)-97;
    var alphaNum = alphaPool[alphaIndex].length; // number of letter in pool
    if (alphaNum > 0) { // if pool contains this letter
      var next = tstNode.next;
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
        if (tstNode.endsWord) {
          moveList.push(moveCopy);
        }
      }
    }
    // if left exists, add moves from the left node
    var left = tstNode.left;
    if (left != null) {
      moveList = moveList.concat(findMoves(left, alphaPool, move, letterNum));
    }
    // if right exists, add moves from the right node
    var right = tstNode.right;
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

  this.myTurn = aMyTurn;
  this.board = aBoard;
  this.playedWords = aPlayedWords;

}

/* Uses alpha-beta pruned minimax to determine the value of the move
 * REQUIRES: move is a bit (number) array of length 25, movesList is the
 * array of available moves, depth is the desired search depth, alpha and * beta are the lower/upper bounds
 * ENSURES: returns the minimax value of this move
 */
GameState.prototype.valueMove = function(move, movesList, depth, alpha, beta) {
  // clone the state and play the move
  var nextState = this.clone();
  nextState.playMove(move);
  if (depth == 0) { // use heuristic
    var heuristic = nextState.valueBoard();
    if (heuristic <= alpha) {
      return nextState.myTurn ? "PP" : "P";
    }
    else if (heuristic >= beta) {
      return nextState.myTurn ? "P" : "PP";
    }
    else {
      return heuristic;
    }
  }
  else {
    for (var i = 0; i < movesList.length; i++) {
      // if not already played
      if (nextState.playedWords.indexOf(nextState.convertToWord(movesList[i])) == -1) {
        var value = nextState.valueMove(movesList[i], movesList, depth-1, alpha, beta);
        if (value === "PP") { // received parent prune
          return "P";
        }
        else if (value === "P") { // received prune
          // do nothing; just skip this move
        }
        else { // update alpha/beta
          if (nextState.myTurn) {
            alpha = Math.max(alpha, value);
          }
          else {
            beta = Math.min(beta, value);
          }
        }
      }
    }
    return nextState.myTurn ? alpha : beta;
  }
}

GameState.prototype.valueBoard = function() {
  var sum = 0;
  for (var i = 0; i < 25; i++) {
    sum += this.board[i][1];
  }
  return sum;
}

/* move is a 25-array, filled from the left with the positions of the
 * tiles to use in order. The rest are filled with -1.
 */
GameState.prototype.playMove = function(move) {
  var color = this.myTurn ? 1 : -1;
  var i = 0;
  var pos = move[i];
  while (pos != -1) {
    if (Math.abs(this.board[pos][1]) != 2) {
      this.board[pos][1] = color;
    }
    pos = move[++i];
  }
  this.updateColors();
  this.playedWords.push(this.convertToWord(move));
  this.myTurn = !this.myTurn;
}

// private methods

GameState.prototype.updateColors = function() {
  for (var r = 0; r < 5; r++)
  {
    for (var c = 0; c < 5; c++) {
      var myColor = this.board[5*r+c][1];
      // if not white...
      if (myColor != 0) {
        if (r > 0 && this.board[5*(r-1)+c][1] * myColor <= 0 ||
            r < 4 && this.board[5*(r+1)+c][1] * myColor <= 0 ||
            c > 0 && this.board[5*r+(c-1)][1] * myColor <= 0 ||
            c < 4 && this.board[5*r+(c+1)][1] * myColor <= 0) {
          this.board[5*r+c][1] = (myColor > 0) ? 1 : -1;
        }
        else {
          this.board[5*r+c][1] = (myColor > 0) ? 2 : -2;
        }
      }
    }
  }
}

GameState.prototype.convertToWord = function(move) {
  var word = "";
  var i = 0;
  var pos = move[i];
  while (pos != -1) {
    word += this.board[pos][0];
    pos = move[++i];
  }
  return word;
}

// returns a nameless, dateless clone of this Game
GameState.prototype.clone = function() {
  var boardClone = new Array(25);
  for (var i = 0; i < 25; i++) {
    boardClone[i] = this.board[i].slice(0);
  }
  return new GameState(this.myTurn, boardClone, this.playedWords.slice(0));
}
