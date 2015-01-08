var fs = require("fs");
var readline = require("readline");
var stream = require("stream");

var frequencies = require("./frequencies");
var absDeltaSimilarity = frequencies.absDeltaSimilarity;
var byteFrequencies = frequencies.byteFrequencies;


function fixedXOR(buf1, buf2) {
  if (buf1.length != buf2.length) {
    throw new Error("Mismatched lengths");
  }
  var result = Buffer(buf1.length);
  for (var i = 0; i < buf1.length; ++i) {
    result[i] = buf1[i] ^ buf2[i];
  }
  return result;
}


function decryptSingleByteXOR(input) {
  var best;
  var bestScore = -1;
  var key = new Buffer(input.length);
  for (var b = 0; b < 256; ++b) {
    key.fill(b);
    var decrypted = fixedXOR(input, key);
    var score = absDeltaSimilarity(byteFrequencies(decrypted), frequencies.ENGLISH_BYTES);
    if (score > bestScore) {
      best = decrypted;
      bestScore = score;
    }
  }
  return {"decrypted": best, "score": bestScore};
}

function detectSingleByteXOR(callback) {
  var instream = fs.createReadStream("data/4.txt");
  var outstream = new stream();
  var rl = readline.createInterface(instream, outstream);
  var best = {"score": -1}; 
  rl.on("line", function(line) {
    var result = decryptSingleByteXOR(new Buffer(line, "hex"));
    if (result.score > best.score) {
      best = result;
    }
  });
  rl.on("close", function() {
    callback(best);
  });
}

module.exports.fixedXOR = fixedXOR;
module.exports.decryptSingleByteXOR = decryptSingleByteXOR;
module.exports.detectSingleByteXOR = detectSingleByteXOR;

