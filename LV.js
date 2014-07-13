// The main Letterpress Victory 2.0 file

// "import" the TST code
$.getScript("TST.js", loadDict);

// load the dictionary file
function loadDict() {
  $('#load-dict').css('display', 'block');
  $.get("dictionary.dat", function(data) {
    main(data);
    $('#done-dict').css('display', 'block');
  });
}

function main(data) {
  try {
    var start = new Date();
    var root = buildTST(data.split("\n"));
    var end = new Date();
    console.log("Time elapsed: " + String(end - start));
  }
  catch(e) {
    console.log(e);
  }
}
