// client-side js

let gameId = '';
let players = [];

function getPlayers() {
  return $.get('/getPlayers/' + gameId, function(data) {
    const playerData = JSON.parse(data);
    
    playerData.forEach(function(row) {
      players.push(row.Player);
      $('.dropdown-players').append('<option value="' + row.Player + '">' + row.Player + '</option>');
    });
  });
}

function getFan() {
  return $.get('/getFan', function(data) {
    const fan = JSON.parse(data);
    
    fan.forEach(function(row) {
      $('.dropdown-fan').append('<option value="' + row.Fan + '">' + row.Fan + '</option>');
    });
  });
}

function getScore() {
  return $.get('/getScore/' + gameId, function(data) {
    const scores = JSON.parse(data);
    if (scores.length > 0) {
      $('#scoresheet').html('');
      scores.forEach(function(score) {
        $('#scoresheet').append('<div class="score-row">' + score.Player + ': ' + score.Score + '</div>');
      });
    } else {
      $('#scoresheet').html('<div>no scores');
    }
  });
}

function isFormValid() {
  const loserName = $('#loser').val();
  const isSelfTouch = document.forms[0].elements['selfTouch'].checked;
  
  if (!loserName && !isSelfTouch) {
    return false;
  } else {
    return true;
  }
}

function resetForm() {
  const form = document.forms[0];
  form.elements['winner'].selectedIndex = 0;
  form.elements['loser'].value = '';
  form.elements['fan'].selectedIndex = 0;
  form.elements['selfTouch'].checked = false;
  $('#winner').change();
}

function getGameId() {
  return window.location.pathname.replace('/game/', '');
}

$(document).ready(function() {
  gameId = getGameId();
  getScore();
  getFan();
  getPlayers().then(function() {
    resetForm();
  });
  
  $('.gameid').html(gameId);
  
  // gameid click callback
  $('.gameid').click(function() {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(window.location.protocol + '//' + window.location.host + '/game/' + $(this).html()).select();
    document.execCommand("copy");
    $temp.remove();
  });
  
  // new game button callback
  $('#reset-game').click(function(e) {
    e.preventDefault();
    
    $.get('/resetGame/' + gameId, function(data) {
      if (data.status == 'OK') {
        resetForm();
        getScore();
      } else {
        console.log(data.message);
      }
    });
  });
  
  // submit button callback
  $('#add-score').click(function(e) {
    e.preventDefault();
    
    if (isFormValid()) {
      const data = {
        winner: $('#winner').val(),
        loser: $('#loser').val(),
        selfTouch: $('#selfTouch').is(':checked'),
        fan: $('#fan').val(),
        players: players
      };
      console.log(data);
      
      $.ajax({
          url: '/updateScore/' + gameId,
          type: 'POST',
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(data)
      }).done(function() {
        resetForm();
        getScore();
      });
    } else {
      alert('Please select a loser');
    }
  });
  
  $('#winner').change(function() {
    $('#loser').val('');
    $('#loser option').show();
    $('#loser option[value=' + $(this).val() + ']').hide();
  });
});
