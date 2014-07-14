// The main Letterpress Victory 2.0 file

// 'import' the TST code
$.getScript('TST.js', loadGame);

function loadGame() {
  $.getScript('Game.js', loadDict);
}

// load the dictionary file
function loadDict() {
  $('#load-dict').css('display', 'block');
  $.get('dictionary.dat', function(data) {
    main(data);
    $('#done-dict').css('display', 'block');
  });
}

function main(data) {
  try {
    var start = new Date();
    var root = buildTST(data.split('\n'));
    var end = new Date();
    console.log('Building dictionary time elapsed: ' + String(end - start));
    var testBoard = []
    for (var i = 0; i < 25; i++) {
      testBoard.push(['a', 0]);
    }
    var game = new Game('test', true, testBoard, ['zyzzyva'], new Date());
    game.printBoard();
    console.log('My turn: ' + String(game.isMyTurn()) + '; Current board value: ' + String(game.valueBoard()));
    var move1 = [0,0,0,1,0,
                 0,0,0,0,0,
                 0,1,0,0,0,
                 0,0,0,1,1,
                 0,0,0,1,1];
    console.log('move1 value: ' + String(game.valueMove(move1)));
    game.printBoard();
    console.log('My turn: ' + String(game.isMyTurn()) + '; Current board value: ' + String(game.valueBoard()));
    game.playMove(move1);
    game.printBoard();
    console.log('My turn: ' + String(game.isMyTurn()) + '; Current board value: ' + String(game.valueBoard()));
    start = new Date();
    game.findBestMoves(1);
    end = new Date();
    console.log('findBestMoves took: ' + String(end - start));
  }
  catch(e) {
    console.log(e);
  }
}
