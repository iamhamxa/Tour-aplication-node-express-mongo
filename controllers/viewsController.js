const AppError = require('../utility/appErrors');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utility/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  if (!tours) {
    new AppError(
      'There is no tours with this resource please try again later!!',
      404
    );
  }
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get The data for the requested tour including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review ratings user',
  });
  if (!tour) {
    return next(new AppError('There is no tour with that name!!!', 404));
  }
  // console.log(tour.name, tour._id);
  // 2) Build template
  // 3) Render template using from data 1

  res.status(200).render('tour', {
    title: 'The Forest Hiker Tour',
    tour,
  });
});

exports.login = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your Account',
  });
};
exports.userAccount = async (req, res) => {
  res.status(200).render('account', {
    title: 'My Account',
    // user,
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  // console.log('UPDATING USEr', req.user.id);

  res.status(200).render('account', {
    title: 'My Account',
    user: updatedUser,
  });
  // next();
});
