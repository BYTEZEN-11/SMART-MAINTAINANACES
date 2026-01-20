
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const MultimodalAnalysis = require('../models/MultimodalAnalysis');
const Appliance = require('../models/Appliance');
const User = require('../models/User');
const { generateReport } = require('../services/pdfReportService');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const a = await MultimodalAnalysis.findOne().sort({ createdAt: -1 }).lean();
  if (!a) { console.log('No analysis to generate from'); process.exit(1); }
  const user = await User.findById(a.user).lean();
  const appliance = a.appliance ? await Appliance.findById(a.appliance).lean() : null;
  const outputDir = path.join(__dirname, '..', 'uploads', 'reports');

  for (const tpl of ['executive', 'technician', 'insurance']) {
    try {
      const out = await generateReport({
        user, appliance, analysis: a, outputDir, template: tpl,
      });
      console.log(`[direct PDF] ${tpl}: fileName=${out.fileName} size=${out.fileSize}`);
    } catch (e) {
      console.error(`[direct PDF] ${tpl}: ERROR`, e.message);
      console.error(e.stack);
      process.exit(1);
    }
  }

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });