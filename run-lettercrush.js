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
    $.post('process-access.php', {'accessCode': code}, function(response) {
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
  $('#loading').css('display', 'none'); // hide loading page
  if (DEBUG) {
    var testList = ['John', 'Rohit'];
    localStorage.setItem('gamelist', JSON.stringify(testList));
  }
  var gameList = JSON.parse(localStorage.getItem('gamelist'));
  for (var i = 0; i < gameList.length; i++) {
    $('#game-select-form').prepend('<input type="radio" name="game-selected" value="' + gameList[i] + '"> ' + gameList[i] + '<br>');
  }
  // set first choice to checked
  $('#game-select-form > input[type="radio"]:first-child').prop('checked', true);
  $('#games').css('display', 'block'); // show games page
  var wordList = data.split('\n');
  wordList.pop(); // delete the extra new line at end
  var tst = new TST(wordList);
  console.log('Dictionary built.');
}
