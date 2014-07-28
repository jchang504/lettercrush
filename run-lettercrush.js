// Runs the Lettercrush application

DEBUG = true;
var tst;
var gameList;
var gameData;

$(document).ready(checkStorage);

function checkStorage() {
  if (DEBUG) { console.log('CALL checkStorage'); }
  $('#nojs').hide(); // remove No JS message
  if (typeof(Storage) !== "undefined") { // check if Web Storage supported
    $('#yes-storage').show();
    checkAccess();
  }
  else {
    $('#no-storage').show();
  }
}

// Adds handler for checking access code when the Go button is clicked
function checkAccess() {
  if (DEBUG) { console.log('CALL checkAccess'); }
  $('#access-form').submit(function(e) {
    e.preventDefault(); // prevent default form action
    var code = $('input[name="access-code"]').val();
    if (DEBUG) { console.log('Submit access code button clicked with value: ' + code); }
    $.post('process-access.php', {accessCode: code}, function(response) {
      if (response == "grant") {
        loadTST();
      }
      else {
        if (DEBUG) { console.log('Access denied.'); }
        $('#denied').show();
        $('input[name="access-code"]').val('');
      }
    });
  });
}

// beginning of actual AI code
function loadTST() {
  if (DEBUG) { console.log('CALL loadTST'); }
  $('#title').hide(); // hide title page
  // show loading dictionary page
  $('#loading > h1').html('Loading dictionary...');
  $('#loading').show();
  $.getScript('TST.js', loadGame);
}

function loadGame() {
  if (DEBUG) { console.log('CALL loadGame'); }
  $.getScript('Game.js', loadDict);
}

function loadDict() {
  if (DEBUG) { console.log('CALL loadDict'); }
  $.get('dictionary.dat', main);
}

function main(data) {
  if (DEBUG) { console.log('CALL main'); }
  // set up the dictionary
  var wordList = data.split('\n');
  wordList.pop(); // delete the extra new line at end
  tst = new TST(wordList);
  console.log('Dictionary built.');
  $('#loading').hide(); // hide loading page

  //if (DEBUG) {
  //  var testBoard = new Array(25);
  //  for (var i = 0; i < 25; i++) {
  //    testBoard[i] = [String.fromCharCode(97+i), (i%5)-2];
  //  }

  //  var johnGame = new Game('John', new Date().toDateString(), true, testBoard, [], tst);
  //  var rohitGame = new Game('Rohit', new Date().toDateString(), true, testBoard, [], tst);
  //  localStorage.setItem('John', johnGame.saveString());
  //  localStorage.setItem('Rohit', rohitGame.saveString());
  //  var testList = ['John', 'Rohit'];
  //  localStorage.setItem('gamelist', JSON.stringify(testList));
  //}

  updateGameList();

  // #games page
  // set listener for game select form submission
  $('#game-select-form').submit(function(e) {
    e.preventDefault();
    var selectedVal = $(this).find('input[name="game-selected"]:checked').val();
    if (selectedVal === "new-game") {
      var newName = $('#new-name').val();
      if (gameList.indexOf(newName) != -1) { // name already saved
        if (DEBUG) { console.log('Name already used.'); }
        // display error message and clear field
        $('#new-name-error').html('A game is already saved under this name. Please choose a different name.').show();
      }
      else if (newName.length == 0) {
        if (DEBUG) { console.log('Name is empty.'); }
        // display error message
        $('#new-name-error').html('You must enter a name to save this game under.').show();
      }
      else {
        newGame(newName);
      }
    }
    else { // chose existing game
      openGame(gameData[parseInt(selectedVal)]);
    }
    $('#new-name').val(''); // reset text field
  });

  // #play page

  // set listener for back to games button
  $('#back-to-games').click(function() {
    updateGameList();
    $('#game-board tr > td').removeClass('selected-tile');
    $('#gen-moves').hide();
    $('#choose-move').hide();
    $('#construct-move').hide();
    $('#play').hide();
    $('#games').show();
    // unblock words from opened game
    tst.unblock();
  });

  // #new-game page

  // set listener for cancel new game button
  $('#cancel-new').click(function() {
    $('#new-game').hide();
    $('#games').show();
  });

  // prevent text field clicks from changing color
  $('#new-board td > input').click(function(e) {
    e.stopPropagation();
  });

  $('#games').show(); // show games page
}

