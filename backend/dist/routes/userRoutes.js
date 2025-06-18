"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', (0, auth_1.requireRole)(['admin', 'editor']), userController_1.getUsers);
router.get('/:id', userController_1.getUser);
router.get('/:id/access', userController_1.getUserAccess);
router.post('/', (0, auth_1.requireRole)(['admin']), userController_1.createUser);
router.post('/invite', (0, auth_1.requireRole)(['admin']), userController_1.inviteUser);
router.patch('/bulk', (0, auth_1.requireRole)(['admin']), userController_1.bulkUpdateUsers);
router.put('/:id', userController_1.updateUser);
router.patch('/:id/deactivate', (0, auth_1.requireRole)(['admin']), userController_1.deactivateUser);
router.post('/access', (0, auth_1.requireRole)(['admin']), userController_1.setUserSheetAccess);
router.delete('/access', (0, auth_1.requireRole)(['admin']), userController_1.removeUserSheetAccess);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map