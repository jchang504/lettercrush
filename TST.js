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
  // for blocked words
  var blocked;

  // getters
  this.getLetter = function() {
    return letter;
  }
  this.isEndsWord = function() {
    return endsWord;
  }
  this.getLeft = function() {
    return left;
  }
  this.getRight = function() {
    return right;
  }
  this.getNext = function() {
    return next;
  }

  // setters
  this.setLeft(aLeft) {
    left = aLeft;
  }
  this.setRight(aRight) {
    right = aRight;
  }
  this.setNext(aNext) {
    next = aNext;
  }
  this.setEndsWord(aEndsWord) {
    endsWord = aEndsWord;
  }

  // temp for debugging
  this.countNodes = function() {
    var count = 0;
    if (left != null) {
      count += left.countNodes();
    }
    if (right != null) {
      count += right.countNodes();
    }
    if (next != null) {
      count += next.countNodes();
    }
    return count+1;
  }

  // privileged methods

  /* Goes left or right to find the sibling matching the sibLetter, and
   * returns it. If it can't be found, returns null. May return itself.
   */
  this.findSibling = function(sibLetter) {
    if (sibLetter < letter) {
      if (left != null) {
        return left.findSibling();
      }
      else { // nothing on the left
        return null;
      }
    }
    else if (sibLetter > letter) {
      if (right != null) {
        return right.findSibling();
      }
      else { // nothing on the right
        return null;
      }
    }
    else { // sibLetter == letter
      return this;
    }
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
   * REQUIRES: word is a string
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
        if (next == null) {
          next = new Node();
        }
        next.insert(word.substring(1));
      }
    }

    else if (firstLetter < letter) {
      if (left == null) {
        left = new Node();
      }
      left.insert(word);
    }

    else {
      if (right == null) {
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

    if (firstLetter == letter) {
      if (word.length == 1) {
        return true;
      }
      else { // if more letters
        return next.lookup(word.substring(1));
      }
    }

    else if (firstLetter < letter) {
      if (left == null) {
        return false;
      }
      return left.lookup(word);
    }

    else { // firstLetter > letter
      if (right == null) {
        return false;
      }
      return right.lookup(word);
    }
  }

  /* Deletes this word from the TST, and adds it to the blocked list
   * REQUIRES: word is a string, minimum length 2, which is in the TST
   * ENSURES: if word is not found in TST, returns false; else returns true
   */
  this.block = function(word) {
    if (blocked === undefined) {
      blocked = [];
    }
    var start = this.findSibling(word.substring(0,1));
    if (start == null) {
      return false;
    }
    if (start.deleteWord(word.substring(1))) {
      blocked.push(word);
      return true;
    }
    else {
      return false;
    }
  }

  /* Deletes this word from the TST
   * REQUIRES: word is a string with length >= 1
   */
  this.deleteWord = function(word) {
    if (next == null) {
      return false;
    }
    var wordLetter = word.substring(0,1);
    if (word.length == 1) {
      var relation = 0; // parentNode.getNext() == childNode
      var parentNode = this;
      var childNode = next;
      var childLetter = childNode.getLetter();
      while (wordLetter != childLetter) {
        parentNode = childNode;
        if (wordLetter < childLetter) {
          childNode = childNode.getLeft();
          if (childNode == null) {
            return false;
          }
          relation = -1; // parentNode.getLeft() == childNode
        }
        else {
          childNode = childNode.getRight();
          if (childNode == null) {
            return false;
          }
          relation = 1; // parentNode.getRight() == childNode
        }
        childLetter = childNode.getLetter();
      } // now childLetter == wordLetter
      // if childNode is total leaf
      if (childNode.getLeft() == null && childNode.getRight() == null && childNode.getNext() == null) {
        switch(relation) { // remove it from tree
          case -1:
            parentNode.setLeft(null);
            break;
          case 0:
            parentNode.setNext(null);
            break;
          case 1:
            parentNode.setRight(null);
            break;
        }
      }
      else { // childNode is not a leaf
        childNode.setEndsWord(false);
      }
    }
    var nextNode = next.findSibling(wordLetter);
    if (nextNode == null) {
      return false;
    }
    return nextNode.deleteWord(word.substring(1));
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
