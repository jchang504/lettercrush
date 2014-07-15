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
    var testLetters = ['l','p','t','o','m',
                       'c','n','x','h','p',
                       'l','o','n','b','n',
                       'y','f','b','t','t',
                       'm','n','v','a','t'];
    var testBoard = new Array(25);
    for (var i = 0; i < 25; i++) {
      testBoard[i] = [testLetters[i], 0];
    }
    var game = new Game('test', true, testBoard, ['zyzzyva'], new Date());
    start = new Date();
    game.findBestMoves(root, 30);
    end = new Date();
    console.log('findBestMoves took: ' + String(end - start));
  }
  catch(e) {
    console.log(e);
  }
}
