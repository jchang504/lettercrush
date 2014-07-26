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

  // set listener for form submission
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

  $('#games').show(); // show games page
}

// allows user to set up the new game, then calls openGame
function newGame(name) {
  console.log('Set up new game ' + name);
  $('#games').hide(); // hide games page
}

// opens an existing game for interaction
function openGame(game) {
  console.log('Open game ' + game.name);
  $('#games').hide(); // hide games page
  // show the loading page while game sets up move list
  /* strangely, this hack was the only thing that worked to get the loading
  page to show up as desired */
  var loadGame = function() {
    game = new Game(game.name, game.date, game.myTurn, game.board, game.blocked, tst);
    $('#loading').hide();
    console.log('Game data loaded.');
  }
  $('#loading > h1').html('Loading game data...');
  $('#loading').show();
  setTimeout(loadGame, 0);
}

// updates the game list and gameData array for the game selection page
function updateGameList() {
  $('.game-item').remove(); // remove the old list items
  // refresh the list
  gameList = JSON.parse(localStorage.getItem('gamelist'));
  gameData = new Array(gameList.length);
  for (var i = gameData.length-1; i >= 0; i--) {
    // get each game's data by name from web storage
    gameData[i] = JSON.parse(localStorage.getItem(gameList[i]));
    var radio_html = '<input type="radio" name="game-selected" class="game-item" value="' + String(i) + '"> ' + gameData[i].name + '<br>' + (gameData[i].myTurn ? "Your turn" : "Opponent's turn") + '<br><i>Started: ' + gameData[i].date + '</i><br>';
    $('#game-select-form').prepend(radio_html);
  }
  // set listeners to show board previews
  $('#game-select-form > input[name="game-selected"]').change(function() {
    var selectedVal = $(this).val();
    if (DEBUG) { console.log('Game with value ' + selectedVal + ' selected'); }
    var gameBoard; // used to show the preview
    if (selectedVal === "new-game") {
      gameBoard = new Array(25);
      for (var i = 0; i < 25; i++) {
        gameBoard[i] = ['', 0]; // set to blank board
      }
      // put focus on name text field
      $('#new-name').focus();
    }
    else {
      var gameIndex = parseInt(selectedVal);
      gameBoard = gameData[gameIndex].board;
    }
    var colors = ['red', 'pink', 'white', 'lightblue', 'blue'];
    for (var r = 0; r < 5; r++) {
    var jqRow = $('#board-preview tr:nth-child(' + String(r+1) + ')');
      for (var c = 0; c < 5; c++) {
        var jqCell = jqRow.find('td:nth-child(' + String(c+1) + ')');
        // put the tile's letter in the td
        jqCell.html(gameBoard[5*r+c][0]);
        jqCell.css('background-color', colors[gameBoard[5*r+c][1]+2]);
      }
    }
  });
  // set first choice to chosen initially
  $('#game-select-form > input[type="radio"]:first-child').prop('checked', true).change();
}
