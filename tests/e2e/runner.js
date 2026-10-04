#!/usr/bin/env node
/**
 * Master E2E Test Suite Runner
 * Minecraft Dungeons 2 Save Editor
 * 
 * Executes all 4 E2E test tiers in sequence, aggregates results,
 * outputs an authoritative summary, and returns appropriate exit code.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const startTime = Date.now();

  console.log('======================================================================');
  console.log('   MINECRAFT DUNGEONS 2 SAVE EDITOR — E2E TEST SUITE RUNNER');
  console.log('======================================================================');
  console.log(`Execution Mode : Opaque-Box E2E Test Suite (Tiers 1–4)`);
  console.log(`Node Runtime   : ${process.version} (${process.platform} ${process.arch})`);
  console.log(`Timestamp      : ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  const tiers = [
    { name: 'Tier 1: Feature Coverage', file: './Tier1FeatureCoverageTest.js' },
    { name: 'Tier 2: Boundary & Corner Cases', file: './Tier2BoundaryCornerCaseTest.js' },
    { name: 'Tier 3: Cross-Feature Integration', file: './Tier3CrossFeatureIntegrationTest.js' },
    { name: 'Tier 4: Real-World Workloads', file: './Tier4RealWorldWorkloadTest.js' }
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const tierResults = [];

  for (const tier of tiers) {
    const tierStart = Date.now();
    try {
      const module = await import(tier.file);
      const res = await module.run();
      const durationMs = Date.now() - tierStart;
      totalPassed += res.passed;
      totalFailed += res.failed;
      tierResults.push({
        name: tier.name,
        passed: res.passed,
        failed: res.failed,
        durationMs,
        status: res.failed === 0 ? 'PASSED' : 'FAILED'
      });
    } catch (err) {
      const durationMs = Date.now() - tierStart;
      totalFailed += 1;
      tierResults.push({
        name: tier.name,
        passed: 0,
        failed: 1,
        durationMs,
        status: 'FAILED',
        error: err.message
      });
      console.error(`\n[FATAL ERROR in ${tier.name}]:`, err);
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n======================================================================');
  console.log('                     FINAL TEST EXECUTION SUMMARY                     ');
  console.log('======================================================================');
  console.log(
    'Tier Name'.padEnd(38) +
    'Passed'.padEnd(10) +
    'Failed'.padEnd(10) +
    'Duration'.padEnd(12) +
    'Status'
  );
  console.log('-'.repeat(78));

  for (const r of tierResults) {
    const statusIcon = r.status === 'PASSED' ? 'PASS [OK]' : 'FAIL [X]';
    console.log(
      r.name.padEnd(38) +
      String(r.passed).padEnd(10) +
      String(r.failed).padEnd(10) +
      `${r.durationMs}ms`.padEnd(12) +
      statusIcon
    );
  }

  console.log('-'.repeat(78));
  console.log(
    'TOTAL SUITE'.padEnd(38) +
    String(totalPassed).padEnd(10) +
    String(totalFailed).padEnd(10) +
    `${totalDuration}s`.padEnd(12) +
    (totalFailed === 0 ? 'ALL PASSED (100%)' : 'SOME FAILED')
  );
  console.log('======================================================================');

  if (totalFailed > 0) {
    console.error(`\n❌ TEST SUITE FAILED: ${totalFailed} test failure(s) detected.`);
    process.exit(1);
  } else {
    console.log(`\n✅ TEST SUITE PASSED: All ${totalPassed} tests across 4 tiers passed cleanly.`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled runner error:', err);
  process.exit(1);
});
