// MV3 offscreen audio recorder. The stream exists only after an explicit Start
// gesture and is never written to disk.

let stream = null;
let recorder = null;
let chunkSequence = 0;

function audioMimeType() {
  for (const type of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

async function startRecording(streamId) {
  await stopRecording();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });
  const mimeType = audioMimeType();
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  chunkSequence = 0;
  recorder.ondataavailable = async (event) => {
    if (!event.data || event.data.size === 0) return;
    const buffer = await event.data.arrayBuffer();
    await chrome.runtime.sendMessage({
      type: "capture:audio-chunk",
      sequence: chunkSequence++,
      buffer,
      mimeType: event.data.type || mimeType || "audio/webm",
    }).catch(() => {});
  };
  recorder.onerror = () => chrome.runtime.sendMessage({ type: "capture:audio-error", error: "audio-recorder-error" }).catch(() => {});
  recorder.start(5000);
}

async function stopRecording() {
  if (recorder && recorder.state !== "inactive") {
    await new Promise((resolve) => {
      recorder.addEventListener("stop", resolve, { once: true });
      recorder.stop();
    });
  }
  recorder = null;
  for (const track of stream?.getTracks?.() || []) track.stop();
  stream = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message?.type === "audio:start") {
      await startRecording(message.streamId);
      sendResponse({ ok: true, status: "audio_capturing" });
      return;
    }
    if (message?.type === "audio:stop") {
      await stopRecording();
      sendResponse({ ok: true, status: "audio_stopped" });
      return;
    }
    sendResponse({ ok: false, error: "unknown" });
  })().catch((error) => sendResponse({ ok: false, error: String(error?.message || "audio-start-failed") }));
  return true;
});
