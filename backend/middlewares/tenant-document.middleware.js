const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { body, param, validationResult } = require('express-validator');

const STORAGE_DIRECTORY = path.join(__dirname, '..', 'uploads', 'tenant-documents');
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

fs.mkdirSync(STORAGE_DIRECTORY, { recursive: true });

const upload = multer({
    storage: multer.diskStorage({
        destination: STORAGE_DIRECTORY,
        filename: (req, file, callback) => callback(null, crypto.randomBytes(24).toString('hex')),
    }),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (!ALLOWED_TYPES.has(file.mimetype)) {
            return callback(new Error('Upload a PDF, JPEG, or PNG document'));
        }

        return callback(null, true);
    },
});

function uploadTenantDocument(req, res, next) {
    upload.single('file')(req, res, (error) => {
        if (!error) return next();

        const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
            ? 'Document files must be 10 MB or smaller'
            : error.message || 'Unable to upload document';

        return res.status(422).json({ success: false, message, data: {} });
    });
}

const validateTenantDocumentUpload = [
    body('label').trim().isLength({ min: 2, max: 100 }).withMessage('Document name must be 2 to 100 characters'),
    body('expiresAt').optional({ values: 'falsy' }).isISO8601().toDate().withMessage('Enter a valid expiry date'),
    (req, res, next) => {
        const errors = validationResult(req);

        if (!req.file) {
            return res.status(422).json({ success: false, message: 'Choose a document to upload', data: {} });
        }

        if (!errors.isEmpty()) {
            if (req.file?.path) fs.unlink(req.file.path, () => {});

            return res.status(422).json({
                success: false,
                message: errors.array()[0].msg,
                data: {},
            });
        }

        return next();
    },
];

const validateTenantDocumentId = [
    param('documentId').isMongoId().withMessage('Invalid document id'),
    handleValidationErrors,
];

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, message: errors.array()[0].msg, data: {} });
    }

    return next();
}

module.exports = {
    uploadTenantDocument,
    validateTenantDocumentUpload,
    validateTenantDocumentId,
};
