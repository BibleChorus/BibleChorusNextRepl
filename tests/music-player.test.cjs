const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const React = require("react");
const { createRoot } = require("react-dom/client");
const act = React.act || require("react-dom/test-utils").act;
const axios = require("axios");
const { toast } = require("sonner");
const {
  MusicPlayerProvider,
  useMusicPlayer,
} = require("../contexts/MusicPlayerContext.tsx");

const song = (id, duration = 100) => ({
  id,
  title: `Song ${id}`,
  artist: `Artist ${id}`,
  audioUrl: `https://audio.example.test/${id}.mp3`,
  audio_url: `https://audio.example.test/${id}.mp3`,
  coverArtUrl: `https://images.example.test/${id}.png`,
  duration,
  uploaded_by: id,
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

// Render the actual React provider. Audio events/promises and analytics are mocked;
// these tests never load an audio file, call a database, or make a network request.
async function fixture(options = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://biblechorus.example.test",
  });
  const savedGlobals = new Map();
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    HTMLAudioElement: dom.window.HTMLAudioElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const media = {
    metadata: null,
    playbackState: "none",
    handlers: new Map(),
    setActionHandler(action, callback) {
      if (options.unsupported?.includes(action))
        throw new Error("Unsupported action");
      this.handlers.set(action, callback);
    },
  };
  Object.defineProperty(dom.window.navigator, "mediaSession", { value: media });
  globals.MediaMetadata = options.noMetadata
    ? undefined
    : class {
        constructor(data) {
          Object.assign(this, data);
        }
      };
  for (const [key, value] of Object.entries(globals)) {
    savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  }

  const states = new WeakMap();
  const state = (element) => {
    if (!states.has(element))
      states.set(element, {
        duration: NaN,
        time: 0,
        paused: true,
        playCalls: 0,
        pauseCalls: 0,
        loadCalls: 0,
        nextPlay: null,
      });
    return states.get(element);
  };
  const prototype = dom.window.HTMLMediaElement.prototype;
  const nativeSource = Object.getOwnPropertyDescriptor(prototype, "src");
  Object.defineProperty(prototype, "src", {
    configurable: true,
    get() {
      return nativeSource.get.call(this);
    },
    set(value) {
      nativeSource.set.call(this, value);
      const data = state(this);
      data.duration = NaN;
      data.time = 0;
      data.paused = true;
    },
  });
  for (const [property, field] of [
    ["duration", "duration"],
    ["currentTime", "time"],
    ["paused", "paused"],
  ])
    Object.defineProperty(prototype, property, {
      configurable: true,
      get() {
        return state(this)[field];
      },
      set(value) {
        state(this)[field] = value;
      },
    });
  prototype.play = function () {
    const data = state(this);
    data.playCalls++;
    data.paused = false;
    this.dispatchEvent(new dom.window.Event("play"));
    const pending = data.nextPlay;
    data.nextPlay = null;
    return pending || Promise.resolve();
  };
  prototype.pause = function () {
    const data = state(this);
    data.pauseCalls++;
    data.paused = true;
    this.dispatchEvent(new dom.window.Event("pause"));
  };
  prototype.load = function () {
    state(this).loadCalls++;
  };
  const posts = [];
  const errors = [];
  const infos = [];
  const originalPost = axios.post;
  const originalError = toast.error;
  const originalInfo = toast.info;
  axios.post = async (url) => {
    posts.push(url);
    if (options.failAnalytics) throw new Error("Offline analytics failure");
    return { data: {} };
  };
  toast.error = (message) => {
    errors.push(message);
  };
  toast.info = (message) => {
    infos.push(message);
  };
  let player;
  function Probe() {
    player = useMusicPlayer();
    return null;
  }
  const root = createRoot(dom.window.document.getElementById("root"));
  await act(async () =>
    root.render(
      React.createElement(
        MusicPlayerProvider,
        null,
        React.createElement(Probe),
      ),
    ),
  );
  const audio = dom.window.document.querySelector("audio");
  const action = async (fn) => {
    await act(async () => {
      await fn();
    });
  };
  return {
    get player() {
      return player;
    },
    audio,
    data: state(audio),
    media,
    posts,
    errors,
    infos,
    action,
    async event(name) {
      await action(() => audio.dispatchEvent(new dom.window.Event(name)));
    },
    async progress(time, duration) {
      if (duration !== undefined) state(audio).duration = duration;
      state(audio).time = time;
      await action(() =>
        audio.dispatchEvent(new dom.window.Event("timeupdate")),
      );
    },
    async end() {
      state(audio).paused = true;
      state(audio).time = Number.isFinite(state(audio).duration)
        ? state(audio).duration
        : 100;
      await action(() => audio.dispatchEvent(new dom.window.Event("ended")));
    },
    async close() {
      await act(async () => root.unmount());
      axios.post = originalPost;
      toast.error = originalError;
      toast.info = originalInfo;
      for (const [key, descriptor] of savedGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
      dom.window.close();
    },
  };
}

async function withPlayer(fn, options) {
  const f = await fixture(options);
  try {
    await fn(f);
  } finally {
    await f.close();
  }
}

test("native play/pause events keep UI state truthful and provider cleanup releases audio and media controls", async () => {
  const f = await fixture();
  try {
    assert.equal(f.player.currentSong, null);
    assert.equal(f.player.isPlaying, false);
    assert.equal(f.media.playbackState, "none");
    const a = song(1);
    const b = song(2);
    await f.action(() => f.player.playSong(a, [a, b]));
    assert.equal(f.player.isPlaying, true);
    assert.equal(f.audio.src, a.audioUrl);
    assert.equal(f.player.currentIndex, 0);
    assert.equal(f.media.metadata.title, a.title);
    await f.event("pause");
    assert.equal(f.player.isPlaying, false);
    assert.equal(f.media.playbackState, "paused");
    await f.action(() => f.player.resume());
    assert.equal(f.player.isPlaying, true);
    assert.equal(f.media.playbackState, "playing");
  } finally {
    await f.close();
  }
  assert.equal(f.data.paused, true);
  assert.equal(f.data.loadCalls, 1);
  assert.equal(f.media.metadata, null);
  assert.equal(f.media.playbackState, "none");
  for (const handler of f.media.handlers.values()) assert.equal(handler, null);
});

test("every repeated queue entry is traversed before stopping, and repeat-all wraps to the first entry", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    await f.action(() => f.player.playSong(a, [a, b, a, c]));
    for (const [id, index] of [
      [2, 1],
      [1, 2],
      [3, 3],
    ]) {
      await f.action(() => f.player.next());
      assert.equal(f.player.currentSong.id, id);
      assert.equal(f.player.currentIndex, index);
    }
    await f.end();
    assert.equal(f.player.currentIndex, 3);
    assert.equal(f.player.isPlaying, false);
    await f.action(() => {
      f.player.toggleRepeat();
      f.player.resume();
    });
    await f.end();
    assert.equal(f.player.currentIndex, 0);
    assert.equal(f.player.isPlaying, true);
  }));

