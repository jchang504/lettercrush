// Implements the Game and GameState classes

// global constant variable
BOARD_MAX = 50;
BOARD_MIN = -50;

/* constructor for a Game
 * REQUIRES: aName is a string, aDate is the result of a
 * new Date().toDateString(), aOver is analogous to GameState's over, aMyTurn
 * is a boolean, aBoard is a valid board (25-array of tiles (each is an array
 * of [letter, color])), aBlockedWords is an array of strings representing
 * valid words that have been played, and aTst is the TST to use for this game
 * ENSURES: returns a Game representing these facts
 */
function Game(aName, aDate, aOver, aMyTurn, aBoard, aBlockedWords, aTst) {
  // private variables
  var name = aName;
  var date = aDate;
  var over = aOver;
  var myTurn = aMyTurn;
  var board = aBoard;
  var blockedWords = aBlockedWords;
  var tst = aTst;
  var currMovesList;
  var bestMoves = null;
  var bestMoveValues = null;
  // block initial words in TST
  for (var i = 0; i < blockedWords.length; i++) {
    tst.block(blockedWords[i]);
  }
  // generate move list
  var start = new Date();
  var alphaPool = mapTileLocations();
  var move = new Array(25);
  for (var i = 0; i < 25; i++) {
    move[i] = -1;
  }
  currMovesList = findMoves(tst.getRoot(), alphaPool, move, 0);
  var end = new Date();
  console.log('currMovesList.length: ' + String(currMovesList.length));
  console.log('currMovesList generation took: ' + String(end - start));

  // Getters
  this.getName = function() {
    return name;
  }
  this.getOver = function() {
    return over;
  }
  this.isMyTurn = function() {
    return myTurn;
  }
  this.getBoard = function() {
    return board;
  }
  this.getBestMoves = function() {
    return bestMoves;
  }
  // word-checker
  this.hasBeenPlayed = function(word) {
    return blockedWords.indexOf(word) != -1;
  }
  // privileged methods

  // produces a string of this Game's essential data to be saved
  this.saveString = function() {
    return JSON.stringify({name: name, date: date, over: over, myTurn: myTurn, board: board, blocked: blockedWords});
  }

  /* Plays the move on this game, effecting the necessary board changes.
   */
  this.play = function(move) {
    var state = new GameState(myTurn, board, []);
    state.playMove(move);
    board = state.board; // update board
    myTurn = !myTurn; // change turns
    over = state.over; // update over
    removeCurrMoves(state.playedWords[0]); // remove word from move list
    blockedWords.push(state.playedWords[0]); // add to blocked list
  }

  /* Find and set the bestMoves
   * REQUIRES: lookahead is the desired lookahead (min 1); timeLimit is a
   * time limit in seconds (min 1); listLen is the desired length of final list
   * ENSURES: finds and sets the bestMoves using minimax with alpha-beta
   * pruning up to lookahead plies, or as far as it can get within at most
   * timeLimit seconds
   */
  this.findBestMoves = function(lookahead, timeLimit, listLen) {
    var movesList = currMovesList; // set initial moves list
    var fullListLen = movesList.length; // remember full list length
    var endTime = new Date().getTime() + 1000*timeLimit;
    var layerMaxTime;
    // use IDDFS
    for (var depth = 0; depth < lookahead; depth++) {
      if (depth > 0 && new Date().getTime() > endTime - layerMaxTime) {
        break;
      }
      var bestMovesLen = Math.max(Math.floor(Math.pow(fullListLen, (1 / (depth+2)))), 100); // keep the move list at least 100 long, to avoid shortsightedness
      bestMoves = new Array(bestMovesLen);
      bestMovesValue = new Array(bestMovesLen);
      for (var i = 0; i < bestMovesLen; i++) {
        bestMovesValue[i] = BOARD_MIN;
      }
      var startState = new GameState(myTurn, board, []);
      var lastIndex = -1;
      var count = 0;
      var modulus = depth == 0 ? 1000 : 10;
      for (var i = 0; i < movesList.length; i++) {
        if (count % modulus == 0 && new Date().getTime() > endTime) {
          break;
        }
        var move = movesList[i];
        // use lowest best move value as alpha
        var moveValue = startState.valueMove(move, movesList, depth, bestMovesValue[bestMovesLen-1], BOARD_MAX);
        // insert into best list if needed, and update lastIndex
        lastIndex = binInsert(move, moveValue, lastIndex);
        count++;
      }
      movesList = bestMoves; // use bestMoves as movesList for next layer
      // recalculate layer timeout threshold
      layerMaxTime = listLen * Math.pow(movesList.length, depth+1) / 80;
      // 80 is approximately how many heuristic evals can be done per ms
    }
    // trim to desired length
    bestMoves.length = listLen;
    for (var i = 0; i < bestMoves.length; i++) {
      console.log(bestMoves[i]);
    }
  }

  // private helper methods for findBestMoves

  /* REQUIRES: move is a move with value moveValue, (bestMoves is sorted in
   * descending order by move values,) and lastIndex is the index of the last
   * (worst) move in bestMoves
   * ENSURES: Inserts the move into bestMoves at the appropriate spot
   * according to its value, and returns the updated lastIndex
   */
  function binInsert(move, moveValue, lastIndex) {
    if (lastIndex == -1) { // no moves yet
      bestMoves[0] = move;
      bestMovesValue[0] = moveValue;
      return ++lastIndex;
    }
    else if (moveValue <= bestMovesValue[lastIndex]) { // can't beat bottom move
      if (lastIndex + 1 < bestMoves.length) { // if empty spaces left
        bestMoves[lastIndex+1] = move;
        bestMovesValue[lastIndex+1] = moveValue;
        return ++lastIndex;
      }
      else { // don't insert; return same index
        return lastIndex;
      }
    }
    else { // beats move at lastIndex; use bin search to find index to insert
      var maxIndex = 0; // lowest index this move could be inserted at
      var minIndex = lastIndex; // highest index || ...
      while (maxIndex < minIndex) {
        var mid = Math.floor((maxIndex + minIndex) / 2);
        if (moveValue <= bestMovesValue[mid]) {
          maxIndex = mid+1;
        }
        else { // moveValue > bestMovesValue[mid]
          minIndex = mid;
        }
      }
      // now maxIndex == minIndex
      bestMoves.splice(maxIndex, 0, move);
      bestMovesValue.splice(maxIndex, 0, moveValue);
      bestMoves.length--; // reset length
      return ++lastIndex;
    }
  }

  /*
   * Removes all occurrences of this word and its prefixeds from the movesList
   */
  function removeCurrMoves(word) {
    var state = new GameState(myTurn, board, []);
    for (var i = 0; i < currMovesList.length; i++) {
      if (word.indexOf(state.convertToWord(currMovesList[i])) != -1) {
        currMovesList.splice(i, 1); // remove this word
      }
    }
  }

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
  this.over = 0; // game is not over yet

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
  if (nextState.over != 0) { // if nextState is game over
    return nextState.over * BOARD_MAX;
  }
  else if (depth == 0) { // use heuristic
    return nextState.valueBoard();
  }
  else {
    for (var i = 0; i < movesList.length; i++) {
      // if not already played
      if (nextState.playedWords.indexOf(nextState.convertToWord(movesList[i])) == -1) {
        var value = nextState.valueMove(movesList[i], movesList, depth-1, alpha, beta);
        if (nextState.myTurn) {
          alpha = Math.max(alpha, value);
        }
        else {
          beta = Math.min(beta, value);
        }
        // check if bounds have crossed
        if (beta <= alpha) {
          break;
        }
      }
    }
    return nextState.myTurn ? alpha : beta;
  }
}

// sums up the color values of the tiles; does NOT detect game over
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

// updates the colors of the tiles, AND marks the game if it's over
GameState.prototype.updateColors = function() {
  var blueCount = 0, redCount = 0;
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
        if (myColor > 0) {
          blueCount++;
        }
        else { // since myColor != 0, myColor < 0
          redCount++;
        }
      }
    }
  }
  if (blueCount + redCount == 25) {
    if (blueCount >= 13) { // majority blue
      this.over = 1; // blue won
    }
    else { // majority red
      this.over = -1; // red won
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
