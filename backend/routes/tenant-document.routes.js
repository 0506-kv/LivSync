const express = require('express');
const {
    getTenantDocuments,
    uploadTenantDocument,
    downloadTenantDocument,
    deleteTenantDocument,
} = require('../controllers/tenant-document.controller');
const { requireParticipant, requireRole } = require('../middlewares/auth.middleware');
const {
    uploadTenantDocument: uploadFile,
    validateTenantDocumentUpload,
    validateTenantDocumentId,
} = require('../middlewares/tenant-document.middleware');

const router = express.Router();

router.use(requireParticipant);

// A landlord can download only files expressly attached to one of their rental applications.
router.get('/:documentId/download', validateTenantDocumentId, downloadTenantDocument);

router.use(requireRole('user', 'Only tenants can manage documents'));
router.get('/', getTenantDocuments);
router.post('/', uploadFile, validateTenantDocumentUpload, uploadTenantDocument);
router.delete('/:documentId', validateTenantDocumentId, deleteTenantDocument);

module.exports = router;
