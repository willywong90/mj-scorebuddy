// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// init sqlite db
var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

function createId() {
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

const createScoringTable = function() {
  db.run('CREATE TABLE Scoring (Fan INTEGER, Win INTEGER, SelfTouch INTEGER)');
  console.log('New table Scoring created!');

  // insert default scoring
  db.run('INSERT INTO Scoring (Fan, Win, SelfTouch) VALUES (3, 32, 16), (4, 64, 32), (5, 96, 48), (6, 128, 64), (7, 192, 96), (8, 256, 128)');
  console.log('Scoring table ready.');
}

// if ./.data/sqlite.db does not exist, create it
db.serialize(function(){
  if (!exists) {
    createScoringTable();
    db.run('CREATE TABLE ScoreHistory (GameId TEXT, Player TEXT, Score INTEGER)'); 
    db.run('CREATE TABLE GameHistory (GameId TEXT, Created TEXT)'); 
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/getFan', function(request, response) {
  db.all('SELECT Fan from Scoring', function(err, rows) {
    response.send(JSON.stringify(rows));
  });
});

app.get('/getGames', function(request, response) {
  db.all('SELECT * from GameHistory', function(err, rows) {
    response.send(JSON.stringify(rows));
  }); 
});

app.route('/new')
  .get(function(request, response) {
    response.sendFile(__dirname + '/views/new-game.html');
  })
  .post(function(request, response) {
    const gameId = createId();
    const player1 = request.body.player1;
    const player2 = request.body.player2;
    const player3 = request.body.player3;
    const player4 = request.body.player4;
    
    db.run(`INSERT INTO GameHistory (GameId, Created) VALUES ("${gameId}", datetime('now'))`);
    db.run(`INSERT INTO ScoreHistory (GameId, Player, Score) VALUES ("${gameId}", "${player1}", ${0}), ("${gameId}", "${player2}", ${0}), ("${gameId}", "${player3}", ${0}), ("${gameId}", "${player4}", ${0})`);

    console.log(`mj-scorebuddy: created game ${gameId}`);
    response.send({ url: '/game/' + gameId });
  });

app.get('/game/:gameId?', function (request, response) {
  const gameId = request.params.gameId;
  
  if (gameId) {
    const sql = `SELECT GameId from GameHistory WHERE GameId = "${gameId}"`;
    db.all(sql, function(err, rows) {
      if (rows.length > 0) {
        response.sendFile(__dirname + '/views/game.html');
      } else {
        response.redirect('/new');
      }
    });
  } else {
    response.redirect('/new');
  }
})

app.get('/resetGame/:gameId?', function(request, response) {
  const gameId = request.params.gameId;
  
  if (gameId) {
    const sql = `Delete from ScoreHistory WHERE GameId = "${gameId}"`;
    db.all(sql, function(err, rows) {
      if (err) {
        response.send(err);
      } else {
        response.send({ status: 'OK', message: 'mj-scorebuddy: new game state initiated.' });
      }
    });
  }
});

app.get('/getPlayers/:gameId?', function(request, response) {
  const gameId = request.params.gameId;
  
  if (gameId) {
    const sql = `SELECT DISTINCT Player from ScoreHistory WHERE GameId = "${gameId}" ORDER BY Player`;
    db.all(sql, function(err, rows) {
      response.send(JSON.stringify(rows));
    });
  }
});

app.get('/getScore/:gameId?', function(request, response) {
  const gameId = request.params.gameId;
  
  if (gameId) {
    const sql = `SELECT Player, SUM(Score) AS Score from ScoreHistory WHERE GameId = "${gameId}" GROUP BY Player ORDER BY Score Desc`;
    db.all(sql, function(err, rows) {
      response.send(JSON.stringify(rows));
    });
  }
});

app.post('/updateScore/:gameId', function(request, response) {
  const gameId = request.params.gameId;
  const winner = request.body.winner;
  const loser = request.body.loser;
  const selfTouch = request.body.selfTouch;
  const fan = request.body.fan;
  const players = request.body.players;
  let sql = 'INSERT INTO ScoreHistory (GameId, Player, Score) Values ';

  db.get('SELECT Win, SelfTouch from Scoring Where Fan = ?', fan, function(err, row, fields) {
    if (err) {
    } else {
      if (selfTouch) {
        let values = [];
        
        for (var i = 0; i < players.length; i++) {
          let valueString = '';
          
          if (players[i] === winner) {
            valueString = `("${gameId}", "${winner}", ${(row.SelfTouch * 3)})`;
          } else {
            valueString = `("${gameId}", "${players[i]}", ${(row.SelfTouch *-1)})`;
          }
          
          values.push(valueString);
        }
        
        sql = sql + values.join(', ');
      } else {
        sql = sql + `("${gameId}", "${winner}", ${row.Win}), ("${gameId}", "${loser}", ${(row.Win * -1)})`;
      }
      
      db.run(sql);
      
      response.send({ status: 'OK', message: 'mj-scorebuddy: game scores updated.' });
    }
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
