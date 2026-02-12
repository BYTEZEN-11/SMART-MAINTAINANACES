const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const suffix = Date.now().toString(36) + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, `${file.fieldname}-${suffix}${path.extname(file.originalname)}`);
  }
});

const IMG_RE = /^image\/(jpeg|jpg|png|gif|webp)$/;
const VIDEO_RE = /^video\/(mp4|quicktime|webm)$/;
const AUDIO_RE = /^audio\/(mpeg|mp3|wav|ogg|aac)$/;
const PDF_RE = /^application\/pdf$/;

const EXT_LOOKUP = {
  image: /\.(jpe?g|png|gif|webp)$/i,
  video: /\.(mp4|mov|webm)$/i,
  audio: /\.(mp3|wav|ogg|aac|m4a)$/i,
  pdf: /\.pdf$/i,
};

const isAllowed = (file) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = (file.originalname || '').toLowerCase();
  if (IMG_RE.test(mime) && EXT_LOOKUP.image.test(ext)) return 'image';
  if (VIDEO_RE.test(mime) && EXT_LOOKUP.video.test(ext)) return 'video';
  if (AUDIO_RE.test(mime) && EXT_LOOKUP.audio.test(ext)) return 'audio';
  if (PDF_RE.test(mime) && EXT_LOOKUP.pdf.test(ext)) return 'pdf';
  return null;
};

const fileFilter = (req, file, cb) => {
  if (!isAllowed(file)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype || 'unknown'}`));
  }
  return cb(null, true);
};

const DEFAULT_LIMITS = {
  fileSize: 10 * 1024 * 1024, 
  files: 6,                   
  fields: 20,                 
  fieldSize: 256 * 1024,      
  parts: 100,                 
};

const upload = multer({ storage, fileFilter, limits: DEFAULT_LIMITS });

const mediaLimits = ({ maxFileSize, maxFiles = 1, kind = 'image' } = {}) => {
  const check = (req, file, cb) => {
    const ok = isAllowed(file);
    if (!ok) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    
    if (kind && ok !== kind) {
      return cb(new Error(`Endpoint accepts ${kind} files only`));
    }
    return cb(null, true);
  };
  return multer({
    storage,
    fileFilter: check,
    limits: {
      fileSize: maxFileSize || DEFAULT_LIMITS.fileSize,
      files: maxFiles,
      fields: DEFAULT_LIMITS.fields,
      fieldSize: DEFAULT_LIMITS.fieldSize,
      
      parts: Math.max(DEFAULT_LIMITS.fields + maxFiles * 2, DEFAULT_LIMITS.parts),
    },
  });
};

module.exports = upload;
module.exports.upload = upload;
module.exports.mediaLimits = mediaLimits;
module.exports.isAllowed = isAllowed;
module.exports.DEFAULT_LIMITS = DEFAULT_LIMITS;
