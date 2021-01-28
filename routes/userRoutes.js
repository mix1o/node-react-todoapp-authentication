const express = require('express');
const router = express.Router();
const Users = require('../schema/userSchema');
const Todo = require('../schema/todoSchema');
const bcrypt = require('bcryptjs');
const token = require('crypto-token');
const ObjectID = require('mongodb').ObjectID;
const nodemailer = require('nodemailer');
const {
  registerValidation,
  loginValidation,
  resetValidation,
  taskValidation,
  messageValidation,
  newPasswordValidation,
} = require('../validation/validation');
const sgMail = require('@sendgrid/mail');

router.get('http://localhost:8000/test', (req, res) => {
  res.send('test');
});

router.post('/api/newuser', async (req, res) => {
  const { error } = registerValidation(req.body);

  if (error) return res.send({ message: error.details[0].message });

  const emailExist = await Users.findOne({ email: req.body.Email });
  if (emailExist) return res.send({ message: 'Email already exists! ' });

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.Password, salt);

  const t = token(32);
  const user = new Users({
    name: req.body.Firstname,
    surrname: req.body.Lastname,
    email: req.body.Email,
    password: hashPassword,
    confirmedAccountToken: t,
  });

  try {
    const savedUser = await user.save();
    res.send({ message: 'Your account has been created!', correct: true });
    sgMail.setApiKey(
      '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'
    );
    const msg = {
      to: req.body.Email,
      from: 'mntasks@interia.pl',
      subject: 'nmTasks Confrim your account',
      text: 'test',
      html: `<div style="font-family:Verdana;margin: 0 auto; padding: 0; max-width: 90%; align-items: center; justify-content: center; flex: 1 1 100%; flex-flow: column wrap; border-radius: 10px; color: #353353; font-size: 10px; "> <h3 style=" max-width: 100%; background-color: #1db95e; color: #fff; font-size: 3em; padding: 1em 0 1em 1em; border-radius: 10px 10px 0 0; margin: 0; "> mnTasks </h3> <div style="text-align: left; color: #353353;font-size: 1.1em; background-color: #f9f9f9"> <h5 style=" font-size: 2em; font-weight: 700; padding: 1em 0; margin: 0 0 0 0.5em;color: #353353; "> Confirm your account </h5> <div style="margin: 0 0 1em 1em"> <p style="font-size:1.3em;font-weight: 500;color: #353353; margin: 0 0 1em 0"> To confirm your account <span style="font-weight: 700;font-size:1em">${req.body.Email}</span> please clik the link below or copy and paste link into your browse </p> </div> <p style="font-size:1.3em;margin: 0 0 1em 1em; color:#4285F4;text-decoration: underline">https://mntasks.herokuapp.com/almost-there/${t}</p> <div> <button style="border:none;background:#f9f9f9"> <a href="href='https://mntasks.herokuapp.com/almost-there/${t}'" target="_blank" style="display:inline-block; padding: 0.75em 1.2em; margin: 0.5em 0 2.5em 1em; font-size: 1.2em; font-weight: 700; background: #1db95e;text-decoration:none; background-color:#1db95e;border: none; border-radius: 0.3em; color: #fff; "> Confirm now </a></button> </div> </div> <div style="text-align: left; background-color: #E6E6E6; padding: 0; border-radius: 0 0 10px 10px;"> <p style="font-weight: bold; color: #353353;font-size: 1.4em; margin:0 0 0 1em; padding-top: 1em;"> Important Security Notice: </p> <p style="margin-left: 1em;color: #353353; font-size: 1.3em;"> mnTaska never asks for your password or other sensitive information by email. Do not click links or respond to a suspicious email! </p> <p style="margin-left: 1em;color: #353353; font-size: 1.3em;"> Do not reply to this email! This message was generated automaticly. </p> <p style="margin-left: 1em;color: #353353;padding-bottom: 1em; font-size: 1.3em;"> &copy; mnTasks 2021 </p> </div> </div>`,
    };

    sgMail.send(msg);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/api/confirm', async (req, res) => {
  const { token } = req.body;
  const user = await Users.findOne({ confirmedAccountToken: token });
  console.log(user);
  if (!user) return res.send({ message: 'Something went wrong' });

  user.confirmedAccount = true;
  user.save().then((result) => {
    res.send({ message: 'Successful confirm account', correct: true });
  });
});

