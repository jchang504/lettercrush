// Runs the Lettercrush application

DEBUG = true;

$(document).ready(checkStorage);

function checkStorage() {
  if (DEBUG) { console.log('CALL checkStorage'); }
  $('#nojs').css('display', 'none'); // remove No JS message
  if (typeof(Storage) !== "undefined") { // check if Web Storage supported
    $('#yes-storage').css('display', 'block');
    checkAccess();
  }
  else {
    $('#no-storage').css('display', 'block');
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
        $('#denied').css('display', 'block');
        $('input[name="access-code"]').val('');
      }
    });
  });
}

// beginning of actual AI code
function loadTST() {
  if (DEBUG) { console.log('CALL loadTST'); }
  $('#title').css('display', 'none'); // hide title page
  // show loading dictionary page
  $('#loading > h1').html('Loading dictionary...');
  $('#loading').css('display', 'block');
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
  var wordList = data.split('\n');
  wordList.pop(); // delete the extra new line at end
  var tst = new TST(wordList);
  console.log('Dictionary built.');
  $('#loading').css('display', 'none'); // hide loading page

  var testBoard = new Array(25);
  for (var i = 0; i < 25; i++) {
    testBoard[i] = [String.fromCharCode(97+i), 0];
  }

  //var johnGame = new Game('John', new Date().toDateString(), true, testBoard, [], tst);
  //var rohitGame = new Game('Rohit', new Date().toDateString(), true, testBoard, [], tst);

  //if (DEBUG) {
  //  var testList = [johnGame.saveString(), rohitGame.saveString()];
  //  localStorage.setItem('gamelist', JSON.stringify(testList));
  //}
  var gameList = JSON.parse(localStorage.getItem('gamelist'));
  for (var i = 0; i < gameList.length; i++) {
    gameList[i] = JSON.parse(gameList[i]); // turn strings into objects
    var curr = gameList[i];
    var radio_html = '<input type="radio" name="game-selected" value="' + curr.name + '"> ' + curr.name + '<br>' + (curr.myTurn ? "Your turn" : "Opponent's turn") + '<br><i>Started: ' + curr.date + '</i><br>';
    $('#game-select-form').prepend(radio_html);
  }
  // set first choice to checked
  $('#game-select-form > input[type="radio"]:first-child').prop('checked', true);
  $('#games').css('display', 'block'); // show games page
}
