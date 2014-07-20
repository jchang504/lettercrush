// This file implements a Ternary Search Trie

/* Constructor for a TST
 * REQUIRES: dictionary is an array of lowercase words in alphabetical
 * order (very important for building a balanced tree!)
 */
function TST(dictionary) {
  var root = new TSTNode();
  var blocked = [];

  this.getRoot = function() {
    return root;
  }

  // Adds an array of words to the TST
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
   * REQUIRES: word is a lowercase string
   * ENSURES: inserts the word into the TST
   */
  this.insert = function(word) {
    var temp = root;
    var i = 0;
    while (i < word.length) {
      var wordLetter = word.substring(i,i+1);
      if (wordLetter === temp.letter || temp.letter === null) {
        temp.letter = wordLetter;
        if (i == word.length - 1) {
          temp.endsWord = true;
        }
        else { // if not done, go on to next
          if (temp.next == null) {
            temp.next = new TSTNode();
          }
          temp = temp.next;
        }
        i++; // go to next letter
      }
      else if (wordLetter < temp.letter) {
        if (temp.left == null) { // create node if needed
          temp.left = new TSTNode();
        }
        temp = temp.left; // move left
      }
      else { // wordLetter > temp.letter
        if (temp.right == null) { // create node if needed
          temp.right = new TSTNode();
        }
        temp = temp.right; // move right
      }
    }
    // end insert
  }

  // now finish constructing
  this.addWords(dictionary);

  // other, non-setup functions

  /* Lookup
   * REQUIRES: word is a string of length >= 1
   * ENSURES: returns true iff word is contained in the TST; false otherwise
   */
  this.lookup = function(word) {
    word = word.toLowerCase();
    var temp = root;
    for (var i = 0; i < word.length; i++) {
      temp = temp.findSibling(word.substring(i,i+1));
      if (temp == null) { // letter not found
        return false;
      }
      else { // temp.letter == word.substring(i,i+1); go to next
        if (i < word.length - 1) { // ONLY if not on the last letter!
          temp = temp.next;
        }
        if (temp == null) {
          return false;
        }
      }
    }
    // now temp is the node of the last letter, so
    return temp.endsWord;
  }

  /* Deletes a word from the TST and adds it to the blocked list
   * REQUIRES: word is a string of length >= 1
   * ENSURES: if the word is in the TST, removes it and adds it to the blocked
   * list
   */
  this.block = function(word) {
    var i = 0;
    var targetNode = root;
    var parentNode, relation;
    while (i < word.length) {
      if (targetNode == null) {
        return;
      }
      var wordLetter = word.substring(i,i+1);
      if (wordLetter < targetNode.letter) {
        relation = -1;
        parentNode = targetNode;
        targetNode = targetNode.left;
      }
      else if (wordLetter > targetNode.letter) {
        relation = 1;
        parentNode = targetNode;
        targetNode = targetNode.right;
      }
      else { // wordLetter == targetNode.letter
        if (i < word.length - 1) { // continue on
          relation = 0;
          parentNode = targetNode;
          targetNode = targetNode.next;
        }
        i++;
      }
    }
    // now targetNode, parentNode, and relation are set correctly
    // check if targetNode is a total leaf
    if (targetNode.left == null && targetNode.right == null && targetNode.next == null) {
      switch(relation) { // remove it from tree
        case -1:
          parentNode.left = null;
          break;
        case 0:
          parentNode.next = null;
          break;
        case 1:
          parentNode.right = null;
          break;
      }
    }
    else { // targetNode is not a leaf
      targetNode.endsWord = false;
    }
    blocked.push(word);
  }

  // unblocks (inserts) all blocked words
  this.unblock = function() {
    for (var i = 0; i < blocked.length; i++) {
      this.insert(blocked[i]);
    }
  }

}

/* Constructor for TSTNode class
 * Creates a new blank TSTNode (should only be called in TST methods, and
 * immediately filled with values)
 */
function TSTNode() {

  this.letter = null;
  this.endsWord = false;
  this.left = null;
  this.right = null;
  this.next = null;

}

/* Goes left or right to find the sibling matching the sibLetter, and
 * returns it. If it can't be found, returns null. May return itself.
 */
TSTNode.prototype.findSibling = function(sibLetter) {
  if (sibLetter < this.letter) {
    if (this.left != null) {
      return this.left.findSibling(sibLetter);
    }
    else { // nothing on the left
      return null;
    }
  }
  else if (sibLetter > this.letter) {
    if (this.right != null) {
      return this.right.findSibling(sibLetter);
    }
    else { // nothing on the right
      return null;
    }
  }
  else { // sibLetter == letter
    return this;
  }
}
