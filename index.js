const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const auth = require('./auth');
const dotenv = require('dotenv');

dotenv.config();

app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 8000;

mongoose
  .connect(
    process.env.MANGODB_URI ||
      'mongodb+srv://admin:Zxcvbnm@cluster0.wjlg0.mongodb.net/test?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then((result) => console.log('conntected'))
  .catch((err) => console.log(err));

const userRoutes = require('./routes/userRoutes');

app.use(cookieParser());
app.use(
  cookieSession({
    name: 'session',
    keys: ['somekey'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

app.use(auth);
app.use('/', userRoutes);

if (process.env.NODE_ENV === 'production') {
  //app.use(express.static('client/build'));
  app.use(express.static(__dirname + '/client/build'));
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
      if (err) res.status(500).send(err);
    });
  });
}

app.listen(PORT, () => console.log('Listening'));
