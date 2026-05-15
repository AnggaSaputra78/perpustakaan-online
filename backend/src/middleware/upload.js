const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Buat folder upload jika belum ada
const uploadPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage untuk cover buku
const bookCoverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadPath, 'books');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage untuk PDF buku
const bookPdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadPath, 'books');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage untuk foto profil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadPath, 'profiles');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    pdf: ['application/pdf'],
  };
  
  if (file.fieldname === 'cover' || file.fieldname === 'avatar') {
    if (allowedTypes.image.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  } else if (file.fieldname === 'pdfFile') {
    if (allowedTypes.pdf.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  } else {
    cb(null, true);
  }
};

const uploadBookCover = multer({
  storage: bookCoverStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const uploadBookPdf = multer({
  storage: bookPdfStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = { uploadBookCover, uploadBookPdf, uploadProfile };