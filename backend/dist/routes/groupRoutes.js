"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groupController_1 = require("../controllers/groupController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', (0, auth_1.requireRole)(['admin']), groupController_1.getGroups);
router.post('/', (0, auth_1.requireRole)(['admin']), groupController_1.createUserGroup);
router.put('/:id', (0, auth_1.requireRole)(['admin']), groupController_1.updateGroup);
router.post('/:id/users', (0, auth_1.requireRole)(['admin']), groupController_1.addUsersToGroup);
router.post('/:id/members', (0, auth_1.requireRole)(['admin']), groupController_1.addUsersToGroup);
router.delete('/:id/users', (0, auth_1.requireRole)(['admin']), groupController_1.removeUsersFromGroup);
router.delete('/:id/members', (0, auth_1.requireRole)(['admin']), groupController_1.removeUsersFromGroup);
router.post('/access', (0, auth_1.requireRole)(['admin']), groupController_1.setGroupSheetAccess);
router.delete('/:id', (0, auth_1.requireRole)(['admin']), groupController_1.deleteGroup);
exports.default = router;
//# sourceMappingURL=groupRoutes.js.map