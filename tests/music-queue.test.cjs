const test = require("node:test");
const assert = require("node:assert/strict");
const {
  shuffleSongs,
  shuffleWithCurrent,
  findSongIndex,
  nextSongIndex,
} = require("../lib/music-queue.ts");

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
}

test("shuffle is an immutable permutation of queue entries across collection sizes and random seeds", () => {
  for (let length = 0; length <= 16; length++) {
    const entries = Array.from({ length }, (_, index) => ({
      id: index % 3,
      entry: index,
    }));
    const before = [...entries];
    for (let seed = 1; seed <= 50; seed++) {
      const shuffled = shuffleSongs(entries, seededRandom(seed));
      assert.deepEqual(entries, before);
      assert.equal(shuffled.length, length);
      assert.deepEqual(
        shuffled.map((item) => item.entry).sort((a, b) => a - b),
        before.map((item) => item.entry),
      );
      assert.ok(shuffled.every((item) => before.includes(item)));
    }
  }
});

test("shuffle anchors only the selected occurrence and keeps intentional repeated song IDs", () => {
  const first = { id: 1, title: "First occurrence" };
  const second = { id: 1, title: "Second occurrence" };
  const other = { id: 2 };
  const input = [first, other, second];
  assert.equal(findSongIndex(input, second), 2);
  const result = shuffleWithCurrent(input, second, 2, () => 0);
  assert.equal(result[0], second);
  assert.equal(result.filter((item) => item.id === 1).length, 2);
  assert.ok(result.includes(first));
  assert.deepEqual(input, [first, other, second]);
  // The same song object may deliberately appear more than once in a playlist.
  const repeated = [first, other, first];
  assert.equal(findSongIndex(repeated, first, 2), 2);
  assert.equal(shuffleWithCurrent(repeated, first, 2, () => 0).length, 3);
});

test("empty queues, beginning/end boundaries, and repeat-all navigation have explicit outcomes", () => {
  assert.equal(nextSongIndex(0, -1, 1, false), null);
  assert.equal(nextSongIndex(0, 0, -1, true), null);
  assert.equal(nextSongIndex(-1, 0, 1, true), null);
  assert.equal(nextSongIndex(2.5, 0, 1, true), null);
  assert.equal(nextSongIndex(3, NaN, 1, true), 0);
  assert.equal(nextSongIndex(3, 0, 1, false), 1);
  assert.equal(nextSongIndex(3, 2, 1, false), null);
  assert.equal(nextSongIndex(3, 2, 1, true), 0);
  assert.equal(nextSongIndex(3, 0, -1, false), null);
  assert.equal(nextSongIndex(3, 0, -1, true), 2);
  assert.equal(nextSongIndex(1, 0, 1, true), 0);
  assert.equal(nextSongIndex(1, 0, -1, true), 0);
});

test("a currently playing song outside a replacement queue advances to its first song", () => {
  assert.equal(nextSongIndex(3, -1, 1, false), 0);
  assert.equal(nextSongIndex(3, -1, 1, true), 0);
  assert.equal(nextSongIndex(3, -1, -1, false), null);
  assert.equal(nextSongIndex(3, -1, -1, true), 2);
  for (let length = 1; length <= 10; length++) {
    for (let index = 0; index < length; index++) {
      for (const direction of [-1, 1]) {
        const next = nextSongIndex(length, index, direction, true);
        assert.ok(next >= 0 && next < length);
      }
    }
  }
});
