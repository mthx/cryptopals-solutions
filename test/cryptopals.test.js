var cryptopals = require("../src/cryptopals");
var chai = require("chai");
var expect = chai.expect;

var expectEqualBuffers = function(b1, b2) {
  // For the sake of pretty failure messages (that, and == is just object equality)
  expect(b1.toString("hex")).to.equal(b2.toString("hex"));
}

describe("Set 1", function() {
  describe("Buffer", function() {
    it("Should be able to covert hex to base64", function() {
      var input = Buffer("49276d206b696c6c696e6720796f757220627261696e206c696b65206120706f69736f6e6f7573206d757368726f6f6d", "hex")
      var expected = "SSdtIGtpbGxpbmcgeW91ciBicmFpbiBsaWtlIGEgcG9pc29ub3VzIG11c2hyb29t";
      expect(input.toString("base64")).to.equal(expected);
    });
  });
  describe("Fixed XOR", function() {
    it("Should complain if buffer lengths are mismatched", function() {
      expect(function() { cryptopals.fixedXOR(Buffer(0), Buffer(1)); }).to.throw(Error);
    });
    it("Should match the example", function() {
      var input1 = Buffer("1c0111001f010100061a024b53535009181c", "hex")
      var input2 = Buffer("686974207468652062756c6c277320657965", "hex")
      var expected = Buffer("746865206b696420646f6e277420706c6179", "hex");
      expectEqualBuffers(cryptopals.fixedXOR(input1, input2), expected);
    });
  });
  describe("Single-byte XOR cipher", function() {
    it("Should decrypt to something believable", function() {
      var input = Buffer("1b37373331363f78151b7f2b783431333d78397828372d363c78373e783a393b3736", "hex")
      var expected = Buffer("Cooking MC's like a pound of bacon", "ascii");
      expectEqualBuffers(cryptopals.breakSingleByteXOR(input).decrypted, expected);
    });
  });
  describe("Detect single-byte XOR line", function() {
    it("Should decrypt to something believable", function() {
      var expected = Buffer("Now that the party is jumping\n", "ascii");
      expectEqualBuffers(cryptopals.detectSingleByteXOR().decrypted, expected);
    });
  });
  describe("Repeating key XOR", function() {
    it("Should encrypt the sample plaintext to the given ciphertext", function() {
      var input = Buffer("Burning 'em, if you ain't quick and nimble\nI go crazy when I hear a cymbal", "ascii");
      var expected = Buffer("0b3637272a2b2e63622c2e69692a23693a2a3c6324202d623d63343c2a26226324272765272a282b2f20430a652e2c652a3124333a653e2b2027630c692b20283165286326302e27282f", "hex");
      expectEqualBuffers(cryptopals.encryptXOR(input, new Buffer("ICE", "ascii")), expected);
    });
  });
  describe("Break repeating-key XOR", function() {
    it("Should calculate the sample hamming distance", function() {
      var input = Buffer("this is a test", "ascii");
      var expected = Buffer("wokka wokka!!!", "ascii");
      expect(cryptopals.hammingDistance(input, expected)).to.equal(37);
    });
    it("Should decrypt the cryptotext", function() {
      var result = cryptopals.breakRepeatingXOR();
      expectEqualBuffers(result.key, Buffer("Terminator X: Bring the noise", "ascii"));
    });
  });
});
