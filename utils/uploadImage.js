const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products',
    format: async (req, file) => {
      // return the format based on the file's mimetype
      const formats = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      return formats[file.mimetype] || 'jpg'; // default to jpg if not in formats
    },
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
    transformation: [{ width: 250, crop: 'limit' }], // reduce size to max-width of 250px
  },
});

const imageParser = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // maximum image size of 5 MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'
        )
      );
    }
  },
});

module.exports = imageParser;
