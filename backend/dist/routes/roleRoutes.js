"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleController_1 = require("../controllers/roleController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', (0, auth_1.requireRole)(['admin']), roleController_1.getRoles);
router.post('/', (0, auth_1.requireRole)(['admin']), roleController_1.createRole);
router.put('/:id', (0, auth_1.requireRole)(['admin']), roleController_1.updateRole);
router.get('/permissions', (0, auth_1.requireRole)(['admin']), roleController_1.getPermissions);
exports.default = router;
//# sourceMappingURL=roleRoutes.js.map