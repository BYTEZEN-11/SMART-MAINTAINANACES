

const path = require('path');
const fs = require('fs');
const os = require('os');
const { test, assert, assertEqual, run } = require("./_testRunner");
const { generateReport, verifyPdfFile } = require('../services/pdfReportService');

const analysis = {
  _id: '507f1f77bcf86cd799439099',
  deviceType: 'cooling',
  deviceName: 'Window AC',
  aiModel: 'gemini-1.5-flash',
  isMock: false,
  processingTime: 1234,
  inputs: {
    textDescription: 'Unit is leaking water and making a buzzing noise.',
  },
  analysis: {
    issue: 'Water leak with abnormal noise',
    severity: 'High',
    solution: 'Inspect the condensate drain pan and the compressor mounting.',
    confidence: 87,
    rootCause: 'Likely a clogged condensate drain combined with compressor vibration.',
    probableCauses: [
      { cause: 'Clogged drain', probability: 70 },
      { cause: 'Compressor wear', probability: 30 },
    ],
    recommendations: ['Clean the drain pan', 'Tighten the compressor mounts'],
    repairSteps: ['Power off the unit', 'Locate the drain pan', 'Clear the blockage'],
    matchedRules: ['R-001', 'R-007'],
  },
};

const appliance = {
  name: 'Living Room AC',
  type: 'cooling',
  brand: 'Voltas',
  model: 'Vectra',
  serialNumber: 'AC-1234',
  location: 'Living Room',
  installedAt: new Date('2023-04-12'),
};

const user = { name: 'Test User', email: 'test@example.com' };

console.log("\nPDF report tests\n────────────────");

(async () => {
  const outputDir = path.join(os.tmpdir(), 'ai-hma-pdf-tests', String(Date.now()));

  for (const template of ['executive', 'technician', 'insurance']) {
    test(`generateReport(${template}) writes a valid PDF`, async () => {
      const out = await generateReport({ user, appliance, analysis, outputDir, template });
      assert(out.filePath, "filePath returned");
      assert(out.fileName.endsWith('.pdf'), "fileName ends in .pdf");
      assert(out.fileSize > 100, `fileSize > 100 bytes (got ${out.fileSize})`);

      const buf = fs.readFileSync(out.filePath);
      assert(buf.length === out.fileSize, "reported size matches on-disk size");
      const magic = buf.slice(0, 5).toString('latin1');
      assertEqual(magic, '%PDF-', 'PDF magic header present');
    });
  }

  test("verifyPdfFile passes for a real PDF", async () => {
    
    const out = await generateReport({ user, appliance, analysis, outputDir, template: 'executive' });
    await verifyPdfFile(out.filePath); 
    assert(true, 'verifyPdfFile did not throw');
  });

  test("verifyPdfFile rejects non-PDF files", async () => {
    const junk = path.join(outputDir, 'junk.pdf');
    fs.writeFileSync(junk, 'this is not a pdf');
    let threw = false;
    try { await verifyPdfFile(junk); } catch (_) { threw = true; }
    assert(threw, 'verifyPdfFile rejected junk file');
  });

  test("verifyPdfFile rejects tiny files", async () => {
    const tiny = path.join(outputDir, 'tiny.pdf');
    fs.writeFileSync(tiny, 'abc');
    let threw = false;
    try { await verifyPdfFile(tiny); } catch (_) { threw = true; }
    assert(threw, 'verifyPdfFile rejected tiny file');
  });

  test("generateReport does NOT throw a stream error on second doc.end (the original bug)", async () => {

let threw = false;
    try {
      await generateReport({ user, appliance, analysis, outputDir, template: 'technician' });
    } catch (e) {
      threw = true;
      console.log('   (caught):', e.message);
    }
    assert(!threw, 'no exception thrown');
  });

  run();
})();