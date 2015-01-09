var fs = require("fs");
var readline = require("readline");
var stream = require("stream");

var frequencies = require("./frequencies");
var absDeltaSimilarity = frequencies.absDeltaSimilarity;
var byteFrequencies = frequencies.byteFrequencies;


function assertSameLength(a, b) {
  if (a.length != b.length) {
    throw new Error("Mismatched lengths");
  }
}


function fixedXOR(buf1, buf2) {
  assertSameLength(buf1, buf2);
  return encryptXOR(buf1, buf2);
}


function encryptXOR(plaintext, key) {
  var result = Buffer(plaintext.length);
  var k = 0;
  for (var i = 0; i < plaintext.length; ++i) {
    result[i] = plaintext[i] ^ key[k];
    k = (k + 1) % key.length;
  }
  return result;
}


function breakSingleByteXOR(input) {
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
    var result = breakSingleByteXOR(new Buffer(line, "hex"));
    if (result.score > best.score) {
      best = result;
    }
  });
  rl.on("close", function() {
    callback(best);
  });
}

function hammingDistance(buf1, buf2) {
  assertSameLength(buf1, buf2);
  var distance = 0;
  for (var i = 0; i < buf1.length; ++i) {
    var b1 = buf1[i];
    var b2 = buf2[i];
    for (var j = 0; j < 8; ++j) {
      var p = 1 << j;
      if (((b1 & p) === 0) ^ ((b2 & p) === 0)) {
        distance += 1;
      }
    }
  }
  return distance;
}

function breakRepeatingXOR(callback) {
  for (var keysize = 2; keysize <= 40; ++i) {
  }
}

module.exports.fixedXOR = fixedXOR;
module.exports.encryptXOR = encryptXOR
module.exports.breakSingleByteXOR = breakSingleByteXOR;
module.exports.detectSingleByteXOR = detectSingleByteXOR;
module.exports.hammingDistance = hammingDistance;

