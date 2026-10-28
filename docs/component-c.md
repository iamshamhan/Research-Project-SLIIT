# Component C alignment and handoff

## Inspection

Actual connected path: `D:\MyProjects\RP`. Initial inventory: zero files, including hidden files. Git status: not a repository; no remote available. No uploaded README file was present. The recoverable chat contained the research plan, but its later stack/agent notes were truncated and earlier assistant responses were reference placeholders. This scaffold does not claim to reproduce those missing instructions.

## Provisional three-day prototype

1. Local Next.js + FastAPI connection, camera permission and stop/restart handling.
2. Holistic extraction, overlay, missing-landmark handling, measured FPS at 640×480.
3. Export timing samples, manually verify on target hardware, agree model/data contract with teammates.

This is a working interpretation of the current request, pending the actual three-day checklist.

## Integration contract v0 — requires team agreement

`GET /health` exposes model state. `WS /ws/landmarks` accepts binary JPEG at exactly 640×480, one request followed by one JSON response. Browser origin must be localhost or 127.0.0.1 port 3000. Server binds to loopback.

Response fields: `schema_version=1`, `feature_spec=holistic-543-xyz-v0`, `landmarks`, `detected`, `processing_ms`, `mode=landmarks_only`, `prediction=null`.

Landmark ordering: pose 33, left hand 21, right hand 21, face 468. Each point is raw MediaPipe `[x,y,z]`, giving 543 points / 1629 values if flattened in this order. Missing groups are zero-filled and distinguished by `detected`. Pose visibility is not included. Coordinates are extracted from unmirrored frames; only the display is mirrored. No custom body normalization, resampling or model window is implied. This provisional format must not silently become the training feature specification.

Suhail (B) should supply: exact landmark indices and ordering, visibility requirements, normalization code/version, missing-data policy, frame rate, window length/stride, model format and runtime, input/output shapes and dtypes, vocabulary/blank index, CTC decoder and test input with expected output. Use the same preprocessing in training and inference. A BiLSTM needs a bounded window and adds window latency; agree this explicitly before integrating.

Reshma (A) should supply: versioned healthcare gloss IDs and Sinhala mapping, sentence boundaries, dataset metadata, signer-independent split definitions, synthetic/real labels and frozen evaluation references. Keep datasets and models outside this Component C scaffold until locations are agreed.

## Remaining research work

A `SignBridge_Codex_Handoff.txt` appeared during implementation and was read without modification. It independently records that the original three-day requirements and complete uploaded files remain unavailable; its proposed three-day plan is guidance, not recovered agreement. It also observes this in-progress scaffold and is not evidence of pre-existing teammate source.

Temporal buffering and a typed model adapter boundary are now implemented in `backend/pipeline.py`. The provisional settings are 30 processed frames per window, stride 15, ordered float32 `[time,1629]` raw xyz features. A new WebSocket connection resets the sequence. Missing groups remain zero-filled. The buffer stores processed frames at variable arrival times, not a resampled fixed-rate sequence; matching training cadence remains required. Responses add `temporal` buffer/window counters. Production uses no model; a test-only fixture verifies the interface and produces no demo predictions.

A concrete trained model adapter, preprocessing agreement, CTC duplicate/blank handling, Sinhala prediction output, WER/sentence accuracy, and controlled lighting/background/signer evaluation remain pending. FPS CSV is timing evidence only; it cannot substantiate recognition accuracy or robustness. Record hardware, versions, warmup, duration and condition with each benchmark. Compare baseline and conditions using the same fixed evaluation protocol.

## Desktop refinement and review — 28 October 2026

The interface now fills the desktop window, with a large camera stage, Sinhala display immediately beneath it, and compact session panels. Full frame preserves the complete processed signing frame; Fill crops the display only, with an explicit notice. Overlay visibility and fullscreen controls are available. Small screens scroll normally. Desktop panel geometry was checked in Chrome: document height matched viewport height, with no horizontal overflow; narrow-screen layout was also inspected.

Camera lifecycle and WebSocket handling now live in `frontend/app/use-signbridge.ts`. Session generation checks prevent callbacks from previous sessions modifying the current one. Camera disconnects, permission errors, connection timeouts, empty captures and bad service responses have explicit handling. React dashboard updates are limited to five per second while the overlay follows responses. Timing history retains at most 18,000 rows, dropping the oldest 1,000 when the limit is exceeded; FPS counters remain session-wide. No video is saved.

CSV columns now include `session_started_utc,condition,elapsed_ms,processing_ms,roundtrip_ms`. Conditions are selected before capture and fixed for the session. The condition describes an operator-selected test label, not an automatically verified environment or a recognition robustness result.

The backend decodes/extracts on a dedicated worker per connection so CPU work does not block the asynchronous service loop. All tracker operations for a session run on the same worker. `processing_ms` now includes image decode, colour conversion, landmark extraction and temporal buffering, but excludes WebSocket transfer. Compare benchmarks only when timing definitions match.

Observed browser session: approximately 19–20 FPS for over two minutes; this is an informal tracking smoke check on this machine, not a controlled benchmark. Start/stop, landmark overlay toggle, Fill/Full frame and sequence details were exercised. Export was clicked without a browser error, but the downloaded file was not captured by automation, so end-to-end CSV download verification remains manual. The running backend must be restarted to load backend source changes.

Production build, TypeScript validation, three backend tests and dependency checks passed. Recognition remains unavailable until a trained adapter, exact shared preprocessing, decoder and Sinhala vocabulary are provided and integrated. No WER or hospital-readiness claim is made.

## Manual acceptance

### Camera / translation split — latest UI

The latest layout supersedes the earlier under-camera output and Fill mode: the camera occupies the full left column in full-frame mode only; Sinhala and optional English occupy the right. Source webcam frames are fitted into 640×480 with padding when needed, rather than centre-cropped. This geometry must also be agreed with Component B's preprocessing before model integration.

Sinhala text is an explicitly editable manual preview until a genuine sign recognizer is wired in. Enabling English sends only that Sinhala string to the local `POST /translate/sinhala-to-english` endpoint. The endpoint currently supports four exact glossary entries (ආයුබෝවන් → Hello, ස්තූතියි → Thank you, ඔව් → Yes, නැහැ → No), normalizes Unicode/whitespace, and returns `unsupported` with null text for all other inputs. This is a constrained integration preview, not general translation or clinical validation. No direct sign-to-English path exists. General translation requires a separate translation model; recognized Sinhala must feed this second stage after sign-model integration.

The endpoint accepts up to 2,000 characters and allows browser requests only from the local frontend origins. The UI cancels superseded requests, debounces typing and handles timeouts and service errors. Existing backends need a restart to load the new endpoint.

- Start both services, allow camera; confirm overlay follows body and hands.
- Deny camera permission and retry; confirm understandable error.
- Stop, restart, navigate away; camera indicator must turn off after stopping.
- Stop backend during capture; UI must release camera and allow retry.
- Run at least 60 seconds at 640×480 after warmup; export real samples.
- Verify Sinhala font on the target Windows machine.
- Disconnect internet after dependencies install; repeat live capture.

Webcam checks require the user's browser and physical camera. They are not replaced by build success.
