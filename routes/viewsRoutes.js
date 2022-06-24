const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');

const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src http://localhost:3000 http://127.0.0.1:3000 'self' https://*.mapbox.com ;" +
  // "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src http://localhost:3000 http://127.0.0.1:3000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';

const router = express.Router();
router.use((req, res, next) => {
  res.setHeader(CSP, POLICY);
  next();
});
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin: *');
  next();
});
router.get('/me', authController.protectedData, viewsController.userAccount);
router.post(
  '/submit-user-data',
  authController.protectedData,
  viewsController.updateUserData
);

// router.use(authController.isLoggedIn);
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.login);

module.exports = router;
