const express = require('express')
// require('dotenv').config()
const app = express();
const cors = require('cors')

// const pool = require('./db')

// const isProduction = process.env.NODE_ENV === 'production'
// const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

const { pool } = require('./config')

app.use(express.json());

// Configure CORS to allow requests from Netlify and Vercel
const corsOptions = {
  origin: [
    'https://better-jeopardy.netlify.app',
    'http://localhost:3000', // For local development
    'http://localhost:3001', // Alternative local port
    /\.vercel\.app$/, // Allow all Vercel domains
    /\.netlify\.app$/ // Allow all Netlify domains
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

app.locals.title = 'Better Jeopardy API';
// app.locals.questions = pool.query

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to database');
    release();
  }
});

app.get('/', (request, response) => {
  response.status(200).send(`Welcome to the ${app.locals.title}`)
});

app.get('/api/v1/questions', (request, response) => {
  let questions;
  pool.query('SELECT * FROM questions', (err, res) => {
    console.log(res);
    if (err) {
      console.log(err)
      return response.status(500).json({ error: 'Database error', details: err.message });
    }
    questions = res.rows;
    response.status(200).send({questions})
  })
});

app.get('/api/v1/questions/:id', (request, response) => {
  const { id } = request.params;

  let questions;
  pool.query('SELECT * FROM questions', (err, res) => {
    if (err) {
      console.log(err)
      return err;
    }
    questions = res.rows;
    const match = questions.find(question => question.question_id == id);
    if (!match) return response.status(404).json({message: `No idea found with an id of ${id}`});
    return response.status(200).json(match);
  })
});

app.get('/api/v1/past-games', (request, response) => {
  let pastGames;
  pool.query('SELECT * FROM pastGames', (err, res) => {
    if (err) {
      console.log(err)
      return err;
    }
    pastGames = res.rows;
    response.status(200).send({pastGames})
  })
});

app.get('/api/v1/past-games/:id', (request, response) => {
  const { id } = request.params;

  let past;
  pool.query('SELECT * FROM pastGames', (err, res) => {
    if (err) {
      console.log(err)
      return err;
    }
    past = res.rows;
    const match = past.find(game => game.game_id == id);
    if (!match) return response.status(404).json({message: `No idea found with an id of ${id}`});
    return response.status(200).json(match);
  })
});


app.post('/api/v1/past-games', (request, response) => {
  let pastGame = request.body;

  let allPastGames;
  pool.query('SELECT * FROM pastGames', (err, res) => {
    if (err) {
      console.log(err)
      return err;
    }
    // allPastGames = res.rows.length;
    pastGame.id = res.rows.length + 1
    pool.query(
      'INSERT INTO pastGames (game_id, questions, date, name, score) VALUES ($1, $2, $3, $4, $5)',
      [pastGame.id, JSON.stringify(pastGame.questions), pastGame.date, pastGame.name, pastGame.score],
      (err, res) => {
        if (err) {
          console.log(err)
          return response.status(422)
        }
      response.status(201).json({status: 'success', message: 'Game added.'})
    })
  })

  // pastGame.id = allPastGames.length + 1
  // pool.query(
  //   'INSERT INTO pastGames (game_id, questions, date, name, score) VALUES ($1, $2, $3, $4, $5)',
  //   [pastGame.id, JSON.stringify(pastGame.questions), pastGame.date, pastGame.name, pastGame.score],
  //   (err, res) => {
  //     if (err) {
  //       console.log(err)
  //       return response.status(422)
  //     }
  //   response.status(201).json({status: 'success', message: 'Game added.'})
  // })
});


app.listen(process.env.PORT || 3006, () => {
  console.log(`Server listening`)
})
//
// app.listen(3001, () => {
//   console.log(`${app.locals.title} has started on port 3001`)
// })
