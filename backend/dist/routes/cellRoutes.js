"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cellController_1 = require("../controllers/cellController");
const router = (0, express_1.Router)();
router.get('/sheets/:sheetId/cells/:row/:column', auth_1.authenticateToken, cellController_1.getCell);
router.put('/sheets/:sheetId/cells/:row/:column', auth_1.authenticateToken, cellController_1.updateCell);
router.get('/sheets/:sheetId/cells/:row/:column/history', auth_1.authenticateToken, cellController_1.getCellHistory);
router.post('/sheets/:sheetId/format', auth_1.authenticateToken, cellController_1.formatCells);
exports.default = router;
//# sourceMappingURL=cellRoutes.js.map