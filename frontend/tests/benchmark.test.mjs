import test from 'node:test';
import assert from 'node:assert/strict';
import { BenchmarkRecorder, captureGuidance } from '../app/benchmark.ts';
const detection = { pose:true, left_hand:true, right_hand:false, face:true };
test('warmup excluded, measurement boundaries enforced, duration is wall clock', () => {
  const run = new BenchmarkRecorder(1000,30);
  const sample = {elapsed_ms:0,processing_ms:10,roundtrip_ms:15};
  run.record(3000,sample,detection);
  run.record(6000,sample,detection);
  run.record(6500,sample,detection);
  run.record(36000,{...sample, processing_ms:30, roundtrip_ms:40},detection);
  run.record(36001,sample,detection);
  const report = run.finish(38000,'completed');
  assert.equal(report.completed_frames,2);
  assert.equal(report.measured_seconds,30);
  assert.equal(report.fps,2/30);
  assert.equal(report.processing_ms.mean,20);
  assert.equal(report.processing_ms.p95,30);
  assert.equal(report.detection_rates.right_hand,0);
  assert.equal(report.valid_timing_run,true);
});
test('interrupted and empty runs cannot be reported as successful benchmarks', () => {
  const run = new BenchmarkRecorder(0,30);
  assert.equal(run.finish(2000,'stopped').fps,null);
  assert.equal(run.finish(2000,'stopped').processing_ms,null);
  assert.equal(run.finish(10000,'error').complete,false);
  assert.equal(run.finish(35000,'completed').valid_timing_run,false);
  assert.throws(()=>new BenchmarkRecorder(0,-1));
});
test('capture hints allow one-handed signing and do not imply recognition', () => {
  assert.equal(captureGuidance(detection).level,'ready');
  assert.match(captureGuidance({pose:true}).message,/hands/);
  assert.match(captureGuidance({}).message,/upper body/);
  assert.match(captureGuidance({...detection,face:false}).message,/face/);
});
