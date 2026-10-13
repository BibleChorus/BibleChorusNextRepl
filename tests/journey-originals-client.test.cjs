const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
// Load DOM-sensitive React/Radix modules as browser modules rather than SSR
// modules. Each test below still receives its own isolated document.
const bootstrapDom = new JSDOM("<html><body></body></html>");
const bootstrapGlobals = new Map();
for (const [key, value] of Object.entries({ window: bootstrapDom.window, document: bootstrapDom.window.document, navigator: bootstrapDom.window.navigator })) {
  bootstrapGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}
const React = require("react");
const act = React.act || require("react-dom/test-utils").act;
const axios = require("axios");
const { toast } = require("sonner");
const { AuthProvider, useAuth } = require("../contexts/AuthContext.tsx");
const {
  MusicPlayerProvider,
  useMusicPlayer,
} = require("../contexts/MusicPlayerContext.tsx");
const {
  JourneyOriginalsViewer,
  JourneyOriginalPreview,
} = require("../components/JourneysPage/JourneyOriginalsViewer.tsx");
const { JourneySplitPanel } = require("../components/JourneysPage/JourneySplitPanel.tsx");
const { JourneyOriginalsEditor } = require("../components/JourneysPage/JourneyOriginalsEditor.tsx");
const { JourneyHero } = require("../components/JourneysPage/JourneyHero.tsx");
const {
  validateOriginalFile,
  matchesOriginalFile,
  prepareOriginalSession,
} = require("../components/JourneysPage/originals-client.ts");
for (const [key, descriptor] of bootstrapGlobals) {
  if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  else delete globalThis[key];
}
bootstrapDom.window.close();

