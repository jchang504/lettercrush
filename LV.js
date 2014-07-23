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
  var wordList = data.split('\n');
  wordList.pop(); // delete the extra new line at end
  var tst = new TST(wordList);
  var end = new Date();
  console.log('Building dictionary time elapsed: ' + String(end - start));
  var testLetters = ['w','z','x','t','o',
                     'y','t','e','h','b',
                     't','k','a','i','s',
                     't','m','r','p','r',
                     'y','t','v','o','t'];
  var realLetters = ['e','k','v','r','t',
                     'y','z','p','r','i',
                     'd','z','q','n','g',
                     'g','k','a','y','m',
                     'a','b','d','a','m'];
  var realBoard = new Array(25);
  var realColors = [-1,0,0,-1,1,
                    0,0,-1,-2,-1,
                    0,0,0,-1,-2,
                    -1,0,0,-1,-2,
                    0,0,0,-1,-2];
  for (var i = 0; i < 25; i++) {
    realBoard[i] = [realLetters[i], realColors[i]];
  }
  var game = new Game('test', true, realBoard, ['yammering', 'trinary','parrying'], tst);
  game.play([22, 23, 18, 10, 3, 0, 20, 24, 9, 13, 14, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]); // daydreaming
  start = new Date();
  game.findBestMoves(5, 10, 10);
  end = new Date();
  console.log('findBestMoves took: ' + String(end - start));
}
