# Component C tracking benchmark

## Run a test

1. Start both services and open the app. Expand **Timed benchmark** on the right.
2. Select Baseline, Low light, Busy background or Signer variation. Choose 30, 60 or 120 measured seconds.
3. Enter device/CPU/RAM notes without patient names or signer identifiers. Browser version and logical processor count are also included automatically; those do not identify the CPU model.
4. Keep this browser tab visible and avoid other heavy tasks. Use the same camera, distance, signing activity and display settings for comparisons.
5. Select **Run timed benchmark**. Allow camera access. The clock starts when the local connection opens; tracker startup is included in the five-second warm-up.
6. Sign or perform the agreed repeatable movements throughout the measurement. The camera stops automatically after warm-up plus the selected duration.
7. Download the JSON report before starting another session. Starting a new session clears the prior in-memory report. No reports or video are automatically saved.

## Report definition

- Only responses completed strictly after warm-up and at or before the measurement deadline are counted. A slow response arriving after the deadline is excluded.
- FPS = measured completed frames / measured wall-clock seconds. It is tracking throughput, not display refresh rate or recognition inference FPS.
- Processing and round-trip latency include mean, nearest-rank P50/P95, and maximum. Processing follows the backend timing definition in `component-c.md`; round trip starts at JPEG send and ends at response receipt, excluding browser JPEG encoding.
- Raw measured timing samples and group-detection flags are included. Warm-up samples are excluded. No images or landmark coordinates are saved in the benchmark report.
- Landmark availability rates are fractions between 0 and 1 and do not establish accuracy. A signer may legitimately use one hand or move a hand out of view.
- Early stop/error produces an incomplete report; zero-frame runs cannot be valid. A completed timing run does not establish signer visibility, recognition, linguistic correctness or clinical readiness.
- Timers may be delayed when a tab is backgrounded or the computer sleeps. Do not compare such runs with active foreground runs; rerun them with the tab visible.

## Initial evidence plan

Collect at least three completed baseline runs on the presentation laptop. Record hardware, OS, camera, lighting, background, measurement duration and repeatable signing activity. Retain all reports, including poor results; do not select only the best run. Report variation across repeats.

Repeat the same protocol with one condition changed at a time. These first experiments compare tracking availability and speed only. Once the real model is integrated, use a fixed labelled set and the same preprocessing to add WER/sentence accuracy; keep synthetic and real continuous data separate. Do not infer recognition robustness from these timing reports.

## Capture guidance

Hints use MediaPipe's group-presence flags, with a 600 ms persistence delay to reduce flicker. Priority is upper body, then at least one hand, then face. They do not infer lighting, diagnose camera quality, verify full body framing, or recognize signs. One-handed signing is allowed. This is a positioning aid, not a scored evaluation.

## PP1 demo sequence

Show the camera, demonstrate a positioning hint, run a 30-second test after warm-up, show the report, and explain the boundary for Suhail's trained model. Use the separate Sinhala/English panels only with their current manual-preview labels. Record a backup demo on the actual laptop before presentation day.