router.post('/api/resetPassword', (req, res) => {
  const { error } = resetValidation(req.body);

  if (error) return res.send({ message: error.details[0].message });

  Users.findOne({ email: req.body.Email })
    .then((user) => {
      if (!user) {
        return res.send({ message: 'Email not found' });
      }
      const t = token(32);
      console.log(t);
      user.resetToken = t;
      user.expireToken = Date.now() + 8000000;
      user.save().then((result) => {
        sgMail.setApiKey(
          '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'
        );
        const msg = {
          to: req.body.Email,
          from: 'mntasks@interia.pl',
          subject: 'nmTasks Reset your password',
          text: 'We have sent mail to reset password',
          html: ` <div style="font-family:Verdana;margin: 0 auto; padding: 0; max-width: 90%; align-items: center; justify-content: center; flex: 1 1 100%; flex-flow: column wrap; border-radius: 10px; color: #353353; font-size: 10px; "> <h3 style=" max-width: 100%; background-color: #1db95e; color: #fff; font-size: 3em; padding: 1em 0 1em 1em; border-radius: 10px 10px 0 0; margin: 0; "> mnTasks </h3> <div style="text-align: left; color: #353353;font-size: 1.1em; background-color: #f9f9f9"> <h5 style=" font-size: 2em; font-weight: 700; padding: 1em 0; margin: 0 0 0 0.5em;color: #353353; "> Reset your password </h5> <div style="margin: 0 0 1em 1em"> <p style="font-size:1.3em;font-weight: 500;color: #353353; margin: 0 0 1em 0"> We recently received a request to reset the password to your account: </p> <span style="font-weight: 700;font-size:1.3em">${req.body.Email}</span> </div> <p style="font-size:1.3em;font-weight: 500;color: #353353; margin: 0 0 1em 1em"> To reset your password, click on the button bellow or copy and paste link into your browse </p> <p style="font-size:1.3em;margin: 0 0 1em 1em; color:#4285F4;text-decoration: underline">https://mntasks.herokuapp.com/reset/${t}</p> <div> <button style="border:none;background:#f9f9f9"> <a href="https://mntasks.herokuapp.com/reset/${t}" target="_blank" style="display:inline-block; padding: 0.75em 1.2em; margin: 0.5em 0 2.5em 1em; font-size: 1.2em; font-weight: 700; background: #1db95e;text-decoration:none; background-color:#1db95e;border: none; border-radius: 0.3em; color: #fff; "> Reset </a></button> </div> </div> <div style="text-align: left; background-color: #E6E6E6; padding: 0; border-radius: 0 0 10px 10px;"> <p style="font-weight: bold; color: #353353;font-size: 1.4em; margin:0 0 0 1em; padding-top: 1em;"> Important Security Notice: </p> <p style="margin-left: 1em;color: #353353; font-size: 1.3em;"> mnTaska never asks for your password or other sensitive information by email. Do not click links or respond to a suspicious email! </p> <p style="margin-left: 1em;color: #353353; font-size: 1.3em;"> Do not reply to this email! This message was generated automaticly. </p> <p style="margin-left: 1em;color: #353353;padding-bottom: 1em; font-size: 1.3em;"> &copy; mnTasks 2021 </p> </div> </div>`};

        sgMail.send(msg);
        res.send({ message: 'Check your email', correct: true });
      });
    })
    .catch((err) => console.log(err));
});
router.post('/api/newPassword', (req, res) => {
  const { error } = newPasswordValidation(req.body);

  if (error) return res.send({ message: error.details[0].message });

  if (req.body.newPassword !== req.body.confrimNewPassword)
    return res.send({ message: 'Passwords are not the same' });

  const { newPassword, confrimNewPassword, token } = req.body;

  Users.findOne({ resetToken: token, expireToken: { $gt: Date.now() } })
    .then((user) => {
      if (!user) {
        return res.send({ message: 'Try again session expired' });
      }
      bcrypt.hash(newPassword, 10).then((hashedpassword) => {
        user.password = hashedpassword;
        user.resetToken = undefined;
        user.expireToken = undefined;
        user.save().then((saveduser) => {
          res.send({
            message: 'Your password has been changed',
            correct: true,
          });
        });
      });
    })
    .catch((err) => console.log(err));
});

