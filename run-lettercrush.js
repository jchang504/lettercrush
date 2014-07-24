// Runs the Lettercrush application

DEBUG = true;

$(document).ready(checkStorage);

function checkStorage() {
  if (DEBUG) { console.log('CALL checkStorage'); }
  if (typeof(Storage) !== "undefined") { // check if Web Storage supported
    $('#no-storage').css('display', 'none');
    $('#yes-storage').css('display', 'block');
    checkAccess();
  }
}

// Adds handler for checking access code when the Go button is clicked
function checkAccess() {
  if (DEBUG) { console.log('CALL checkAccess'); }
  $('#access-form').submit(function(e) {
    if (DEBUG) { console.log('form submitted'); }
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
    return false; // prevent default form action
  });
}

// beginning of actual AI code
function loadTST() {
  if (DEBUG) { console.log('CALL loadTST'); }
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

}
