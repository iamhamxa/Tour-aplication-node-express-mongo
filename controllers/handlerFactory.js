const catchAsync = require('./../utility/catchAsync');
const AppErrors = require('./../utility/appErrors');
const APIFeatures = require('./../utility/apiFeatures');

exports.deleteOne = (Model, message) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppErrors(`No ${message} found with that ID`, 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.createOne = (Model, message) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.updateOne = (Model, message) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppErrors(`No ${message} found with that ID`, 404));
    }
    res.status(205).json({
      status: 'success',
      data: doc,
    });
  });

exports.getOne = (Model, message, populateOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) Model.findById(req.params.id).populate(populateOption);
    const doc = await query;

    if (!doc) {
      return next(new AppErrors(`No ${message} found with that ID`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // Allow nested routes
    let filter = {};
    if (req.params.tourID) filter = { tour: req.params.tourID };
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const data = await features.query.explain();
    const data = await features.query;

    res.status(200).json({
      status: 'success',
      results: data.length,
      requestedAt: req.requestTime,
      mytour: data
    });
    next();
  });
