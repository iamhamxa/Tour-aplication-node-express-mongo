const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
// const catchAsync = require('./../utility/catchAsync');
// const AppError = require('./../utility/appErrors');


// creating new reviews
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourID;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
// Show reviews to the clients
exports.getAllReviews = factory.getAll(Review);

// Create review only user
exports.createReview = factory.createOne(Review,'review');

// DELETE REVIEW
exports.deleteReview = factory.deleteOne(Review, 'review');

// UPDATE REVIEW
exports.updateReview = factory.updateOne(Review,'review')

// GET ONE REVIEW
exports.getReview = factory.getOne(Review,'review')