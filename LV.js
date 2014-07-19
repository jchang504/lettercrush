// The main Letterpress Victory 2.0 file

// 'import' the TST code
$.getScript('TST.js', loadGame);

function loadGame() {
  $.getScript('Game.js', loadDict);
}

// load the dictionary file
function loadDict() {
  $('#load-dict').css('display', 'block');
  $.get('dictionary.dat', function(data) { // TST is 607490 nodes
    $('#done-dict').css('display', 'block');
    main(data);
  });
}

function main(data) {
  var start = new Date();
  var tst = new TST(data.split('\n'));
  var end = new Date();
  console.log('Building dictionary time elapsed: ' + String(end - start));
  console.log('Nodes: ' + String(tst.getRoot().countNodes()));
  console.log(tst.getRoot());
  console.log('praiseworthy: ' + String(tst.lookup('praiseworthy')));
  console.log('orthopterist: ' + String(tst.lookup('orthopterist')));
  var testLetters = ['w','z','x','t','o',
                     'y','t','e','h','b',
                     't','k','a','i','s',
                     't','m','r','p','r',
                     'y','t','v','o','t'];
  /*
  var testBoard = new Array(25);
  for (var i = 0; i < 25; i++) {
    testBoard[i] = [testLetters[i], 0];
  }
  var game = new Game('test', true, testBoard, ['praiseworthy', 'orthopterist'], root);
  start = new Date();
  game.findBestMoves(30);
  end = new Date();
  console.log('findBestMoves took: ' + String(end - start));
  */
}