const original = (id, kind = "audio", overrides = {}) => ({
  id,
  journey_entry_id: 10,
  kind,
  label: `Original ${id}`,
  display_order: id,
  is_shared: false,
  status: "ready",
  journal_text: kind === "journal" ? "A memory worth keeping.\nAnother line." : null,
  file_name: kind === "journal" ? null : `recording-${id}.mp3`,
  mime_type: kind === "journal" ? null : "audio/mpeg",
  byte_size: kind === "journal" ? null : 1024,
  file_url: kind === "journal" ? null : `/api/journeys/originals/${id}/file`,
  created_at: "2026-10-13T00:00:00Z",
  updated_at: "2026-10-13T00:00:00Z",
  ...overrides,
});
const song = (id) => ({
  id,
  title: `Song ${id}`,
  audioUrl: `https://audio.example.test/${id}.mp3`,
  audio_url: `https://audio.example.test/${id}.mp3`,
  duration: 100,
  uploaded_by: 1,
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

// Real React providers/components with deterministic browser media and transport.
// No file, network, storage, database, email, or live authentication is accessed.
async function fixture(children = null, options = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
    url: "https://biblechorus.example.test",
    pretendToBeVisual: true,
  });
  const token = `offline.${Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url")}.test`;
  const user = { id: 1, username: "creator", email: "creator@example.test" };
  dom.window.localStorage.setItem("token", token);
  dom.window.localStorage.setItem("user", JSON.stringify(user));
  const savedGlobals = new Map();
  const fetches = [];
  const globals = {
    // tsx's standalone runner uses classic JSX for modules compiled by Next
    // with automatic JSX in production (including the existing AuthProvider).
    React,
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    localStorage: dom.window.localStorage,
    HTMLElement: dom.window.HTMLElement,
    HTMLInputElement: dom.window.HTMLInputElement,
    HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
    HTMLAudioElement: dom.window.HTMLAudioElement,
    Node: dom.window.Node,
    NodeFilter: dom.window.NodeFilter,
    MutationObserver: dom.window.MutationObserver,
    CustomEvent: dom.window.CustomEvent,
    File: dom.window.File,
    FileList: dom.window.FileList,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true,
    fetch: async (url, config) => {
      fetches.push({ url, config });
      assert.equal(url, "/api/auth/session", "Unexpected fetch is denied by the offline fixture");
      return { ok: true, status: 200, json: async () => ({ user, token }) };
    },
  };
  for (const [key, value] of Object.entries(globals)) {
    savedGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const states = new WeakMap();
  const mediaState = (element) => {
    if (!states.has(element)) states.set(element, {
      paused: true, time: 0, duration: NaN, plays: 0, pauses: 0, loads: 0,
    });
    return states.get(element);
  };
  const mediaPrototype = dom.window.HTMLMediaElement.prototype;
  for (const [property, field] of [["paused", "paused"], ["currentTime", "time"], ["duration", "duration"]]) {
    Object.defineProperty(mediaPrototype, property, {
      configurable: true,
      get() { return mediaState(this)[field]; },
      set(value) { mediaState(this)[field] = value; },
    });
  }
  mediaPrototype.play = function () {
    const data = mediaState(this);
    data.plays++;
    data.paused = false;
    this.dispatchEvent(new dom.window.Event("play"));
    return Promise.resolve();
  };
  mediaPrototype.pause = function () {
    const data = mediaState(this);
    data.pauses++;
    data.paused = true;
    this.dispatchEvent(new dom.window.Event("pause"));
  };
  mediaPrototype.load = function () { mediaState(this).loads++; };
  const requests = [];
  const axiosOriginals = new Map();
  const handlers = { ...options.handlers };
  const serverOriginals = new Map();
  const seedOriginals = (node) => {
    React.Children.forEach(node, (element) => {
      if (!React.isValidElement(element)) return;
      for (const item of element.props.originals || element.props.entry?.originals || []) serverOriginals.set(item.id, item);
      if (element.props.original) serverOriginals.set(element.props.original.id, element.props.original);
      if (element.props.context) seedOriginals(element.props.context);
      if (element.props.children) seedOriginals(element.props.children);
    });
  };
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    axiosOriginals.set(method, axios[method]);
    axios[method] = async (url, ...args) => {
      const body = method === "get" || method === "delete" ? undefined : args[0];
      const config = method === "get" || method === "delete" ? args[0] : args[1];
      const request = { method, url, body, config };
      requests.push(request);
      if (handlers[method]) return handlers[method](request);
      if (method === "get" && url === "/api/auth/session") return { data: { user, token } };
      if (method === "get" && /^\/api\/journeys\/originals\/\d+$/.test(url)) {
        const detail = serverOriginals.get(Number(url.split("/").pop()));
        assert.ok(detail, "Preview detail must be seeded by this test");
        return { data: { original: detail } };
      }
      if (method === "post" && /\/increment-play-count$/.test(url)) return { data: {} };
      throw new Error(`Unexpected offline request: ${method} ${url}`);
    };
  }
  const messages = [];
  const toastOriginals = new Map();
  for (const method of ["error", "info", "success"]) {
    toastOriginals.set(method, toast[method]);
    toast[method] = (message) => { messages.push({ method, message }); };
  }
  let player;
  let auth;
  function Probe() { player = useMusicPlayer(); auth = useAuth(); return null; }
  const { createRoot } = require("react-dom/client");
  const root = createRoot(dom.window.document.getElementById("root"));
  const action = async (fn) => { await act(async () => { await fn(); }); };
  const render = async (nextChildren) => {
    seedOriginals(nextChildren);
    await action(() => root.render(
      React.createElement(AuthProvider, null,
        React.createElement(MusicPlayerProvider, null,
          React.createElement(Probe), nextChildren)),
    ));
  };
  await render(children);
  return {
    dom, root, token, requests, fetches, messages, handlers, serverOriginals, render, action, mediaState,
    get player() { return player; },
    get auth() { return auth; },
    get main() { return player.audioElement; },
    get document() { return dom.window.document; },
    button(label, within = dom.window.document) {
      const button = [...within.querySelectorAll("button")].find((element) =>
        element.getAttribute("aria-label") === label || element.textContent.trim() === label || element.textContent.includes(label));
      assert.ok(button, `Missing button: ${label}`);
      return button;
    },
    async click(button) { await action(() => button.click()); },
    async input(element, value) {
      const prototype = element.tagName === "TEXTAREA" ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
      await action(() => require("react-dom/test-utils").Simulate.change(element, { target: element }));
    },
    async selectFile(element, file) {
      Object.defineProperty(element, "files", { configurable: true, value: [file] });
      await action(() => element.dispatchEvent(new dom.window.Event("change", { bubbles: true })));
    },
    async submit(form) {
      await action(() => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
    },
    async close() {
      await action(() => root.unmount());
      for (const [method, value] of axiosOriginals) axios[method] = value;
      for (const [method, value] of toastOriginals) toast[method] = value;
      for (const [key, descriptor] of savedGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
      dom.window.close();
    },
  };
}

async function withFixture(children, run, options) {
  const f = await fixture(children, options);
  try { await run(f); } finally { await f.close(); }
}

test("source audio switches pause other streams while keeping listening positions, queue, and selected occurrence", () =>
  withFixture(React.createElement(JourneyOriginalsViewer, { originals: [original(1), original(2)] }), async (f) => {
    const a = song(10);
    const b = song(20);
    await f.action(() => f.player.playSong(a, [a, b, a], 2));
    f.main.currentTime = 37;
    const mainSource = f.main.src;
    const queue = [...f.player.queue];
    assert.equal(f.document.querySelectorAll('audio[controls]').length, 0, "Previews must stay lazy");
    await f.click(f.button("Original 1"));
    const first = f.document.querySelector('audio[aria-label="Original recording: Original 1"]');
    assert.ok(first);
    assert.equal(first.preload, "none");
    first.currentTime = 11;
    await f.action(() => first.play());
    assert.equal(f.main.paused, true);
    assert.equal(f.player.isPlaying, false);
    assert.equal(first.paused, false);
    assert.equal(f.main.currentTime, 37);
    await f.click(f.button("Original 2"));
    const second = f.document.querySelector('audio[aria-label="Original recording: Original 2"]');
    second.currentTime = 23;
    await f.action(() => second.play());
    assert.equal(first.paused, true);
    assert.equal(first.currentTime, 11);
    assert.equal(second.paused, false);
    await f.action(() => f.player.resume());
    assert.equal(f.player.isPlaying, true);
    assert.equal(first.paused, true);
    assert.equal(second.paused, true);
    assert.equal(first.currentTime, 11);
    assert.equal(second.currentTime, 23);
    assert.equal(f.main.currentTime, 37);
    assert.equal(f.main.src, mainSource);
    assert.deepEqual(f.player.queue, queue);
    assert.equal(f.player.currentIndex, 2);
    // A native finished-song play event also arbitrates source playback.
    await f.action(() => second.play());
    await f.action(() => f.main.play());
    assert.equal(second.paused, true);
    await f.click(f.button("Original 1"));
    assert.equal(f.document.querySelector('audio[aria-label="Original recording: Original 1"]'), first);
    assert.equal(first.currentTime, 11, "Returning to a visited preview retains its position");
  }));

test("repeated viewer navigation releases source audio and listeners without stopping or resetting the song", () =>
  withFixture(null, async (f) => {
    const current = song(1);
    await f.action(() => f.player.playSong(current, [current, song(2)]));
    f.main.currentTime = 42;
    for (let visit = 0; visit < 4; visit++) {
      await f.render(React.createElement(JourneyOriginalsViewer, { originals: [original(1)] }));
      await f.click(f.button("Original 1"));
      const source = f.document.querySelector("audio[controls]");
      source.currentTime = 9;
      await f.action(() => source.play());
      assert.equal(f.main.paused, true);
      await f.render(null);
      assert.equal(source.paused, true);
      assert.equal(source.hasAttribute("src"), false);
      assert.equal(f.mediaState(source).loads, 1);
      await f.action(() => f.player.resume());
      const mainPauses = f.mediaState(f.main).pauses;
      await f.action(() => source.dispatchEvent(new f.dom.window.Event("play")));
      assert.equal(f.mediaState(f.main).pauses, mainPauses, "Disposed source cannot pause the current song");
      assert.equal(f.player.isPlaying, true);
      assert.equal(f.main.currentTime, 42);
      assert.deepEqual(f.player.queue.map((item) => item.id), [1, 2]);
      assert.equal(f.player.currentIndex, 0);
    }
  }));

test("label and sharing updates refresh authorization without replacing the loaded recording or its listening position", () =>
  withFixture(React.createElement(JourneyOriginalsViewer, { originals: [original(1)] }), async (f) => {
    await f.click(f.button("Original 1"));
    const source = f.document.querySelector("audio[controls]");
    source.currentTime = 29;
    await f.action(() => source.play());
    const checks = f.requests.filter((request) => request.url === "/api/journeys/originals/1").length;
    await f.render(React.createElement(JourneyOriginalsViewer, { originals: [original(1, "audio", {
      label: "Renamed recording", is_shared: true, updated_at: "2026-10-13T01:00:00Z",
    })] }));
    assert.equal(f.document.querySelector("audio[controls]"), source);
    assert.equal(source.currentTime, 29);
    assert.equal(source.paused, false);
    assert.equal(source.getAttribute("aria-label"), "Original recording: Renamed recording");
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/1").length, checks + 1);
  }));

test("viewer sorts ready originals, labels controls, defers private media, and never uses a supplied public URL", () =>
  withFixture(React.createElement(JourneyOriginalsViewer, { originals: [
    original(3, "image", { display_order: 0, label: "Early image", file_url: "https://public.example.test/unsafe.jpg" }),
    original(2, "journal", { display_order: 2 }),
    original(1, "audio", { display_order: 1 }),
    original(4, "audio", { status: "pending" }),
  ] }), async (f) => {
    const section = f.document.querySelector('section[aria-label="Journey originals"]');
    assert.ok(section);
    const buttons = [...section.querySelectorAll("button")];
    assert.equal(buttons.length, 3);
    assert.match(buttons[0].textContent, /Early image/);
    assert.equal(section.querySelectorAll("img,iframe,audio").length, 0);
    assert.equal(f.requests.length, 0, "Unopened originals cannot request a preview session");
    for (const button of buttons) {
      assert.equal(button.type, "button");
      assert.equal(button.getAttribute("aria-expanded"), "false");
      const panel = f.document.getElementById(button.getAttribute("aria-controls"));
      assert.ok(panel);
      assert.equal(panel.hidden, true);
      assert.match(button.textContent, /Private/);
      assert.match(button.className, /focus-visible:ring-2/);
    }
    await f.click(buttons[0]);
    assert.equal(buttons[0].getAttribute("aria-expanded"), "true");
    const image = f.document.querySelector("img");
    assert.equal(image.alt, "Early image");
    assert.equal(image.getAttribute("loading"), "lazy");
    assert.equal(image.getAttribute("src"), "/api/journeys/originals/3/file");
    assert.equal(image.src.includes("unsafe"), false);
    assert.ok(f.requests.every((request) => ["/api/auth/session", "/api/journeys/originals/3"].includes(request.url)));
    assert.ok(f.requests.every((request) => request.config.headers.Authorization === `Bearer ${f.token}`));
    assert.equal(section.querySelector("a").getAttribute("rel"), "noopener noreferrer");
    await f.click(f.button("Original 2"));
    assert.match(section.textContent, /A memory worth keeping\.\nAnother line\./);
    assert.equal(f.document.getElementById(buttons[0].getAttribute("aria-controls")).hidden, true);
  }));

test("preview authentication failures expose a labeled retry and unmount aborts unfinished session preparation", () =>
  withFixture(React.createElement(JourneyOriginalPreview, { original: original(1) }), async (f) => {
    assert.match(f.document.querySelector('[role="alert"]').textContent, /could not load/);
    const pending = deferred();
    f.handlers.get = ({ config }) => {
      pending.signal = config.signal;
      return pending.promise;
    };
    await f.click(f.button("Try preview again"));
    assert.ok(f.document.querySelector('[role="status"]'));
    assert.equal(pending.signal.aborted, false);
    await f.render(null);
    assert.equal(pending.signal.aborted, true);
    pending.resolve({ data: {} });
    await f.action(async () => {});
    assert.equal(f.document.querySelector("audio[controls]"), null);
  }, { handlers: { get: async () => { throw new Error("Offline"); } } }));

test("a rejected lazy journal detail never renders text supplied by an older list or owner", () =>
  withFixture(React.createElement(JourneyOriginalPreview, { original: original(1, "journal", { journal_text: "Old private journal bytes" }) }), async (f) => {
    assert.ok(f.document.querySelector('[role="alert"]'));
    assert.equal(f.document.body.textContent.includes("Old private journal bytes"), false);
    assert.equal(f.requests.length >= 1, true);
    assert.ok(f.requests.every((request) => request.url === "/api/journeys/originals/1"));
  }, { handlers: { get: async () => { throw Object.assign(new Error("Not authorized"), { isAxiosError: true, response: { status: 403 } }); } } }));

test("PDF preview and its explicit fallback links remain lazy and use protected delivery routes", () =>
  withFixture(React.createElement(JourneyOriginalsViewer, { originals: [original(3, "pdf", { label: "Journal scans", file_name: "memory.pdf", mime_type: "application/pdf" })] }), async (f) => {
    assert.equal(f.document.querySelector("iframe"), null);
    await f.click(f.button("Journal scans"));
    const frame = f.document.querySelector("iframe");
    assert.equal(frame.title, "PDF preview: Journal scans");
    assert.equal(frame.getAttribute("loading"), "lazy");
    assert.equal(frame.getAttribute("src"), "/api/journeys/originals/3/file");
    assert.deepEqual([...f.document.querySelectorAll("a")].map((link) => [link.textContent, link.getAttribute("href")]), [
      ["Open PDF in a new tab", "/api/journeys/originals/3/file"],
      ["Download PDF", "/api/journeys/originals/3/file?download=1"],
    ]);
  }));

test("switching accounts closes a loaded private journal and source before any new authorization succeeds", () =>
  withFixture(React.createElement(JourneyOriginalsViewer, { originals: [original(1), original(2, "journal")] }), async (f) => {
    await f.click(f.button("Original 1"));
    const source = f.document.querySelector("audio[controls]");
    source.currentTime = 18;
    await f.action(() => source.play());
    await f.click(f.button("Original 2"));
    assert.match(f.document.body.textContent, /A memory worth keeping/);
    f.handlers.get = async () => { throw new Error("New user is not authorized"); };
    const nextToken = `another.${Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url")}.test`;
    await f.action(() => f.auth.login({ id: 2, username: "other" }, nextToken));
    assert.equal(f.document.body.textContent.includes("A memory worth keeping"), false);
    assert.equal(f.document.querySelector("audio[controls]"), null);
    assert.equal(source.paused, true);
    assert.equal(source.hasAttribute("src"), false);
    assert.equal(f.mediaState(source).loads, 1);
  }));

test("file validation rejects empty, oversized, mismatched, and active formats and matching retry files require all metadata", () => {
  const cases = [
    [{ name: "empty.mp3", type: "audio/mpeg", size: 0 }, "audio"],
    [{ name: "huge.mp3", type: "audio/mpeg", size: 200 * 1024 * 1024 + 1 }, "audio"],
    [{ name: "recording.mp3", type: "application/pdf", size: 100 }, "audio"],
    [{ name: "script.svg", type: "image/svg+xml", size: 100 }, "image"],
    [{ name: "page.html", type: "text/html", size: 100 }, "pdf"],
    [{ name: "paper.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 }, "pdf"],
    [{ name: "photo.png", type: "image/png", size: 5 * 1024 * 1024 + 1 }, "image"],
  ];
  for (const [file, kind] of cases) assert.equal(typeof validateOriginalFile(file, kind), "string");
  for (const [file, kind] of [
    [{ name: "RECORDING.MP3", type: "audio/mpeg", size: 200 * 1024 * 1024 }, "audio"],
    [{ name: "photo.webp", type: "image/webp", size: 5 * 1024 * 1024 }, "image"],
    [{ name: "paper.pdf", type: "application/pdf", size: 10 * 1024 * 1024 }, "pdf"],
  ]) assert.equal(validateOriginalFile(file, kind), null);
  const pending = original(1, "audio", { status: "pending" });
  const exact = { name: pending.file_name, type: pending.mime_type, size: pending.byte_size };
  assert.equal(matchesOriginalFile(pending, exact), true);
  for (const mismatch of [{ name: "other.mp3" }, { type: "audio/wav" }, { size: 2000 }]) {
    assert.equal(matchesOriginalFile(pending, { ...exact, ...mismatch }), false);
  }
});

const entry = (originals = []) => ({
  id: 10, season_id: 3, song_id: 1, display_order: 0,
  personal_note: "Keep my existing reflection.", significance: "Existing memory",
  added_date: null, source_url: "https://onedrive.example.test/original-source",
  created_at: "2026-10-13T00:00:00Z", originals,
});
const listResponse = (originals, enabled = true) => ({ data: {
  originals, storage: { enabled, ...(!enabled ? { message: "Private storage has not been verified." } : {}) },
} });
const mockUpload = { url: "https://storage.example.test/private-upload", headers: { "Content-Type": "audio/mpeg" }, expires_in: 600 };
const abortUpload = ({ config }) => new Promise((resolve, reject) => {
  config.signal.addEventListener("abort", () => reject(Object.assign(new Error("Upload paused"), { name: "CanceledError" })), { once: true });
});

test("journals remain available when file storage is disabled and saving is private without rewriting song metadata", () => {
  const savedEntry = entry();
  let changed = 0;
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: savedEntry, onChanged: () => { changed++; } }), async (f) => {
    assert.match(f.document.body.textContent, /Private storage has not been verified/);
    await f.click(f.button("Add original"));
    const types = [...f.document.querySelectorAll('input[type="radio"]')];
    assert.equal(types.find((input) => input.value === "journal").disabled, false);
    assert.ok(types.filter((input) => input.value !== "journal").every((input) => input.disabled));
    const label = f.document.querySelector('input[id$="-new-label"]');
    const journal = f.document.querySelector('textarea[id$="-new-journal"]');
    for (const input of [label, journal]) {
      assert.ok(f.document.querySelector(`label[for="${input.id}"]`));
      assert.equal(input.required, true);
    }
    await f.input(label, "A private memory");
    await f.input(journal, "Keep this journal private.\n<script>Plain text, not markup.</script>");
    await f.submit(f.document.querySelector("form"));
    const saves = f.requests.filter((request) => request.method === "post");
    assert.equal(saves.length, 1);
    assert.equal(saves[0].url, "/api/journeys/originals");
    assert.match(saves[0].body.requestId, /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i);
    const { requestId, ...savedBody } = saves[0].body;
    assert.deepEqual(savedBody, {
      entryId: 10, kind: "journal", label: "A private memory",
      journal_text: "Keep this journal private.\n<script>Plain text, not markup.</script>",
    });
    assert.equal(changed, 1);
    assert.match(f.document.querySelector('[role="status"]').textContent, /saved privately/);
    assert.match(f.document.querySelector("li").textContent, /Private · Only you/);
    assert.equal(savedEntry.personal_note, "Keep my existing reflection.");
    assert.equal(savedEntry.source_url, "https://onedrive.example.test/original-source");
    assert.equal(f.requests.some((request) => request.method === "put" || request.url.includes("seasons")), false);
  }, { handlers: {
    get: async () => listResponse([], false),
    post: async ({ body }) => ({ data: { original: original(5, "journal", { label: body.label, journal_text: body.journal_text }) } }),
  } });
});

test("pausing a file upload retains one private pending original and retry finalizes the same record without credentials sent to storage", () => {
  let pending;
  let puts = 0;
  let changed = 0;
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry(), onChanged: () => { changed++; } }), async (f) => {
    await f.click(f.button("Add original"));
    await f.click(f.document.querySelector('input[type="radio"][value="audio"]'));
    const uploadFile = new f.dom.window.File([Buffer.alloc(1024)], "recording.mp3", { type: "audio/mpeg" });
    const input = f.document.querySelector('input[type="file"]');
    assert.ok(input.getAttribute("accept").includes(".mp3"));
    assert.ok(f.document.getElementById(input.getAttribute("aria-describedby")), "File limits and retry instructions are associated with the input");
    await f.selectFile(input, uploadFile);
    await f.submit(f.document.querySelector("form"));
    assert.equal(f.document.querySelector("progress").getAttribute("aria-label"), "Original file upload progress");
    assert.equal(f.document.querySelector("progress").value, 50);
    const uploadRequest = f.requests.find((request) => request.method === "put");
    assert.deepEqual(uploadRequest.config.headers, { "Content-Type": "audio/mpeg" });
    assert.equal(uploadRequest.config.headers.Authorization, undefined);
    assert.equal(uploadRequest.config.withCredentials, undefined);
    assert.equal(pending.is_shared, false);
    await f.click(f.button("Pause upload"));
    assert.equal(uploadRequest.config.signal.aborted, true);
    assert.match(f.document.querySelector('[role="status"]').textContent, /Upload paused/);
    assert.match(f.document.querySelector("li").textContent, /Upload unfinished · Private/);
    assert.equal(f.requests.some((request) => request.url.endsWith("/finalize")), false);
    await f.submit(f.document.querySelector("form"));
    assert.equal(f.requests.filter((request) => request.method === "post" && request.url === "/api/journeys/originals").length, 1);
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/12/upload-url").length, 1);
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/12/finalize").length, 1);
    assert.equal(f.document.querySelectorAll("li").length, 1);
    assert.match(f.document.querySelector("li").textContent, /Private · Only you/);
    assert.match(f.document.querySelector('[role="status"]').textContent, /saved privately/);
    assert.equal(changed, 1);
  }, { handlers: {
    get: async () => listResponse(pending ? [pending] : []),
    post: async ({ url, body }) => {
      if (url === "/api/journeys/originals") {
        pending = original(12, "audio", { status: "pending", label: body.label, file_name: body.file_name, mime_type: body.mime_type, byte_size: body.byte_size });
        return { data: { original: pending, upload: mockUpload } };
      }
      if (url.endsWith("/upload-url")) return { data: { original: pending, upload: mockUpload } };
      assert.equal(url, "/api/journeys/originals/12/finalize");
      pending = { ...pending, status: "ready" };
      return { data: { original: pending } };
    },
    put: async (request) => {
      puts++;
      request.config.onUploadProgress({ loaded: 512, total: 1024 });
      if (puts === 1) return abortUpload(request);
      return { data: {} };
    },
  } });
});