router.post('/api/login', async (req, res, next) => {
  const client = await Users.findOne({ email: req.body.Email });
  if (!client) return res.send({ message: 'Email not found!' });

  const validPass = await bcrypt.compare(req.body.Password, client.password);
  if (!validPass) return res.send({ message: 'Invalid password!' });

  if (!client.confirmedAccount)
    return res.send({ message: 'Please confirm your email' });
  console.log(client.confirmedAccount);

  req.session.user = client;
  const user = { ...client };

  res.cookie('user', user._doc);
  console.log(user._doc);
  res.send({ message: 'You are logged in', correct: true });
});

router.post('/api/signOut', (req, res) => {
  delete req.session.user;
  res.clearCookie('user');
  res.send('logged out');
});

router.post('/api/newToDo', async (req, res, next) => {
  const { error } = taskValidation(req.body);
  if (error) return res.send({ message: error.details[0].message });
  const { Title, Description, Priority } = req.body;

  const singleTodo = new Todo({
    userId: req.session.user._id,
    name: Title,
    description: Description,
    priority: Priority,
  });
  console.log(req.session.user);
  if (req.session.user.credits < 1) {
    return res.send({
      message: "You don't have enough credits",
    });
  }
  try {
    const savedSingleTodo = await singleTodo.save();
    const updateCredits = await Users.updateOne(
      { _id: req.session.user._id },

      {
        $set: {
          credits: req.session.user.credits - 1,
        },
      }
    );

    req.session.user.credits -= 1;

    const userStatus = await Users.findOne({ _id: req.session.user._id });

    if (userStatus.newUser) {
      const updateUserStatus = await Users.updateOne(
        { _id: req.session.user._id },

        {
          $set: {
            newUser: false,
          },
        }
      );

      req.session.user.newUser = false;
    }

    res.status(200).send({ message: 'You added task', correct: true });
    console.log(req.session.user.credits);
  } catch (e) {
    res.send({ message: 'Something went wrong' });
    console.log(e);
  }
});

router.post('/api/payCard', async (req, res) => {
  const { creditsAdd, totalPrice } = req.body;
  try {
    const updateCredits = await Users.updateOne(
      { _id: req.session.user._id },

      {
        $set: {
          credits: req.session.user.credits + creditsAdd,
        },
      }
    );

    req.session.user.credits += creditsAdd;
    sgMail.setApiKey(
      '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'
    );
    const msg = {
      to: req.session.user.email,
      from: 'mntasks@interia.pl',
      subject: 'nmTasks Thank you for payment',
      html: `<div style="font-family:Verdana;margin: 0 auto; padding: 0; max-width: 90%; align-items: center; justify-content: center; flex: 1 1 100%; flex-flow: column wrap; border-radius: 10px; color: #353353; font-size: 10px; "> <h3 style=" max-width: 100%; background-color: #1db95e; color: #fff; font-size: 3em; padding: 1em 0 1em 1em; border-radius: 10px 10px 0 0; margin: 0; "> mnTasks </h3> <div style="text-align: left; color: #353353;font-size: 1.1em; background-color: #f9f9f9"> <h5 style=" font-size: 2.4em; font-weight: 700; padding: 1em 0; margin: 0 0 0 0.5em;color: #353353; "> Your online purchase on mnTasks </h5> <div style="margin: 0 0 1em 1em"> <p style="font-size:1.5em">Hi, <span style="font-weight:700">${req.session.user.name}</span></p> <p style="font-size:1.5em">Thank you for purchasing credits on our website <span>mnTasks</span></p> <h5 style="font-size: 2.3em; font-weight: 700; padding-top:1em; margin: 0;color: #353353; ">Payments details</h5> <p style="font-size:1.5em">Total payment: <span style="font-weight:700">${req.body.totalPrice}</span></p> <p style="font-size:1.5em">Credits: <span style="font-weight:700">${req.body.creditsAdd}</span></p> <div> <img alt="thank you for purchase" src="https://wordpress-fantasy.s3.amazonaws.com/wp-content/uploads/2020/07/21183159/undraw_successful_purchase_uyin-1024x701.png" style="width:98%; filter: sepia(5%) hue-rotate(250deg)" /> </div> </div> <div style="text-align: left; background-color: #E6E6E6; padding: 0; border-radius: 0 0 10px 10px;"> <p style="font-weight: bold; color: #353353;font-size: 1.4em; margin:0 0 0 1em; padding-top: 1em;"> Important Security Notice: </p> <p style="margin-left: 1em;color: #353353; font-size: 1.3em;"> mnTaska never asks for your password or other sensitive information by email. Do not click links or respond to a suspicious email! </p> <p style="margin-left: 1em;color: #353353; font-size: 1.3em;"> Do not reply to this email! This message was generated automaticly. </p> <p style="margin-left: 1em;color: #353353;padding-bottom: 1em; font-size: 1.3em;"> &copy; mnTasks 2021 </p> </div> </div>`,
    };

    sgMail.send(msg);
    res.send({ message: 'Awesome!', correct: true });
  } catch (e) {
    res.send({ message: e });
  }
});

