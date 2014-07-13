// This file implements a Ternary Search Trie

/* Constructor for Node class
 * REQUIRES: true
 * ENSURES: returns a Node
 */
function Node() {
  // private variables
  var letter = null;
  var endsWord = null;
  var left = null;
  var right = null;
  var next = null;

  this.addWords = function(words) {
    if (words.length <= 2) {
      for (var i = 0; i < words.length; i++) {
        if (words[i].length !== 0) {
          this.insert(words[i]);
        }
      }
    }
    else { // length >= 3
      var medianIndex = Math.floor(words.length / 2);
      this.insert(words[medianIndex]);
      this.addWords(words.slice(0, medianIndex)); // add left
      this.addWords(words.slice(medianIndex + 1, words.length)); // add right
    }
  }

  /* Insert
   * REQUIRES: letter is a string of length 1
   * ENSURES: inserts the word into the TST
   */
  this.insert = function(word) {
    var firstLetter = word.substring(0,1);

    if (firstLetter === letter || letter === null) {
      letter = firstLetter;
      if (word.length == 1) {
        endsWord = true;
      }
      else { // if more letters
        if (next === null) {
          next = new Node();
        }
        next.insert(word.substring(1));
      }
    }

    else if (firstLetter < letter) {
      if (left === null) {
        left = new Node();
      }
      left.insert(word);
    }

    else {
      if (right === null) {
        right = new Node();
      }
      right.insert(word);
    }
  }

  /* Lookup
   * REQUIRES: word is a string
   * ENSURES: returns true iff word is contained in the TST rooted at
   * this node
   */
  this.lookup = function(word) {
    var firstLetter = word.substring(0,1).toLowerCase();

    if (firstLetter === letter) {
      if (word.length == 1) {
        return true;
      }
      else { // if more letters
        return next.lookup(word.substring(1));
      }
    }

    else if (firstLetter < letter) {
      if (left === null) {
        return false;
      }
      return left.lookup(word);
    }

    else { // firstLetter > letter
      if (right === null) {
        return false;
      }
      return right.lookup(word);
    }
  }

}

/* REQUIRES: words is an alphabetically-sorted list of words
 * ENSURES: returns a balanced TST containing words
 */
function buildTST(words) {
  var root = new Node();
  root.addWords(words);
  return root;
}