test("navigation aborts an in-flight upload; reconnect requires matching file metadata and resumes its existing pending record", () => {
  let pending;
  let changed = 0;
  let puts = 0;
  const editor = () => React.createElement(JourneyOriginalsEditor, { entry: entry(), onChanged: () => { changed++; } });
  return withFixture(editor(), async (f) => {
    await f.click(f.button("Add original"));
    await f.click(f.document.querySelector('input[type="radio"][value="audio"]'));
    const sameFile = new f.dom.window.File([Buffer.alloc(1024)], "recording.mp3", { type: "audio/mpeg" });
    await f.selectFile(f.document.querySelector('input[type="file"]'), sameFile);
    await f.submit(f.document.querySelector("form"));
    const firstUpload = f.requests.find((request) => request.method === "put");
    await f.render(null);
    assert.equal(firstUpload.config.signal.aborted, true);
    assert.equal(changed, 0);
    await f.render(editor());
    assert.match(f.document.querySelector("li").textContent, /Upload unfinished · Private/);
    await f.click(f.button("Resume upload"));
    const retryInput = f.document.querySelector('input[type="file"]');
    assert.match(f.document.querySelector("form").textContent, /Choose the same file again/);
    assert.equal(f.document.querySelector('input[id$="-new-label"]').disabled, true);
    await f.selectFile(retryInput, new f.dom.window.File([Buffer.alloc(1024)], "different.mp3", { type: "audio/mpeg" }));
    assert.match(f.document.querySelector('[role="alert"]').textContent, /same file/);
    await f.submit(f.document.querySelector("form"));
    assert.equal(f.requests.filter((request) => request.url.endsWith("/upload-url")).length, 0);
    await f.selectFile(retryInput, sameFile);
    await f.submit(f.document.querySelector("form"));
    assert.equal(f.requests.filter((request) => request.method === "post" && request.url === "/api/journeys/originals").length, 1);
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/12/upload-url").length, 1);
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/12/finalize").length, 1);
    assert.equal(f.document.querySelectorAll("li").length, 1);
    assert.equal(changed, 1);
  }, { handlers: {
    get: async () => listResponse(pending ? [pending] : []),
    post: async ({ url, body }) => {
      if (url === "/api/journeys/originals") {
        pending = original(12, "audio", { status: "pending", label: body.label, file_name: body.file_name, mime_type: body.mime_type, byte_size: body.byte_size });
        return { data: { original: pending, upload: mockUpload } };
      }
      if (url.endsWith("/upload-url")) return { data: { original: pending, upload: mockUpload } };
      assert.equal(url, "/api/journeys/originals/12/finalize");
      pending = { ...pending, status: "ready" };
      return { data: { original: pending } };
    },
    put: async (request) => { puts++; return puts === 1 ? abortUpload(request) : { data: {} }; },
  } });
});