test("repeat-one repeats on ended while explicit Next still advances; repeated mode toggles are not stale", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    await f.action(() => {
      f.player.playSong(a, [a, b]);
      f.player.toggleRepeat();
      f.player.toggleRepeat();
    });
    assert.equal(f.player.repeatMode, "one");
    await f.end();
    assert.equal(f.player.currentIndex, 0);
    assert.equal(f.audio.currentTime, 0);
    assert.equal(f.player.isPlaying, true);
    await f.action(() => f.player.next());
    assert.equal(f.player.currentIndex, 1);
    await f.end();
    assert.equal(f.player.currentIndex, 1);
    assert.equal(f.player.isPlaying, true);
    await f.action(() => f.player.toggleRepeat());
    assert.equal(f.player.repeatMode, "none");
    await f.end();
    assert.equal(f.player.isPlaying, false);
  }));

test("Previous restarts a progressed song, navigates near the beginning, wraps in repeat-all, and Next preserves pause", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    await f.action(() => f.player.playSong(b, [a, b]));
    f.audio.currentTime = 5;
    const plays = f.data.playCalls;
    await f.action(() => f.player.previous());
    assert.equal(f.audio.currentTime, 0);
    assert.equal(f.player.currentIndex, 1);
    assert.equal(f.data.playCalls, plays);
    f.audio.currentTime = 2;
    await f.action(() => f.player.previous());
    assert.equal(f.player.currentIndex, 0);
    f.audio.currentTime = 2;
    await f.action(() => f.player.previous());
    assert.equal(f.audio.currentTime, 0);
    assert.equal(f.player.currentIndex, 0);
    await f.action(() => {
      f.player.toggleRepeat();
      f.player.previous();
    });
    assert.equal(f.player.currentIndex, 1);
    await f.action(() => {
      f.player.pause();
      f.player.next();
    });
    assert.equal(f.player.currentIndex, 0);
    assert.equal(f.player.isPlaying, false);
  }));