// allows user to set up the new game, then calls openGame
function newGame(name) {
  console.log('Set up new game ' + name);
  $('#games').hide(); // hide games page
  
  // set listeners to change tile colors
  $('#new-board td').off('click');
  var colors = ['pink', 'white', 'lightblue'];
  $('#new-board td').click(function() {
    // cycle through colors
    var currColor = $(this).attr('class');
    var nextColor = colors[(colors.indexOf(currColor)+1) % 3];
    $(this).removeClass(currColor).addClass(nextColor);
  });

  // submit listener
  $('#new-form').off('submit');
  $('#new-form').submit(function(e) {
    e.preventDefault();
    var newBoard = new Array(25);
    var jqTiles = $('#new-board td');
    // fetch the board input
    for (var i = 0; i < 25; i++) {
      var jqTile = $(jqTiles[i]);
      var letter = jqTile.find('input').val().toLowerCase();
      // check that input is filled
      if (letter.length != 1) {
        $('#new-incomplete').show();
        return;
      }
      var color = colors.indexOf(jqTile.attr('class'))-1;
      newBoard[i] = [letter, color];
    }
    // create a dummy GameState to update the locked tiles
    var tempState = new GameState(true, newBoard, []);
    tempState.updateColors();
    newBoard = tempState.board;
    var turn = "mine" == $('input[name="whose-turn"]:checked').val();
    var played = $('textarea[name="played-words"]').val().toLowerCase().split('\n');
    // finally, manually create the game string
    var gameString = JSON.stringify({name: name, date: new Date().toDateString(), myTurn: turn, board: newBoard, blocked: played});
    // save game
    localStorage.setItem(name, gameString);
    // add to game list
    var gameList = JSON.parse(localStorage.getItem('gamelist'));
    gameList.push(name);
    localStorage.setItem('gamelist', JSON.stringify(gameList));
    console.log('Created new game ' + name);
    // finally, open new game
    $('#new-game').hide();
    openGame(JSON.parse(localStorage.getItem(name)));
  });

  $('#new-game').show();
}

/* opens an existing game for interaction
 * REQUIRES: game is a result of Game.saveString()
 */
function openGame(game) {
  console.log('Open game ' + game.name);
  $('#games').hide(); // hide games page
  // show the loading page while game sets up move list
  $('#loading > h1').html('Loading game data...');
  $('#loading').show();
  /* strangely, this hack was the only thing that worked to get the loading
  page to show up as desired. The rest of the code is in this function.*/
  var loadGame = function() {
    game = new Game(game.name, game.date, game.myTurn, game.board, game.blocked, tst);
    console.log('Game data loaded.');
    // set listeners for each panel
    setGenMoves(game);
    setConstructMove(game);
    // fill the #game-board
    fillBoard($('#game-board'), game.getBoard());
    // show the score
    $('#play h2.score').html(tallyScore(game.getBoard()));
    // show appropriate .right-side panel
    if (game.isMyTurn()) {
      $('#turn-indicator').html('Select your move:');
      $('#gen-moves').show();
    }
    else {
      $('#turn-indicator').html('Select opponent\'s move:');
      $('#construct-move').show();
    }
    // finally, bring up the play game page
    $('#loading').hide();
    $('#play').show(); 
  }
  setTimeout(loadGame, 5);
}

// set listeners for #gen-moves panel
function setGenMoves(game) {
  $('#gen-form').off('submit');
  $('#gen-form').submit(function(e) {
    e.preventDefault();
    var timeLimit = $('#gen-form > input[name="time-limit"]').val();
    var depthLimit = $('#gen-form > input[name="depth-limit"]').val();
    var listLen = $('#gen-form > input[name="list-len"]').val();
    // reset the form for next time we look at it
    $('#gen-form')[0].reset();
    $('#gen-moves').hide();
    console.log('Finding best moves...');
    $('#thinking').show();
    // using this setTimeout hack again to show the Thinking panel
    var gen = function() {
      // process entered values; set to defaults if blank
      timeLimit = timeLimit.length == 0 ? 5 : parseInt(timeLimit);
      depthLimit = depthLimit.length == 0 ? 10 : parseInt(depthLimit);
      listLen = listLen.length == 0 ? 5 : parseInt(listLen);
      game.findBestMoves(depthLimit, timeLimit, listLen);
      console.log('Best moves generated.');
      // update move choosing panel
      updateChooseMove(game);
      $('#thinking').hide();
      $('#choose-move').show();
    }
    setTimeout(gen, 5);
  });
}