test("pending uploads can recover a completed transfer by checking status without allocating or uploading a second file", () => {
  const pending = original(12, "pdf", { status: "pending", file_name: "memory.pdf", mime_type: "application/pdf" });
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry([pending]), onChanged: () => {} }), async (f) => {
    await f.click(f.button("Check completed upload"));
    const mutations = f.requests.filter((request) => request.method !== "get");
    assert.deepEqual(mutations.map((request) => [request.method, request.url]), [["post", "/api/journeys/originals/12/finalize"]]);
    assert.match(f.document.querySelector("li").textContent, /Private · Only you/);
    assert.match(f.document.querySelector('[role="status"]').textContent, /Completed upload verified/);
  }, { handlers: {
    get: async () => listResponse([pending]),
    post: async () => ({ data: { original: { ...pending, status: "ready" } } }),
  } });
});

test("a storage-signing failure preserves its pending original and retries its upload URL without another reservation", () => {
  let pending;
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry(), onChanged: () => {} }), async (f) => {
    await f.click(f.button("Add original"));
    await f.click(f.document.querySelector('input[type="radio"][value="audio"]'));
    await f.selectFile(f.document.querySelector('input[type="file"]'), new f.dom.window.File([Buffer.alloc(1024)], "recording.mp3", { type: "audio/mpeg" }));
    await f.submit(f.document.querySelector("form"));
    assert.match(f.document.querySelector('[role="alert"]').textContent, /Storage signature unavailable/);
    assert.equal(f.document.querySelectorAll("li").length, 1);
    assert.match(f.document.querySelector("li").textContent, /Upload unfinished · Private/);
    assert.equal(f.requests.some((request) => request.method === "put"), false);
    await f.submit(f.document.querySelector("form"));
    assert.equal(f.requests.filter((request) => request.method === "post" && request.url === "/api/journeys/originals").length, 1);
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/12/upload-url").length, 1);
    assert.match(f.document.querySelector("li").textContent, /Private · Only you/);
  }, { handlers: {
    get: async () => listResponse(pending ? [pending] : []),
    post: async ({ url, body }) => {
      if (url === "/api/journeys/originals") {
        pending = original(12, "audio", { status: "pending", label: body.label, file_name: body.file_name, mime_type: body.mime_type, byte_size: body.byte_size });
        return { data: { original: pending, upload_error: "Storage signature unavailable. Try again." } };
      }
      if (url.endsWith("/upload-url")) return { data: { original: pending, upload: mockUpload } };
      pending = { ...pending, status: "ready" };
      return { data: { original: pending } };
    },
    put: async () => ({ data: {} }),
  } });
});