test("queue replacement keeps an omitted song playing and Next starts the new collection", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    await f.action(() => f.player.playSong(a, [a]));
    const source = f.audio.src;
    await f.action(() => f.player.updateQueue([b, c]));
    assert.equal(f.player.currentSong.id, 1);
    assert.equal(f.audio.src, source);
    assert.equal(f.player.isPlaying, true);
    assert.equal(f.player.currentIndex, -1);
    await f.action(() => f.player.next());
    assert.equal(f.player.currentSong.id, 2);
    assert.equal(f.player.currentIndex, 0);
    await f.action(() => {
      f.player.updateQueue([]);
      f.player.next();
    });
    assert.equal(f.player.isPlaying, false);
    assert.equal(f.player.queue.length, 0);
  }));

test("shuffle preserves every entry, anchors the selected repeat, and restores that exact queue occurrence", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    const original = [a, b, a, c];
    await f.action(() => f.player.playSong(a, original, 2));
    assert.equal(f.player.currentIndex, 2);
    await f.action(() => f.player.toggleShuffle());
    assert.equal(f.player.currentIndex, 0);
    assert.equal(f.player.queue[0], a);
    assert.equal(f.player.queue.length, 4);
    assert.equal(f.player.queue.filter((item) => item.id === 1).length, 2);
    await f.action(() => f.player.toggleShuffle());
    assert.deepEqual(f.player.queue, original);
    assert.equal(f.player.currentIndex, 2);
    await f.action(() => f.player.next());
    assert.equal(f.player.currentSong.id, 3);
  }));

test("replacement while shuffled anchors an included current song without restarting it, and keeps omitted current outside", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    const d = song(4);
    await f.action(() => f.player.playSong(b, [a, b, c]));
    await f.action(() => f.player.toggleShuffle());
    f.audio.currentTime = 17;
    const plays = f.data.playCalls;
    await f.action(() => f.player.updateQueue([a, b, c, d]));
    assert.equal(f.player.queue[0].id, 2);
    assert.equal(f.player.currentIndex, 0);
    assert.equal(f.audio.currentTime, 17);
    assert.equal(f.data.playCalls, plays);
    await f.action(() => f.player.updateQueue([c, d]));
    assert.equal(f.player.currentSong.id, 2);
    assert.equal(f.player.currentIndex, -1);
    assert.equal(f.player.queue.length, 2);
    await f.action(() => f.player.next());
    assert.ok([3, 4].includes(f.player.currentSong.id));
    assert.equal(f.player.currentIndex, 0);
  }));

