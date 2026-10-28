# First progress presentation — Component C

Working scope agreed in chat: prepare a working demo with at least 50% completion expected by the presentation. This percentage is a presentation requirement, not a measured completion claim. Presentation date and detailed marking criteria are pending.

## What to demonstrate

1. Start the local Next.js frontend and FastAPI backend.
2. Start the webcam and explain the 640×480 capture.
3. Show pose, hand and face landmarks following the signer.
4. Explain measured processing time, round-trip latency and completed-frame FPS.
5. Export actual FPS samples as evidence.
6. Show Sinhala Unicode rendering, explicitly labelled a font preview.
7. Stop the camera and explain the future model integration boundary.

## What exists

Local camera transport, Holistic extraction, overlay, missing-landmark flags, bounded temporal buffering, typed model integration boundary, timing display, CSV export and a local launcher. Automated tests exercise blank-frame extraction, the response contract, sequence ordering, overlapping windows and fresh pipeline state. Build success is recorded separately from webcam results.

## What remains before a credible presentation

- Verify the camera and overlay on the presentation laptop.
- Record hardware/OS, dependency versions, lighting and background.
- Warm up, measure a 60-second session and save the CSV. Report the measured FPS even if below the 15 FPS target.
- Check Sinhala glyphs and camera stop/restart.
- Prepare a short backup screen recording using the same working prototype.
- Agree feature preprocessing, temporal windows and model packaging with Suhail; agree gloss/Sinhala mapping and evaluation references with Reshma.
- Reconcile this scope with the supervisor's PP1 rubric when available. The project plan expects a working pipeline and real numbers; this landmark-only demo is an initial milestone and does not yet demonstrate end-to-end recognition.

## Later work

Concrete trained-model adapter, CTC decoding, gloss-to-Sinhala predictions and accuracy/robustness experiments remain subsequent milestones. A model and labelled data are required to report WER or recognition accuracy.

## Evidence record

Date:
Laptop / CPU / RAM:
Camera:
OS:
Lighting / background:
Warmup duration:
Measurement duration:
Completed frames / elapsed seconds:
Measured FPS:
Timing CSV location:
Demo recording location:
Known limitations:

## Added Component C evidence tools

Timed benchmarking now provides five-second warm-up exclusion, configurable measurement duration, automatic stop, FPS, latency mean/P50/P95/max, raw measured timing samples and detection availability in a JSON report. Capture guidance uses landmark presence and allows one-handed signing. See `benchmark-protocol.md`.

Browser smoke test on 28 October 2026: 553 measured frames over 30.0 seconds, displayed 18.4 FPS, mean round trip approximately 45 ms and P95 approximately 58 ms. Automatic completion and camera stop were observed. Hardware notes were not supplied and activity/lighting were not controlled; this is a functional smoke check, not a final experimental result or recognition benchmark. A repeatable controlled run on the presentation laptop remains required.
