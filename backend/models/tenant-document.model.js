const mongoose = require('mongoose');

// The file itself lives in private server storage. This record deliberately contains only
// metadata and an internal storage name, never a public URL for an identity document.
const tenantDocumentSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        originalName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180,
        },
        storageName: {
            type: String,
            required: true,
            select: false,
        },
        mimeType: {
            type: String,
            required: true,
            enum: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        size: {
            type: Number,
            required: true,
            min: 1,
            max: 10 * 1024 * 1024,
        },
        expiresAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

tenantDocumentSchema.index({ owner: 1, createdAt: -1 });

const TenantDocument = mongoose.model('TenantDocument', tenantDocumentSchema);

module.exports = TenantDocument;