test("interrupted reservation reloads its server pending record and retries the same UUID and frozen metadata without a duplicate", () => {
  let pending;
  const reservation = deferred();
  let creates = 0;
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry(), onChanged: () => {} }), async (f) => {
    await f.click(f.button("Add original"));
    await f.click(f.document.querySelector('input[type="radio"][value="audio"]'));
    const file = new f.dom.window.File([Buffer.alloc(1024)], "recording.mp3", { type: "audio/mpeg" });
    await f.selectFile(f.document.querySelector('input[type="file"]'), file);
    await f.submit(f.document.querySelector("form"));
    assert.equal(creates, 1);
    assert.equal(f.requests.some((request) => request.method === "put"), false);
    await f.click(f.button("Pause upload"));
    assert.equal(reservation.signal.aborted, true);
    assert.ok(f.document.querySelector("form"), "The interrupted intent remains recoverable");
    assert.equal(f.document.querySelector('input[id$="-new-label"]').disabled, true);
    assert.equal(f.document.querySelector('input[type="file"]').disabled, true);
    assert.equal(f.document.querySelectorAll("li").length, 1);
    assert.match(f.document.querySelector("li").textContent, /Upload unfinished · Private/);
    await f.submit(f.document.querySelector("form"));
    assert.equal(creates, 1);
    const attempts = f.requests.filter((request) => request.method === "post" && request.url === "/api/journeys/originals");
    assert.equal(attempts.length, 2);
    assert.deepEqual(attempts[0].body, attempts[1].body);
    assert.match(attempts[0].body.requestId, /^[a-f\d-]{36}$/i);
    assert.equal(f.requests.filter((request) => request.url === "/api/journeys/originals/12/finalize").length, 1);
    assert.equal(f.document.querySelectorAll("li").length, 1);
    assert.match(f.document.querySelector("li").textContent, /Private · Only you/);
  }, { handlers: {
    get: async () => listResponse(pending ? [pending] : []),
    post: async ({ url, body, config }) => {
      if (url === "/api/journeys/originals") {
        if (pending) return { data: { original: pending, upload: mockUpload } };
        creates++;
        pending = original(12, "audio", { status: "pending", label: body.label, file_name: body.file_name, mime_type: body.mime_type, byte_size: body.byte_size });
        reservation.signal = config.signal;
        config.signal.addEventListener("abort", () => reservation.reject(Object.assign(new Error("Reservation response interrupted"), { name: "CanceledError" })), { once: true });
        return reservation.promise;
      }
      if (url.endsWith("/upload-url")) return { data: { original: pending, upload: mockUpload } };
      assert.equal(url, "/api/journeys/originals/12/finalize");
      pending = { ...pending, status: "ready" };
      return { data: { original: pending } };
    },
    put: async () => ({ data: {} }),
  } });
});

