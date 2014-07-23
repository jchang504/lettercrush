<?php
  $grantCodes = array("5y9bT8B", "uj89Lvr", "Dby7Fs");
  $accessCode = filter_input(INPUT_POST, "accessCode", FILTER_SANITIZE_STRING);
  if (in_array($accessCode, $grantCodes, true)) {
    echo "grant";
  }
  else {
    echo "deny";
  }
?>
