// IMPORTING PACKAGES
const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reveiwRouter = require('./reviewRoutes');

// ROUTER
const router = express.Router();

// Create and Get Review based on tour ID
router.use('/:tourID/reviews', reveiwRouter);

// Get Top 5 TOurs
router.get(
  '/top-5-tours',
  tourController.aliasTopTours,
  tourController.getAllTours
);
router.get('/tours-stats', tourController.getTourStats);
router.get(
  '/monthly-plan/:year',
  authController.restrictTo('admin', 'guide', 'lead-guide'),
  tourController.getMonthlyPlan
);

// Get Tours With In Radius
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// tours-within/?distance=233&center=-40,45&unit=mi
// tours-within/233/center/-40,45/unit/mi

// Get Distance To Tour From Point
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// Create TOur And get All tours
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protectedData,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// Get TOur, update and delete tour based on id
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protectedData,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPhotos,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protectedData,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// EXPORTING MODULES TO PUBLIC
module.exports = router;