test("account changes abort the active upload and discard the former owner's originals before a late transfer can finalize", () => {
  let pending;
  let denyRead = false;
  let changed = 0;
  const transfer = deferred();
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry(), onChanged: () => { changed++; } }), async (f) => {
    await f.click(f.button("Add original"));
    await f.click(f.document.querySelector('input[type="radio"][value="audio"]'));
    await f.selectFile(f.document.querySelector('input[type="file"]'), new f.dom.window.File([Buffer.alloc(1024)], "private-recording.mp3", { type: "audio/mpeg" }));
    await f.submit(f.document.querySelector("form"));
    const put = f.requests.find((request) => request.method === "put");
    denyRead = true;
    const nextToken = `another.${Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url")}.test`;
    await f.action(() => f.auth.login({ id: 2, username: "other", email: "other@example.test" }, nextToken));
    assert.equal(put.config.signal.aborted, true, "A retained editor must abort former-owner work when auth changes");
    assert.equal(f.document.querySelectorAll("li").length, 0);
    assert.equal(f.document.querySelector("form"), null);
    assert.equal(f.document.body.textContent.includes("private-recording"), false);
    transfer.resolve({ data: {} });
    await f.action(async () => {});
    assert.equal(f.requests.some((request) => request.url.endsWith("/finalize")), false);
    assert.equal(changed, 0);
  }, { handlers: {
    get: async () => {
      if (denyRead) throw Object.assign(new Error("Not authorized"), { isAxiosError: true, response: { status: 403, data: { error: "Not authorized" } } });
      return listResponse(pending ? [pending] : []);
    },
    post: async ({ body }) => {
      pending = original(12, "audio", { status: "pending", label: body.label, file_name: body.file_name, mime_type: body.mime_type, byte_size: body.byte_size });
      return { data: { original: pending, upload: mockUpload } };
    },
    put: async () => transfer.promise,
  } });
});