test("a song appended while shuffling remains current and stays in the restored queue", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    await f.action(() => f.player.playSong(a, [a, b]));
    await f.action(() => f.player.toggleShuffle());
    await f.action(() => f.player.playSong(c));
    await f.action(() => f.player.toggleShuffle());
    assert.deepEqual(
      f.player.queue.map((item) => item.id),
      [1, 2, 3],
    );
    assert.equal(f.player.currentSong.id, 3);
    assert.equal(f.player.currentIndex, 2);
  }));

test("shuffle loader is called once, keeps the latest selected song, and turning shuffle off does not reload", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    const pending = deferred();
    let calls = 0;
    await f.action(() => {
      f.player.playSong(a, [a, b]);
      f.player.registerShuffleLoader(async () => {
        calls++;
        return pending.promise;
      });
    });
    let first;
    await f.action(() => {
      first = f.player.toggleShuffle();
    });
    await f.action(() => f.player.toggleShuffle());
    assert.equal(calls, 1);
    await f.action(() => f.player.playSong(b));
    pending.resolve([a, b, c]);
    await f.action(() => first);
    assert.equal(f.player.queue[0].id, 2);
    assert.equal(f.player.currentIndex, 0);
    await f.action(() => f.player.toggleShuffle());
    assert.equal(calls, 1);
    assert.deepEqual(
      f.player.queue.map((item) => item.id),
      [1, 2, 3],
    );
    assert.equal(f.player.currentIndex, 1);
  }));

test("loader disposal is scoped, and a failed loader retains a usable local queue", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    let firstCalls = 0;
    let secondCalls = 0;
    await f.action(() => f.player.playSong(a, [a, b]));
    const disposeFirst = f.player.registerShuffleLoader(async () => {
      firstCalls++;
      return [a];
    });
    const disposeSecond = f.player.registerShuffleLoader(async () => {
      secondCalls++;
      throw new Error("Offline loader");
    });
    disposeFirst();
    await f.action(() => f.player.toggleShuffle());
    assert.equal(firstCalls, 0);
    assert.equal(secondCalls, 1);
    assert.equal(f.player.queue.length, 2);
    assert.equal(f.infos.length, 1);
    await f.action(() => f.player.toggleShuffle());
    disposeSecond();
    await f.action(() => f.player.toggleShuffle());
    assert.equal(secondCalls, 1);
  }));

test("rejected play promises cannot leave a playing UI, and stale rejections cannot stop a newer song or resumed playback", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const failed = deferred();
    f.data.nextPlay = failed.promise;
    await f.action(() => f.player.playSong(a, [a, b]));
    failed.reject(
      Object.assign(new Error("Unavailable"), { name: "NotSupportedError" }),
    );
    await f.action(async () => {});
    assert.equal(f.player.isPlaying, false);
    assert.equal(f.errors.length, 1);
    const old = deferred();
    f.data.nextPlay = old.promise;
    await f.action(() => f.player.resume());
    await f.action(() => f.player.playSong(b));
    old.reject(new Error("Stale failure"));
    await f.action(async () => {});
    assert.equal(f.player.currentSong.id, 2);
    assert.equal(f.player.isPlaying, true);
    assert.equal(f.errors.length, 1);
    const paused = deferred();
    f.data.nextPlay = paused.promise;
    await f.action(() => f.player.resume());
    await f.action(() => f.player.pause());
    paused.reject(new Error("Paused attempt"));
    await f.action(async () => {});
    assert.equal(f.player.isPlaying, false);
    assert.equal(f.errors.length, 1);
    const aborted = deferred();
    f.data.nextPlay = aborted.promise;
    await f.action(() => f.player.resume());
    aborted.reject(Object.assign(new Error("Abort"), { name: "AbortError" }));
    await f.action(async () => {});
    assert.equal(f.player.isPlaying, false);
    assert.equal(f.errors.length, 1);
  }));

