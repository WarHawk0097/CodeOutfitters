#!/usr/bin/env python3
"""Local faster-whisper JSONL worker.

Audio bytes are received over stdin, written only to a temporary file for the
decoder, transcribed locally, and deleted before the response is emitted.
"""

import base64
import json
import os
import sys
import tempfile


def main() -> None:
    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        error = f"faster-whisper-unavailable:{exc.__class__.__name__}"
        for line in sys.stdin:
            try:
                request = json.loads(line)
                print(json.dumps({"id": request.get("id"), "error": error}), flush=True)
            except Exception:
                continue
        return

    model = WhisperModel(
        os.environ.get("CODEOUTFITTERS_WHISPER_MODEL", "base"),
        device=os.environ.get("CODEOUTFITTERS_WHISPER_DEVICE", "cpu"),
        compute_type=os.environ.get("CODEOUTFITTERS_WHISPER_COMPUTE", "int8"),
    )
    for line in sys.stdin:
        temp_path = None
        try:
            request = json.loads(line)
            suffix = ".ogg" if "ogg" in str(request.get("mimeType", "")) else ".webm"
            with tempfile.NamedTemporaryFile(prefix="codeoutfitters-audio-", suffix=suffix, delete=False) as temp:
                temp.write(base64.b64decode(request["audio"]))
                temp_path = temp.name
            segments, _info = model.transcribe(temp_path, vad_filter=True)
            text = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
            print(json.dumps({"id": request.get("id"), "text": text}), flush=True)
        except Exception as exc:
            print(json.dumps({"id": request.get("id") if isinstance(request, dict) else None, "error": f"transcription-failed:{exc.__class__.__name__}"}), flush=True)
        finally:
            if temp_path:
                try:
                    os.unlink(temp_path)
                except FileNotFoundError:
                    pass


if __name__ == "__main__":
    main()
