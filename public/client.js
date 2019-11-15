// client-side js

function getFan() {
  return $.get('/getFan', function(data) {
    const fan = JSON.parse(data);
    
    fan.forEach(function(row) {
      $('.dropdown-fan').append('<option value="' + row.Fan + '">' + row.Fan + '</option>');
    });
  });
}

function getGames() {
  return $.get('/getGames', function(data) {
    const games = JSON.parse(data);
    
    if (games.length > 0) {
      $('#game-list').html('');
      games.forEach(function(game) {
        const createdDate = new Date(game.Created + ' UTC');
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        
        $('#game-list').append(`<div class="game-list-row"><a href='/game/${game.GameId}'>${game.GameId.toUpperCase()}</a><span>${createdDate.toLocaleDateString("en-us", dateOptions)}</span></div>`);
      });
    } else {
      $('#game-list').html('no games started');
    }
  });
}

$(document).ready(function() {
  getGames();
  
  // new game button callback
  $('#new-game').click(function(e) {
    e.preventDefault();
    window.location = '/new';
  });
});
