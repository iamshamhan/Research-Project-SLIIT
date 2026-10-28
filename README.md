# SignBridge — local prototype

Project KND_CDAP_DS_06 · SLIIT · Component C: M.H.M. Shamhan.

The connected folder is `D:\MyProjects\RP`. It was empty and was not a Git repository on initial inspection on 28 October 2026. This prototype is not a replacement for the group's complete research README. The supplied handoff file is preserved.

## Run the app

Dependencies are installed in this workspace. In a VS Code PowerShell terminal at the project root:

```powershell
.\Start-SignBridge.ps1
```

Keep the terminal open and visit http://127.0.0.1:3000. Press Ctrl+C to stop both services. Restart the launcher after backend changes, including the new English endpoint.

## Fresh installation

Requirements: Node.js 20.9+ and Python 3.10–3.12. The pinned legacy MediaPipe Holistic 0.10.21 package is not suitable for Python 3.14.

From `backend`:

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

From `frontend` in another terminal:

```powershell
npm ci
npm run dev
```

Internet is needed for dependencies and MediaPipe's first tracker initialization, which may download a lite pose model. This asset was cached during the smoke test in this workspace. Prepare it while online before testing disconnected operation in a fresh environment. Runtime application requests use loopback endpoints; no video recording or cloud upload path is implemented.

## Camera and text layout

The full signing frame occupies the left column. Sinhala text and optional English occupy the right. There is no Fill/crop switch. Source images are fitted into a 640×480 processing frame with padding when needed. Only the display is mirrored. The landmark checkbox hides/shows the overlay. The top-right button requests fullscreen where supported.

The translation order is **signs → Sinhala → optional English**. Real sign recognition is pending. The editable Sinhala text is explicitly a manual preview, not a prediction.

Turn on English to test the separate local `POST /translate/sinhala-to-english` endpoint. Its constrained offline glossary currently supports:

- ආයුබෝවන් → Hello
- ස්තූතියි → Thank you
- ඔව් → Yes
- නැහැ → No

Other text returns an explicit unsupported result. A general Sinhala-to-English translation model is not installed. No direct sign-to-English model is implied.

## Prototype capabilities

- Browser webcam capture and one-frame-at-a-time local JPEG transfer.
- FastAPI, OpenCV decode and MediaPipe Holistic extraction of 543 xyz landmarks.
- Missing-group flags and landmark overlay.
- Bounded temporal windows: provisional 30-frame window, 15-frame stride.
- Typed future-model boundary, with no production recognition model or fabricated predictions.
- Session-wide FPS, processing time, round-trip latency and CSV reports.
- Baseline/lighting/background/signer condition labels fixed at session start.
- Timing history retains at most 18,000 recent samples; no video is saved.
- A worker per backend session keeps extraction off the asynchronous service loop.

`processing_ms` covers decode, colour conversion, extraction and temporal preparation, excluding transport. CSV columns are `session_started_utc,condition,elapsed_ms,processing_ms,roundtrip_ms`. Timing reports cannot substantiate recognition accuracy or robustness.

## Verification

Production build, TypeScript checks, formatting, four backend tests and dependency consistency checks pass. Browser tracking was observed at approximately 19–20 FPS over two minutes, with overlay and stop controls exercised. This is an informal smoke check, not a controlled benchmark. Desktop sizing and narrow-screen fallback were inspected. End-to-end CSV file download remains a manual acceptance check.

From `backend`, install `requirements-dev.txt` and run:

```powershell
.\.venv\Scripts\python.exe -m unittest test_pipeline -v
```

From `frontend`:

```powershell
npm run build
npm run format:check
```

The test client emits a dependency deprecation warning; tests pass. Python versions are recorded in `backend/requirements-lock.txt`, and frontend dependencies in `frontend/package-lock.json`.

## Remaining integration

Agree landmark order, normalization, timing, window size, padding and missing-data policy with Suhail. Connect the genuine trained BiLSTM model, CTC decoder, vocabulary and Reshma's Sinhala mapping. Connect recognized Sinhala to the separate English stage, then install/evaluate a general translation model if required. WER, sentence accuracy and controlled robustness experiments remain pending.

See `docs/pp1.md` for the presentation checklist and `docs/component-c.md` for the integration contract, evolving implementation record and limitations.
