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


function scoreEnglish(buf) {
  return absDeltaSimilarity(byteFrequencies(buf), frequencies.ENGLISH_BYTES);
}


function breakSingleByteXOR(input) {
  var result = {score: -1, result: null, key: null};
  var key = new Buffer(input.length);
  for (var b = 0; b < 256; ++b) {
    key.fill(b);
    var decrypted = fixedXOR(input, key);
    var score = scoreEnglish(decrypted);
    if (score > result.score) {
      result.key = key[0];
      result.decrypted = decrypted;
      result.score = score;
    }
  }
  return result;
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


function guessKeySize(cryptotext, guesses) {
  var keysizeDifferences = [];
  for (var keysize = 2; keysize <= 40; ++keysize) {
    var b1 = cryptotext.slice(0, keysize);
    var b2 = cryptotext.slice(keysize, keysize * 2);
    var b3 = cryptotext.slice(keysize * 2, keysize * 3);
    var b4 = cryptotext.slice(keysize * 3, keysize * 4);
    var differences = hammingDistance(b1, b2) + hammingDistance(b1, b3) + hammingDistance(b1, b4) + hammingDistance(b2, b3) + hammingDistance(b3, b4);
    differences = differences / keysize;
    differences = differences / 4;
    keysizeDifferences.push({keysize: keysize, difference: differences});
  }
  keysizeDifferences.sort(function(a, b) {
    return a.difference - b.difference;
  });
  console.log(keysizeDifferences);
  return keysizeDifferences.map(function(e) { return e.keysize; }).slice(0, guesses);
}


function everyNth(bufIn, start, spacing) {
  var bufOut = Buffer(bufIn.length / spacing);
  var j = 0;
  for (var i = start; i < bufIn.length; i += spacing) {
    bufOut[j++] = bufIn[i];
  }
  return bufOut.slice(0, j);
}


function spread(bufIn, bufOut, start, spacing) {
  var j = 0;
  for (var i = start; i < bufOut.length; i += spacing) {
    bufOut[i] = bufIn[j++];
  }
}


function breakRepeatingXOR() {
  var cryptotext = fs.readFileSync("data/6.txt", "ascii");
  cryptotext = cryptotext.replace(/[\r\n]+/mg, "");
  cryptotext = new Buffer(cryptotext, "base64");
  var result = {score: -1, decrypted: null, key: null};
  guessKeySize(cryptotext, 3).forEach(function(keysize) {
    var key = new Buffer(keysize);
    var decrypted = Buffer(cryptotext.length);
    for (var k = 0; k < keysize; ++k) {
      var kBuf = everyNth(cryptotext, k, keysize);
      var kBufResult = breakSingleByteXOR(kBuf);
      key[k] = kBufResult.key;
      var kBufDecrypted = kBufResult.decrypted;
      spread(kBufDecrypted, decrypted, k, keysize);
    }
    var score = scoreEnglish(decrypted);
    if (score > result.score) {
      result.decrypted = decrypted;
      result.key = key;
      result.score = score;
    }
  });
  return result;
}


// Well this is nasty.  Automatable by copying in code?  But you'd have to invent a way to denote private stuff.
module.exports.fixedXOR = fixedXOR;
module.exports.encryptXOR = encryptXOR
module.exports.breakSingleByteXOR = breakSingleByteXOR;
module.exports.detectSingleByteXOR = detectSingleByteXOR;
module.exports.hammingDistance = hammingDistance;
module.exports.breakRepeatingXOR = breakRepeatingXOR;

