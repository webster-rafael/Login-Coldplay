require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(cors());

// Config Json
app.use(express.json());

// Models
const User = require('./models/User');

// Public route
app.get('/', (req, res) => {
  res.status(200).json({ msg: 'Bem Vindo ao Meu Servidor' });
});

// Private Route
app.get('/user/:id', checkToken, async (req, res) => {
  const id = req.params.id;

  // check if user exists
  const user = await User.findById(id, '-password');

  if (!user) {
    return res.status(404).json({ msg: 'Usuário não encontrado' });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ msg: 'Acesso Negado!' });
  }

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (error) {
    res.status(400).json({ msg: 'Token Inválido' });
  }
}

// Register User
app.post('/auth/register', async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  // validations
  if (!name) {
    return res.status(422).json({ msg: 'O nome é Obrigatório!' });
  }

  if (!email) {
    return res.status(422).json({ msg: 'O email é Obrigatório!' });
  }

  if (!password) {
    return res.status(422).json({ msg: 'A senha é Obrigatória' });
  }

  if (password !== confirmpassword) {
    return res.status(422).json({ msg: 'As senhas não conferem!' });
  }

  // check if user exists
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: 'Esse e-mail já foi cadastrado' });
  }

  // create password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // create User
  const user = new User({
    name,
    email,
    password: passwordHash,
  });

  try {
    await user.save();

    res.status(201).json({ msg: 'Usuário criado com sucesso' });
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ msg: 'Houve um erro no Servidor, tente novamente mais tarde' });
  }
});

// login User

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // validations

  if (!email) {
    return res.status(422).json({ msg: 'O email é Obrigatório!' });
  }

  if (!password) {
    return res.status(422).json({ msg: 'A senha é Obrigatória' });
  }

  // check if user exists
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: 'Usuário não encontrado' });
  }

  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(422).json({ msg: 'Senha Inválida' });
  }

  try {
    const secret = process.env.SECRET;

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res
      .status(200)
      .json({ msg: 'Autenticação realizada com sucesso', token });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: 'Houve um erro no Servidor, tente novamente mais tarde',
    });
  }
});

// Credentials

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

(async () => {
    try {
      await mongoose.connect(
        `mongodb+srv://${dbUser}:${dbPassword}@cluster0.7vaoq0p.mongodb.net/?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true }
      );
  
      console.log('Conectado ao Banco de Dados');
  
      app.listen(3000, () => {
        console.log('Servidor rodando na porta 3000');
      });
    } catch (error) {
      console.error('Erro de conexão com o Banco de Dados:', error);
    }
  })();
  
