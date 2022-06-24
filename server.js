const dotenv = require('dotenv').config();
const { download } = require('express/lib/response');
const mongoose = require('mongoose');

const app = require('./app');

const dbLOCAL = process.env.DATABASE_LOCAL;
// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );
mongoose
  .connect(dbLOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: `true`,
  })
  .then(() => console.log('DB connection successfully!'));

// SERVER
console.log(process.env.NODE_ENV);
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`App working on ${port}`);
});

// UN HANDLED REJECTION FROM THE DATABASE
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhaldaled Rejection! Shuting Down...');
  server.close(() => {
    process.exit(1);
  });
});
