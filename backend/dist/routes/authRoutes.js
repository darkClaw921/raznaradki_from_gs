"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', auth_1.optionalAuth, authController_1.register);
router.post('/login', authController_1.login);
router.post('/activate', authController_1.activateUser);
router.get('/me', auth_1.authenticateToken, authController_1.me);
router.post('/invite', auth_1.authenticateToken, authController_1.inviteUser);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map