test("sharing requires its explicit confirmation and making private again sends an immediate visibility change", () => {
  let item = original(1, "journal");
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry([item]), onChanged: () => {} }), async (f) => {
    await f.click(f.button("Share"));
    assert.match(f.document.querySelector("li").textContent, /It may become public when both are public/);
    assert.equal(f.requests.some((request) => request.method === "patch"), false);
    await f.click(f.button("Keep private"));
    assert.equal(f.requests.some((request) => request.method === "patch"), false);
    await f.click(f.button("Share"));
    await f.click(f.button("Share original"));
    assert.match(f.document.querySelector("li").textContent, /Shared within journey visibility/);
    await f.click(f.button("Make private"));
    assert.match(f.document.querySelector("li").textContent, /Private · Only you/);
    assert.deepEqual(f.requests.filter((request) => request.method === "patch").map((request) => request.body), [{ is_shared: true }, { is_shared: false }]);
  }, { handlers: {
    get: async () => listResponse([item]),
    patch: async ({ body }) => { item = { ...item, ...body }; return { data: { original: item } }; },
  } });
});

test("reordering uses labeled native buttons with keyboard focus and disables boundaries while submitting the entire order", () => {
  let items = [original(1), original(2), original(3)];
  return withFixture(React.createElement(JourneyOriginalsEditor, { entry: entry(items), onChanged: () => {} }), async (f) => {
    const list = f.document.querySelector('ol[aria-label="Originals in display order"]');
    assert.ok(list);
    assert.equal(f.button("Move Original 1 up").disabled, true);
    assert.equal(f.button("Move Original 3 down").disabled, true);
    const move = f.button("Move Original 2 up");
    assert.equal(move.tagName, "BUTTON");
    assert.equal(move.tabIndex, 0);
    move.focus();
    assert.equal(f.document.activeElement, move);
    assert.match(move.className, /focus-visible:ring-2/);
    await f.click(move);
    assert.deepEqual([...list.querySelectorAll("h3")].map((heading) => heading.textContent), ["Original 2", "Original 1", "Original 3"]);
    assert.deepEqual(f.requests.find((request) => request.url.endsWith("/reorder")).body, { entryId: 10, originalIds: [2, 1, 3] });
    assert.equal(f.button("Move Original 2 up").disabled, true);
    await f.click(f.button("Move Original 2 down"));
    assert.deepEqual([...list.querySelectorAll("h3")].map((heading) => heading.textContent), ["Original 1", "Original 2", "Original 3"]);
    assert.match(f.document.querySelector('[role="status"]').textContent, /Original 2 moved down/);
  }, { handlers: {
    get: async () => listResponse(items),
    post: async ({ body }) => {
      items = body.originalIds.map((id, index) => ({ ...items.find((item) => item.id === id), display_order: index }));
      return { data: { originals: items } };
    },
  } });
});

const journey = (username = "creator") => ({
  id: 1, user_id: 1, username, title: "Children", subtitle: null, bio: null,
  cover_image_url: null, profile_image_url: null, notebook_lm_url: null,
  is_public: true, show_song_dates: true, show_play_counts: false,
  layout_style: "timeline", likes_count: 0, seasons: [],
  created_at: "2026-10-13T00:00:00Z", updated_at: "2026-10-13T00:00:00Z",
});

test("Copy for AI requires an explicit export and excludes originals by default, including after a prior opt-in", () =>
  withFixture(React.createElement(JourneyHero, { journey: journey() }), async (f) => {
    const copied = [];
    Object.defineProperty(f.dom.window.navigator, "clipboard", { value: { writeText: async (data) => { copied.push(data); } } });
    await f.click(f.button("Copy for AI"));
    assert.equal(f.requests.length, 0, "Opening export options cannot export private data");
    let checkbox = f.document.querySelector('[role="checkbox"]');
    assert.ok(checkbox);
    assert.equal(checkbox.getAttribute("aria-checked"), "false");
    assert.match(f.document.querySelector(`label[for="${checkbox.id}"]`).textContent, /Include originals I can access/);
    assert.match(f.document.getElementById(checkbox.getAttribute("aria-describedby")).textContent, /private journals/);
    await f.click(f.button("Copy journey"));
    assert.deepEqual(f.requests[0].config.params, { username: "creator" });
    assert.equal(copied.length, 1);
    await f.click(f.button("Copied for AI"));
    checkbox = f.document.querySelector('[role="checkbox"]');
    assert.equal(checkbox.getAttribute("aria-checked"), "false");
    await f.click(checkbox);
    assert.equal(checkbox.getAttribute("aria-checked"), "true");
    await f.click(f.button("Copy journey"));
    assert.deepEqual(f.requests[1].config.params, { username: "creator", includeOriginals: "true" });
    assert.equal(copied.length, 2);
    await f.click(f.button("Copied for AI"));
    checkbox = f.document.querySelector('[role="checkbox"]');
    assert.equal(checkbox.getAttribute("aria-checked"), "false", "Each new export requires opt-in again");
    await f.click(f.button("Cancel"));
    assert.equal(f.requests.length, 2);
    assert.equal(copied.length, 2);
  }, { handlers: { get: async ({ url }) => {
    assert.equal(url, "/api/journeys/export-for-llm");
    return { data: { journey: "Children", seasons: [] } };
  } } }));

