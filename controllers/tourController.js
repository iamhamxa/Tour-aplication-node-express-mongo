// IMPORTING PACKAGES
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utility/catchAsync');
const AppError = require('../utility/appErrors');

// GET ALL TOURS FROM THE API
exports.getAllTours = factory.getAll(Tour);

// GET ONE TOUR BY ID
exports.getTour = factory.getOne(Tour, 'tour', {
  path: 'reviews',
  select: '-__v',
});

// CREATE TOUR ON THE API
exports.createTour = factory.createOne(Tour, 'tour');

// UPDATE TOUR ONE THE API
exports.updateTour = factory.updateOne(Tour, 'tour');

// DELETE TOUR FROM THE API // ONLY ADMIN CAN DO IT
exports.deleteTour = factory.deleteOne(Tour, 'tour');

// UPLOADING TOUR IMAGES
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image please try to upload an image', 404), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadTourPhotos = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);
  if (!req.files.images || !req.files.imageCover) return next();
  // UPLOAD IMAGECOVER
  const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1300)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFileName}`);

  req.body.imageCover = imageCoverFileName;

  // UPLOAD IMAGES
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const imagesFileName = `tour-${req.params.id}-${Date.now()}-${
        i + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1300)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imagesFileName}`);
      req.body.images.push(imagesFileName);
    })
  );

  next();
});
// GET TOP 5 TOUR BY THE FIELDS
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'ratingAverage,price';
  req.query.fields = 'name,duration,difficulty,price';
  next();
};

// AGGREGATION PIPELINE
// GET TOUR STATS
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    stats: 'success',
    data: {
      stats,
    },
  });
});

// AGGREGATION PIPELINE WINDING
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { month: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).json({
    Status: 'success',
    data: {
      plan,
    },
  });
});

// tours-within/?distance=233&center=-40,45&unit=mi
// tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  [lat, lng] = latlng.split(',');

  console.log(distance, lat, lng, unit);
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Success',
    distances,
  });
});