router.get('/api/todos', async (req, res) => {
  const todos = await Todo.find({ userId: req.session.user._id });
  res.status(200).send(todos);
});

router.post('/api/delete', async (req, res) => {
  const userToDelete = await Users.deleteOne({ _id: req.session.user._id });
  const deleteUserTasks = await Todo.deleteMany({
    userId: req.session.user._id,
  });

  delete req.session.user;
  res.clearCookie('user');
  res.send('logged out');
});

router.get('/api/userpanel', async (req, res) => {
  try {
    const userInfo = await Users.find({ _id: req.session.user._id });
    res.send({ correct: true, user: userInfo, credits: userInfo[0].credits });
  } catch (e) {
    res.send(e);
  }
});

router.post('/api/changeStatusTask', async (req, res) => {
  const { idTask } = req.body;
  // const myId = JSON.parse(req.body.idTask);
  const newStatusTask = await Todo.updateOne(
    { _id: idTask },
    {
      $set: {
        complete: 'Completed',
        finishedDate: Date.now(),
      },
    }
  );
  res.send({ message: 'New status of task' });
});

router.post('/api/message', (req, res) => {
  const { error } = messageValidation(req.body);
  if (error) return res.send({ message: error.details[0].message });

  const { Subject, Email, Message } = req.body;

  sgMail.setApiKey(
    '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'
  );
  const msg = {
    to: 'mntasks@interia.pl',
    from: 'mntasks@interia.pl',
    subject: Email,
    html: ` <div style="font-family:Verdana;margin: 0 auto; padding: 0; max-width: 90%; align-items: center; justify-content: center; flex: 1 1 100%; flex-flow: column wrap; border-radius: 10px; color: #353353; font-size: 10px; "> <h3 style=" max-width: 100%; background-color: #1db95e; color: #fff; font-size: 3em; padding: 1em 0 1em 1em; border-radius: 10px 10px 0 0; margin: 0; "> mnTasks </h3> <div style="text-align: left; color: #353353;font-size: 1.1em; background-color: #f9f9f9"> <h5 style=" font-size: 2.4em; font-weight: 700; padding: 1em 0; margin: 0 0 0 0.5em;color: #353353; "> User message </h5> <p style="margin-left:1.3em; font-size:1.3em">From: <span style="font-weight:700">${req.body.Email}</span></p> <p style="margin-left:1.3em; font-size:1.3em">Message: ${req.body.Message}</p> </div> </div>`,
  };

  sgMail.send(msg);

  res.status(200).send({ message: 'Your email has been send', correct: true });
});

module.exports = router;
