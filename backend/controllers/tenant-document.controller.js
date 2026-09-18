const fs = require('fs');
const path = require('path');
const Rental = require('../models/rental.model');
const TenantDocument = require('../models/tenant-document.model');

const STORAGE_DIRECTORY = path.join(__dirname, '..', 'uploads', 'tenant-documents');

function serializeDocument(document) {
    return {
        id: document._id,
        label: document.label,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        expiresAt: document.expiresAt || null,
        createdAt: document.createdAt,
    };
}

async function hasExpectedFileSignature(filePath, mimeType) {
    const handle = await fs.promises.open(filePath, 'r');
    const header = Buffer.alloc(8);

    try {
        await handle.read(header, 0, header.length, 0);
    } finally {
        await handle.close();
    }

    if (mimeType === 'application/pdf') return header.subarray(0, 5).toString() === '%PDF-';
    if (mimeType === 'image/jpeg') return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;

    return header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function removeFile(filePath) {
    return fs.promises.unlink(filePath).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
    });
}

function safeFileName(name) {
    return String(name || 'document').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 180) || 'document';
}

async function getTenantDocuments(req, res) {
    try {
        const documents = await TenantDocument.find({ owner: req.participant.id }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            message: 'Documents retrieved successfully',
            data: { documents: documents.map(serializeDocument) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to retrieve documents', data: {} });
    }
}

async function uploadTenantDocument(req, res) {
    try {
        const isValidFile = await hasExpectedFileSignature(req.file.path, req.file.mimetype);

        if (!isValidFile) {
            await removeFile(req.file.path);
            return res.status(422).json({
                success: false,
                message: 'The uploaded file does not match its declared format',
                data: {},
            });
        }

        const document = await TenantDocument.create({
            owner: req.participant.id,
            label: req.body.label,
            originalName: safeFileName(req.file.originalname),
            storageName: path.basename(req.file.filename),
            mimeType: req.file.mimetype,
            size: req.file.size,
            expiresAt: req.body.expiresAt || undefined,
        });

        return res.status(201).json({
            success: true,
            message: 'Document saved to your vault',
            data: { document: serializeDocument(document) },
        });
    } catch (error) {
        if (req.file?.path) await removeFile(req.file.path).catch(() => {});

        return res.status(500).json({ success: false, message: 'Unable to save document', data: {} });
    }
}

async function canDownload(document, participant) {
    if (participant.role === 'user') return String(document.owner) === String(participant.id);

    return Boolean(await Rental.exists({
        landlord: participant.id,
        'documentSubmissions.document': document._id,
    }));
}

async function downloadTenantDocument(req, res) {
    try {
        const document = await TenantDocument.findById(req.params.documentId).select('+storageName');

        if (!document || !(await canDownload(document, req.participant))) {
            return res.status(404).json({ success: false, message: 'Document not found or access denied', data: {} });
        }

        const filePath = path.join(STORAGE_DIRECTORY, path.basename(document.storageName));

        try {
            await fs.promises.access(filePath, fs.constants.R_OK);
        } catch (error) {
            return res.status(410).json({ success: false, message: 'This document file is no longer available', data: {} });
        }

        res.set({
            'Content-Type': document.mimeType,
            'Content-Disposition': `attachment; filename="${safeFileName(document.originalName)}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
        });

        return fs.createReadStream(filePath)
            .on('error', () => res.destroy())
            .pipe(res);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to download document', data: {} });
    }
}

async function deleteTenantDocument(req, res) {
    try {
        const document = await TenantDocument.findOne({ _id: req.params.documentId, owner: req.participant.id }).select('+storageName');

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found or access denied', data: {} });
        }

        const isShared = await Rental.exists({ 'documentSubmissions.document': document._id });

        if (isShared) {
            return res.status(409).json({
                success: false,
                message: 'This document is attached to a rental application and cannot be deleted',
                data: {},
            });
        }

        await removeFile(path.join(STORAGE_DIRECTORY, path.basename(document.storageName)));
        await document.deleteOne();

        return res.json({ success: true, message: 'Document deleted from your vault', data: {} });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to delete document', data: {} });
    }
}

module.exports = {
    getTenantDocuments,
    uploadTenantDocument,
    downloadTenantDocument,
    deleteTenantDocument,
    serializeDocument,
};