test("play counts use each song duration, count once after 30 percent, and analytics failure never interrupts audio", () =>
  withPlayer(
    async (f) => {
      const a = song(1, 100);
      const b = song(2, 200);
      const c = song(3, 100);
      await f.action(() => f.player.playSong(a, [a, b, c]));
      await f.progress(29, 100);
      assert.equal(f.posts.length, 0);
      await f.progress(30);
      await f.progress(80);
      assert.deepEqual(f.posts, ["/api/songs/1/increment-play-count"]);
      await f.action(() => f.player.next());
      assert.ok(Number.isNaN(f.audio.duration));
      await f.progress(59);
      assert.equal(f.posts.length, 1);
      await f.progress(60);
      assert.equal(f.posts[1], "/api/songs/2/increment-play-count");
      await f.action(() => f.player.next());
      await f.progress(100, 400);
      assert.equal(f.posts.length, 2);
      await f.progress(120);
      await f.progress(300);
      assert.equal(f.posts[2], "/api/songs/3/increment-play-count");
      assert.equal(f.posts.length, 3);
      assert.equal(f.player.isPlaying, true);
    },
    { failAnalytics: true },
  ));

test("MediaSession controls track the real player and unsupported metadata/actions do not break playback", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    await f.action(() => f.player.playSong(a, [a, b]));
    await f.action(() => f.media.handlers.get("pause")());
    assert.equal(f.player.isPlaying, false);
    await f.action(() => f.media.handlers.get("play")());
    assert.equal(f.player.isPlaying, true);
    await f.action(() => f.media.handlers.get("nexttrack")());
    assert.equal(f.player.currentSong.id, 2);
    assert.equal(f.media.metadata.title, b.title);
    await f.action(() => f.media.handlers.get("previoustrack")());
    assert.equal(f.player.currentSong.id, 1);
  }));

test("partial MediaSession support and native stream errors leave a usable, truthful player", () =>
  withPlayer(
    async (f) => {
      const a = song(1);
      await f.action(() => f.player.playSong(a, [a]));
      assert.equal(f.player.isPlaying, true);
      assert.equal(f.media.metadata, null);
      assert.ok(f.media.handlers.get("pause"));
      await f.event("error");
      assert.equal(f.player.isPlaying, false);
      assert.equal(f.errors.length, 1);
    },
    { unsupported: ["nexttrack"], noMetadata: true },
  ));

test("late shuffle results cannot replace a newly selected collection or survive loader disposal", () =>
  withPlayer(async (f) => {
    const a = song(1);
    const b = song(2);
    const c = song(3);
    const first = deferred();
    await f.action(() => {
      f.player.playSong(a, [a, b]);
      f.player.registerShuffleLoader(() => first.promise);
    });
    let pending;
    await f.action(() => {
      pending = f.player.toggleShuffle();
    });
    await f.action(() => f.player.playSong(c, [c]));
    first.resolve([a, b]);
    await f.action(() => pending);
    assert.deepEqual(
      f.player.queue.map((item) => item.id),
      [3],
    );
    assert.equal(f.player.currentSong.id, 3);
    assert.equal(f.player.isShuffling, false);
    const second = deferred();
    const dispose = f.player.registerShuffleLoader(() => second.promise);
    await f.action(() => {
      pending = f.player.toggleShuffle();
    });
    dispose();
    second.resolve([a, b]);
    await f.action(() => pending);
    assert.deepEqual(
      f.player.queue.map((item) => item.id),
      [3],
    );
    assert.equal(f.player.isShuffling, false);
  }));

test("repeat-one begins another listen and counts it only after the new playback threshold", () =>
  withPlayer(async (f) => {
    const a = song(1, 100);
    await f.action(() => {
      f.player.playSong(a, [a]);
      f.player.toggleRepeat();
      f.player.toggleRepeat();
    });
    await f.progress(30, 100);
    assert.equal(f.posts.length, 1);
    await f.end();
    await f.progress(29, 100);
    assert.equal(f.posts.length, 1);
    await f.progress(30);
    await f.progress(80);
    assert.equal(f.posts.length, 2);
  }));