// reset listeners for #choose-move panel
function updateChooseMove(game) {
  var moves = game.getBestMoves();
  var startState = new GameState(game.isMyTurn(), game.getBoard(), []);
  $('#choose-form .fixed-move').remove(); // remove old options
  for (var i = moves.length-1; i >= 0; i--) { // add the radio options
    var move = moves[i];
    var tempState = startState.clone();
    tempState.playMove(move);
    var word = tempState.convertToWord(move);
    var radio_html = '<div class="fixed-move"><input type="radio" name="move-selected" value="' + String(i) + '"> ' + word + '<br>' + tallyScore(tempState.board) + '</div>';
    $('#choose-form').prepend(radio_html);
  }
  // remove previous listeners
  $('#choose-form input[name="move-selected"]').off('change');
  // set listeners for move selection with board preview
  $('#choose-form input[name="move-selected"]').change(function() {
    var selectedVal = $(this).val();
    if (DEBUG) { console.log('Move with value ' + selectedVal + ' selected'); }
    if (selectedVal === "construct") {
      fillBoard($('#game-board'), game.getBoard()); // show original board
      // unhighlight all tiles
      $('#game-board tr > td').removeClass('selected-tile');
    }
    else {
      var moveIndex = parseInt(selectedVal);
      var move = moves[moveIndex];
      var tempState = startState.clone();
      tempState.playMove(move);
      fillBoard($('#game-board'), tempState.board); // show a preview on the board
      // unhighlight all tiles
      $('#game-board tr > td').removeClass('selected-tile');
      // highlight the used tiles
      var moveEnd = move.indexOf(-1);
      for (var i = 0; i < moveEnd; i++) {
        var row = Math.floor(move[i] / 5) + 1;
        var col = move[i] % 5 + 1;
        $('#game-board tr:nth-child(' + String(row) + ') > td:nth-child(' + String(col) + ')').addClass('selected-tile');
      }
    }
  });

  // set submit listener
  $('#choose-form').off('submit');
  $('#choose-form').submit(function(e) {
    e.preventDefault();
    var selectedVal = $(this).find('input[name="move-selected"]:checked').val();
    if (selectedVal === "construct") { // allow user to construct move
      $('#choose-move').hide();
      $('#construct-move').show();
    }
    else {
      var moveIndex = parseInt(selectedVal);
      game.play(moves[moveIndex]); // actually play move
      // auto-save game
      localStorage.setItem(game.getName(), game.saveString());
      // unhighlight all tiles
      $('#game-board tr > td').removeClass('selected-tile');
      // update score
      $('#play h2.score').html(tallyScore(game.getBoard()));
      // now go to construct opponent move
      $('#choose-move').hide();
      $('#turn-indicator').html('Select opponent\'s move:');
      $('#construct-move').show();
    }
  });

}

// set listeners for #construct-move panel
function setConstructMove(game) {
  var move = new Array(25);
  for (var i = 0; i < 25; i++) {
    move[i] = -1;
  }
  var nextIndex = 0;
  var jqWc = $('#word-construct');

  // set tile listeners
  $('#game-board td').off('click');
  $('#game-board td').click(function() {
    if (!($(this).hasClass('selected-tile'))) {
      var row = $(this).parent().prop('rowIndex');
      var col = $(this).prop('cellIndex');
      var boardIndex = 5*row + col;
      // add position to move
      move[nextIndex] = boardIndex;
      nextIndex++;
      // append letter to word construct
      jqWc.html(jqWc.html() + game.getBoard()[boardIndex][0].toUpperCase());
      // mark tile
      $(this).addClass('selected-tile');
    }
  });

  // set backspace button listeners
  $('#construct-backspace').off('click');
  $('#construct-backspace').click(function() {
    if (nextIndex > 0) { // at least one tile selected
      var tilePos = move[nextIndex-1];
      // remove last position in move
      move[--nextIndex] = -1;
      // remove letter from word construct
      var currWord = jqWc.html();
      jqWc.html(currWord.substring(0, currWord.length-1));
      // unmark tile
      var row = Math.floor(tilePos / 5) + 1;
      var col = tilePos % 5 + 1;
      $('#game-board tr:nth-child(' + String(row) + ') > td:nth-child(' + String(col) + ')').removeClass('selected-tile');
    }
  });

  // set clear button listeners
  $('#construct-clear').off('click');
  $('#construct-clear').click(function() {
    // reset move
    for (var j = 0; j < nextIndex; j++) {
      move[j] = -1;
    }
    nextIndex = 0;
    // reset word construct
    jqWc.html('');
    // unmark all tiles
    $('#game-board tr > td').removeClass('selected-tile');
  });

  // set submit listener
  $('#construct-form').off('submit');
  $('#construct-form').submit(function(e) {
    e.preventDefault();
    var proceed = true;
    // just for word conversion
    var tempState = new GameState(true, game.getBoard(), []);
    var word = tempState.convertToWord(move);
    // if no move entered
    if (word.length == 0) {
      proceed = confirm('No move entered. Pass opponent\'s turn?');
    }
    // if invalid or already played
    else if (!tst.lookup(word) || game.hasBeenPlayed(word)) {
      proceed = confirm('The proposed move forms a word that has already been played or is not in the Letterpress dictionary. Proceed anyway?');
    }
    if (proceed) {
      game.play(move);
      // auto-save game
      localStorage.setItem(game.getName(), game.saveString());
      // update board colors
      fillBoard($('#game-board'), game.getBoard());
      // update score
      $('#play h2.score').html(tallyScore(game.getBoard()));
      // reset this panel
      $('#construct-clear').click();
      // go to appropriate next panel
      if (game.isMyTurn()) {
        $('#turn-indicator').html('Select your move:');
        $('#construct-move').hide();
        $('#gen-moves').show();
      }
      else {
        $('#turn-indicator').html('Select opponent\'s move:');
      }
    }
  });
}