test("navigation aborts a pending export and cannot copy private data returned by an old request", () =>
  withFixture(React.createElement(JourneyHero, { journey: journey() }), async (f) => {
    const pending = deferred();
    const copied = [];
    Object.defineProperty(f.dom.window.navigator, "clipboard", { value: { writeText: async (data) => { copied.push(data); } } });
    f.handlers.get = ({ config }) => { pending.signal = config.signal; return pending.promise; };
    await f.click(f.button("Copy for AI"));
    await f.click(f.document.querySelector('[role="checkbox"]'));
    await f.click(f.button("Copy journey"));
    assert.equal(pending.signal.aborted, false);
    await f.render(React.createElement(JourneyHero, { journey: journey("another-creator") }));
    assert.equal(pending.signal.aborted, true);
    pending.resolve({ data: { privateJournal: "Old private content" } });
    await f.action(async () => {});
    assert.deepEqual(copied, []);
    assert.equal(f.document.querySelector('[role="dialog"]'), null);
    assert.equal(f.messages.some((message) => message.method === "success"), false);
    await f.click(f.button("Copy for AI"));
    assert.equal(f.document.querySelector('[role="checkbox"]').getAttribute("aria-checked"), "false");
  }));

test("switching accounts cancels a pending opted-in export and resets the next user's export choice", () =>
  withFixture(React.createElement(JourneyHero, { journey: journey() }), async (f) => {
    const pending = deferred();
    const copied = [];
    Object.defineProperty(f.dom.window.navigator, "clipboard", { value: { writeText: async (data) => { copied.push(data); } } });
    f.handlers.get = ({ config }) => { pending.signal = config.signal; return pending.promise; };
    await f.click(f.button("Copy for AI"));
    await f.click(f.document.querySelector('[role="checkbox"]'));
    await f.click(f.button("Copy journey"));
    const nextToken = `another.${Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url")}.test`;
    await f.action(() => f.auth.login({ id: 2, username: "other" }, nextToken));
    assert.equal(pending.signal.aborted, true);
    pending.resolve({ data: { privateJournal: "Previous user's journal" } });
    await f.action(async () => {});
    assert.deepEqual(copied, []);
    assert.equal(f.document.querySelector('[role="dialog"]'), null);
    await f.click(f.button("Copy for AI"));
    assert.equal(f.document.querySelector('[role="checkbox"]').getAttribute("aria-checked"), "false");
  }));

test("a cookie-only preview session sends no bearer request", async () => {
  const existing = axios.get;
  let calls = 0;
  axios.get = async () => { calls++; throw new Error("Unexpected request"); };
  try {
    await prepareOriginalSession(null, new AbortController().signal);
    assert.equal(calls, 0);
  } finally { axios.get = existing; }
});

function hslRgb(value) {
  const [h, s, l] = value.trim().split(/\s+/).map((item, index) => parseFloat(item) / (index ? 100 : 360));
  const channel = (offset) => {
    const k = (offset + h * 12) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [channel(0), channel(8), channel(4)];
}
function luminance(rgb) {
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(first, second) {
  const a = luminance(hslRgb(first));
  const b = luminance(hslRgb(second));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("originals use flexible mobile-first panel and theme tokens whose text colors meet normal-text contrast", () =>
  withFixture(React.createElement(JourneySplitPanel, {
    music: React.createElement("span", null, "Finished song"),
    context: React.createElement(JourneyOriginalsViewer, { originals: [original(1)] }),
  }), async (f) => {
    const grid = f.document.getElementById("root").querySelector(".grid");
    assert.match(grid.className, /xl:grid-cols-\[minmax\(0,1\.1fr\)_minmax\(0,1fr\)\]/);
    assert.ok(!/(^|\s)grid-cols-/.test(grid.className), "Small screens retain one column");
    assert.ok([...grid.children].every((panel) => panel.classList.contains("min-w-0")));
    assert.equal(grid.children[0].textContent, "Finished song");
    assert.ok(grid.children[1].querySelector('section[aria-label="Journey originals"]'));
    assert.match(grid.children[1].className, /border-t/);
    const viewer = grid.querySelector('section[aria-label="Journey originals"]');
    assert.match(viewer.querySelector("h4").className, /font-serif/);
    assert.ok(viewer.querySelector(".break-words"));
    const css = fs.readFileSync(path.join(__dirname, "../styles/globals.css"), "utf8");
    for (const selector of [":root", ".dark"]) {
      const block = css.match(new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]+)\\}`))[1];
      const tokens = Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2]]));
      for (const background of ["background", "card", "muted"]) {
        for (const color of ["foreground", "muted-foreground", "primary"]) {
          const ratio = contrast(tokens[color], tokens[background]);
          assert.ok(ratio >= 4.5, `${selector} ${color} on ${background} contrast ${ratio.toFixed(2)} is below 4.5`);
        }
      }
      assert.ok(contrast(tokens["primary-foreground"], tokens.primary) >= 4.5);
      assert.ok(contrast(tokens.destructive, tokens.background) >= 4.5);
      assert.ok(contrast(tokens.destructive, tokens.card) >= 4.5);
    }
  }));
