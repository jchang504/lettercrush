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
        $('#new-name').val('');
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
  });

  // #play page

  // set listener for back to games button
  $('#back-to-games').click(function() {
    updateGameList();
    $('#play').hide();
    $('#games').show();
    // unblock words from opened game
    tst.unblock();
  });

  // set listener for cancel new game button
  $('#cancel-new').click(function() {
    $('#new-game').hide();
    $('#games').show();
  });

  });
  
  $('#games').show(); // show games page
}

// allows user to set up the new game, then calls openGame
function newGame(name) {
  console.log('Set up new game ' + name);
  $('#games').hide(); // hide games page
  
  // set listeners to change tile colors
  $('#new-board input').off('dblclick');
  var colors = ['red', 'pink', 'white', 'lightblue', 'blue'];
  $('#new-board input').dblclick(function() {
    // cycle through colors
    var currColor = $(this).css('background-color');
    var nextColor = colors[(colors.indexOf(currColor)+1) % 5];
    $(this).css('background-color', nextColor);
  });

  // submit listener
  $('#new-form').off('submit');
  $('#new-form').submit(function(e) {
    e.preventDefault();
    var newBoard = new Array(25);
    var jqTiles = $('#new-board input');
    // fetch the board input
    for (var i = 0; i < 25; i++) {
      var jqTile = $(jqTiles[i]);
      var letter = jqTile.val().toLowerCase();
      // check that input is filled
      if (letter.length != 1) {
        $('#new-incomplete').show();
        return;
      }
      var color = colors.indexOf(jqTile.css('background-color')) - 2;
      newBoard[i] = [letter, color];
    }
    var turn = "mine" == $('input[name="whose-turn"]:checked').val();
    var played = $('textarea[name="played-words"]').val().split('\n');
    // finally, create the game
    var game = new Game(name, new Date().toDateString(), turn, newBoard, played, tst);
    // save game
    localStorage.setItem(name, game.saveString());
    // add to game list
    var oldList = JSON.parse(localStorage.getItem('gamelist'));
    localStorage.setItem('gamelist', JSON.stringify(oldList.push(name)));
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
      $('construct-move').show();
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
  $('#choose-form .fixed-move').remove(); // remove old options
  for (var i = moves.length-1; i >= 0; i--) { // add the radio options
    var move = moves[i];
    var state = new GameState(game.isMyTurn(), game.getBoard(), []);
    state.playMove(move);
    var word = state.convertToWord(move);
    var radio_html = '<div class="fixed-move"><input type="radio" name="move-selected" value="' + String(i) + '"> ' + word + '<br>' + tallyScore(state.board) + '</div>';
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
      var state = new GameState(game.isMyTurn(), game.getBoard(), []);
      state.playMove(move);
      fillBoard($('#game-board'), state.board); // show a preview on the board
      // highlight the used tiles
      for (var i = 0; i < move.length; i++) {
        var row = Math.floor(i / 5) + 1;
        var col = Math.floor(i % 5) + 1;
        $('#game-board tr:nth-child(' + String(row)+ ') > td:nth-child(' + String(col) + ')').addClass('selected-tile');
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
      jqWc.html(jqWc.html() + game.getBoard()[boardIndex][0]);
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
      move[nextIndex-1] = -1;
      nextIndex--;
      // remove letter from word construct
      var currWord = jqWc.html();
      jqWc.html(currWord.substring(0, currWord.length-1));
      // unmark tile
      var row = tilePos / 5 + 1;
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
    var state = new GameState(true, game.getBoard(), []);
    if (!tst.lookup(state.convertToWord(move))) { // if not a valid word
      proceed = confirm('The proposed move forms a word that is not in the Letterpress dictionary. Proceed anyway?');
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
  $('#game-select-form .game-item').remove(); // remove the old options
  // refresh the list
  gameList = JSON.parse(localStorage.getItem('gamelist'));
  gameData = new Array(gameList.length);
  for (var i = gameData.length-1; i >= 0; i--) {
    // get each game's data by name from web storage
    gameData[i] = JSON.parse(localStorage.getItem(gameList[i]));
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
