// Adapted from table on http://www.data-compression.com/english.html
var ENGLISH_FREQUENCIES_INPUT = {
  'a': 0.0651738,
  'b': 0.0124248,
  'c': 0.0217339,
  'd': 0.0349835,
  'e': 0.1041442,
  'f': 0.0197881,
  'g': 0.0158610,
  'h': 0.0492888,
  'i': 0.0558094,
  'j': 0.0009033,
  'k': 0.0050529,
  'l': 0.0331490,
  'm': 0.0202124,
  'n': 0.0564513,
  'o': 0.0596302,
  'p': 0.0137645,
  'q': 0.0008606,
  'r': 0.0497563,
  's': 0.0515760,
  't': 0.0729357,
  'u': 0.0225134,
  'v': 0.0082903,
  'w': 0.0171272,
  'x': 0.0013692,
  'y': 0.0145984,
  'z': 0.0007836,
  ' ': 0.1918182,
}

module.exports.ENGLISH_BYTES = function() {
  var freqs = Float64Array(256);
  var a = "a".charCodeAt(0);
  var A = "A".charCodeAt(0);
  for (var i = 0; i < 26; ++i) {
    // Assume upper and lower have the same frequency for now...
    var f = ENGLISH_FREQUENCIES_INPUT[String.fromCharCode(a + i)];
    freqs[a + i] = f / 2;
    freqs[A + i] = f / 2;
  }
  freqs[" ".charCodeAt(0)] = ENGLISH_FREQUENCIES_INPUT[" "];
  return freqs
}();


function sum(arr) {
  var total = 0;
  for (var i = 0; i < arr.length; ++i) {
    total += arr[i];
  }
  return total;
}


module.exports.byteFrequencies = function(arr) {
  var counts = Int32Array(256);
  for (var i = 0; i < arr.length; ++i) {
    var b = arr[i];
    counts[b]++;
  }
  var freqs = Float64Array(256);
  var total = sum(counts);
  for (i = 0; i < 256; ++i) {
    freqs[i] = counts[i] / arr.length;
  }
  return freqs;
}


module.exports.absDeltaSimilarity = function(arr1, arr2) {
  if (arr1.length != arr2.length) {
    throw new Error("Mismatched lengths");
  }
  var delta = 0;
  for (var i = 0; i < arr1.length; ++i) {
    delta += Math.abs(arr1[i] - arr2[i]);
  }
  return 1 - (delta / arr1.length);
}
