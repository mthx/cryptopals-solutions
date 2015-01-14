var fs = require("fs");
var Combinatorics = require("js-combinatorics").Combinatorics;

var frequencies = require("./frequencies");
var absDeltaSimilarity = frequencies.absDeltaSimilarity;
var byteFrequencies = frequencies.byteFrequencies;


function assertSameLength(a, b) {
  if (a.length != b.length) {
    throw new Error("Mismatched lengths");
  }
}


/**
 * Reads and decodes a base 64 encoded file with optional line endings.
 */
function readBase64(file) {
  // To work with Buffer's decoding we need to discard the line endings.
  var text = fs.readFileSync(file, "ascii");
  text = text.replace(/[\r\n]+/mg, "");
  return new Buffer(text, "base64");
}


/**
 * Repeating key XOR encryption.
 *
 * @param plaintext The plaintext as a Buffer.
 * @param key The key as a buffer.
 * @return A new, encrypted, buffer.
 */
function encryptXOR(plaintext, key) {
  var result = Buffer(plaintext.length);
  var k = 0;
  for (var i = 0; i < plaintext.length; ++i) {
    result[i] = plaintext[i] ^ key[k];
    k = (k + 1) % key.length;
  }
  return result;
}


/**
 * Scores a buffer based on how english-like it is.  Higher is better.
 */
function scoreEnglish(buf) {
  return absDeltaSimilarity(byteFrequencies(buf), frequencies.ENGLISH_BYTES);
}


/**
 * Exhaustively cracks single-byte XOR accepting the answer that most resembles English.
 *
 * @return Object with key, decrypted Buffer and score (English resemblence) properties.
 */
function breakSingleByteXOR(input) {
  var result = {score: -1, result: null, key: null};
  for (var b = 0; b < 256; ++b) {
    var key = new Buffer(1);
    key[0] = b;
    var decrypted = encryptXOR(input, key);
    var score = scoreEnglish(decrypted);
    if (score > result.score) {
      result.key = key[0];
      result.decrypted = decrypted;
      result.score = score;
    }
  }
  return result;
}


/**
 * Calculates the hamming distance between two buffers.
 */
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


/**
 * Guesses XOR keysize based on hamming distance.
 */
function guessKeySize(cryptotext, min, max, guesses) {
  if (min > max) {
    throw new Error("min > max");
  }
  var keysizeDifferences = [];
  for (var keysize = min; keysize <= max; ++keysize) {
    var chunks = Array(4);
    for (var chunk = 0; chunk < chunks.length; ++chunk) {
      chunks[chunk] = cryptotext.slice(chunk * keysize, (chunk + 1) * keysize);
    }
    var difference = 0;
    Combinatorics.combination(chunks, 2).forEach(function(a) {
      difference += hammingDistance(a[0], a[1]);
    });
    var normalizedDifference = difference / chunks.length / keysize;
    keysizeDifferences.push({keysize: keysize, difference: normalizedDifference});
  }
  keysizeDifferences.sort(function(a, b) {
    return a.difference - b.difference;
  });
  return keysizeDifferences.map(function(e) { return e.keysize; }).slice(0, guesses);
}


/**
 * Returns a new buffer containing every "spacing" byte from bufIn,
 * starting at "start".
 */
function everyNth(bufIn, start, spacing) {
  var bufOut = Buffer(bufIn.length / spacing);
  var j = 0;
  for (var i = start; i < bufIn.length; i += spacing) {
    bufOut[j++] = bufIn[i];
  }
  return bufOut.slice(0, j);
}


/**
 * Distributes bufIn over bufOut every "spacing" entries starting at "start". 
 */
function spread(bufIn, bufOut, start, spacing) {
  var j = 0;
  for (var i = start; i < bufOut.length; i += spacing) {
    bufOut[i] = bufIn[j++];
  }
}

/**
 * Fixed key XOR for Set 1 Exercise 2.
 */
function fixedXOR(buf1, buf2) {
  assertSameLength(buf1, buf2);
  return encryptXOR(buf1, buf2);
}


/**
 * Set 1 Exercise 4.
 */
function detectSingleByteXOR(callback) {
  var data = fs.readFileSync("data/4.txt", "ascii");
  var best = {"score": -1}; 
  data.split(/[\r\n]+/).forEach(function(line) {
    var result = breakSingleByteXOR(new Buffer(line, "hex"));
    if (result.score > best.score) {
      best = result;
    }
  });
  return best;
}


/**
 * Set 1 Exercise 6.
 */
function breakRepeatingXOR() {
  var cryptotext = readBase64("data/6.txt");
  var result = {score: -1, decrypted: null, key: null};
  guessKeySize(cryptotext, 2, 40, 3).forEach(function(keysize) {
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

