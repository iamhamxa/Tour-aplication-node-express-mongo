const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utility/catchAsync');
const AppErrors = require('./../utility/appErrors');
const sendEmail = require('./../utility/email');

// JWT SIGN TOKEN
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECURE_SECRET, {
    expiresIn: process.env.JWT_SECRET_EXPIRES_IN,
  });
};

// SEND TOKEN TO THE CLIENT
const createSendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // In production only work with https
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Hide these from client
  user.password = undefined;
  user.role = undefined;
  // user.active = undefined;
  // user.__v = undefined;
  // user.passwordChangedAt = undefined;
  // user.confirmPassword = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    message: `The ${user.name} has ${message}`,
    token,
    data: {
      user: user,
    },
  });
};

// SIGNUP USER TO THE APPLICATION
exports.signupUser = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'Success',
  //   message: `The ${newUser.name} has been successfully sign up`,
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
  createSendToken(newUser, 201, res, 'been successfully sign up');
});

// SIGNIN USER TO THE APPLICATION
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password are exist
  if (!email || !password) {
    return next(new AppErrors('Please provide email and password', 400));
  }

  // 2) Check if user exists and password correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppErrors('Incorrect Email or password', 401));
  }

  // 3) If everything okay send token to the client
  createSendToken(user, 200, res, 'been successfully sign in');
});

// RESTRICT USER TO NOT CHECK RESTRCTED ROUTE WITHOUT LOGIN OR JWT
exports.protectedData = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppErrors('You are not logged in please login to gain access', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECURE_SECRET
  );

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppErrors('The user belonging to the token does not exist', 401)
    );
  }
  // 4) CHeck if user changed the password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppErrors(
        'User recently changed the password! Please login again',
        401
      )
    );
  }
  // GRANT ACCESSS TO THE PROTECTED TOUR ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// RESTRICT USER TO NOT CHECK RESTRCTED ROUTE WITHOUT LOGIN OR JWT
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check of it's there

  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECURE_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) next();

      // 3) CHeck if user changed the password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};
exports.logOutUser = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 1 * 3000),
    httpOnly: true,
  }),
    res.status(200).json({
      status: 'Success',
      message: 'Logged Out Successfully',
    });
};

// RESTRICT BASED ON THERE ROLE ADMIN, USER,LEAD,LEAD-GUIDE
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppErrors('You don not have permission to access this route', 403)
      );
    }
    next();
  };
};

// ALLOW ACCESS TO USER TO FORGOT THERE PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppErrors('There is no user with email address.', 404));
  }

  // 2) Genrate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Sent it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and 
  passwordConfirm to ${resetURL}.\n if you didn't forgot your password please ignore this email!`;
  try {
    await sendEmail({
      email: req.body.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Reset password sent to email',
      URL: resetURL,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppErrors('There was an error sending the email. Try again later!'),
      500
    );
  }
});

// RESET USER PASSWORD WHEN THEY TRY TO FORGOT THE PASSWORD
exports.resettPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is the user, set the new password
  console.log(req.params.token);
  if (!user) {
    return next(new AppErrors('Token is invalid or has expired', 400));
  }
  (user.password = req.body.password),
    (user.confirmPassword = req.body.confirmPassword),
    (user.passwordResetToken = undefined),
    (user.passwordResetExpires = undefined);

  await user.save();
  // 3) Update changedPasswordAt property for the use

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res, 'successfully changed password');
});

// UPDATE USER PASSWORD
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get User from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted current user is corrected
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppErrors('Your current password is not correct', 401));
  }
  if (req.body.password.length < 8) {
    return next(new AppErrors('Your  password is less then 8 characters', 401));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new AppErrors('Your  password is not same', 401));
  }

  // 3) If so update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  createSendToken(user, 201, res, 'successfully changed the password....');
});
