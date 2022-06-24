const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const factory = require('./handlerFactory');
const catchAsync = require('./../utility/catchAsync');
const AppErrors = require('./../utility/appErrors');

// GET CURRENT USER DATA
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
// GET ALL USERS
exports.getAllUsers = factory.getAll(User);

// GET SINGLE REVIEW BASED ON ID
exports.getUser = factory.getOne(User, 'user');

// CREATE USER FROM ADMIN SIDE
exports.createUser = factory.createOne(User, 'user');

// UPDATE USER FROM ADMIN SIDE
exports.updateUser = factory.updateOne(User, 'user');

// DELETE USER FROM ADMIN SIDE
exports.deleteUser = factory.deleteOne(User, 'user');

// FILTER THE OBJECTS TO UPDATE FOR CURRENT USER
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// UPLOADING FILES STORAGE

// const multerStorage = multer.diskStorage({
//   // CB same like in express CallbackPromice
//   destination: function (req, file, cb) {
//     cb(null, 'public/img/users/');
//   },
//   filename: function (req, file, cb) {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppErrors('Not an image please use an image', 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadFiles = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};
// UPDATE CURRENT USER DATA
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1) Create error if user posted password data
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppErrors(
        'This route is not for updating the password please use /update-password',
        401
      )
    );
  }
  // 2) Filter out the fields that are not allowed to be changed

  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // 4) Send response to the client
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// DEACTIVATE CURRENT USER ACCOUNT TO NOT ACCESS
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'Success',
    data: null,
  });
});