// updates the game list and gameData array for the game selection page
function updateGameList() {
  console.log('updating game list');
  $('#new-name-error').html('');
  $('#game-select-form .game-item').remove(); // remove the old options
  // refresh the list
  gameList = JSON.parse(localStorage.getItem('gamelist'));
  console.log('gameList: ' + String(gameList));
  gameData = new Array(gameList.length);
  for (var i = gameData.length-1; i >= 0; i--) {
    // get each game's data by name from web storage
    gameData[i] = JSON.parse(localStorage.getItem(gameList[i]));
    console.log('gameData[' + String(i) + ']: ');
    console.log(gameData[i]);
    var radio_html = '<div class="game-item"><input type="radio" name="game-selected" value="' + String(i) + '"> ' + gameData[i].name + '<br>' + (gameData[i].myTurn ? "Your turn" : "Opponent's turn") + '<br><i>Started: ' + gameData[i].date + '</i></div>';
    $('#game-select-form').prepend(radio_html);
  }
  // remove previous listeners
  $('#game-select-form input[name="game-selected"]').off('change');
  // set listeners to show board previews
  $('#game-select-form input[name="game-selected"]').change(function() {
    var selectedVal = $(this).val();
    if (DEBUG) { console.log('Game with value ' + selectedVal + ' selected'); }
    var gameBoard; // used to show the preview
    if (selectedVal === "new-game") {
      gameBoard = new Array(25);
      for (var i = 0; i < 25; i++) {
        gameBoard[i] = ['', 0]; // set to blank board
      }
      $('#games h2.score').html(''); // erase score
      // put focus on name text field
      $('#new-name').focus();
    }
    else {
      var gameIndex = parseInt(selectedVal);
      gameBoard = gameData[gameIndex].board;
      // show score
      var score = tallyScore(gameData[gameIndex].board);
      $('#games h2.score').html(score);
    }
    // fill #preview-board with the board
    fillBoard($('#preview-board'), gameBoard);
  });
  // set first choice to chosen initially
  $('#game-select-form div:first-child input[type="radio"]').prop('checked', true).change();
}

// helper function to fill the jqBoard with the letters and colors of gameBoard
function fillBoard(jqBoard, gameBoard) {
  var colors = ['red', 'pink', 'white', 'lightblue', 'blue'];
  for (var r = 0; r < 5; r++) {
  var jqRow = jqBoard.find('tr:nth-child(' + String(r+1) + ')');
    for (var c = 0; c < 5; c++) {
      var jqCell = jqRow.find('td:nth-child(' + String(c+1) + ')');
      // put the tile's letter in the td
      jqCell.html(gameBoard[5*r+c][0].toUpperCase());
      jqCell.css('background-color', colors[gameBoard[5*r+c][1]+2]);
    }
  }
}

// helper to get the current Letterpress score of a board (as a string)
function tallyScore(board) {
  var blue = 0;
  var red = 0;
  for (var i = 0; i < 25; i++) {
    var color = board[i][1];
    if (color > 0) {
      blue++;
    }
    else if (color < 0) {
      red++;
    }
  }
  return String(blue) + ' — ' + String(red); 
}
