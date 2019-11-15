function isFormValid() {
  let isValid = true;
  $('form input').each(function() {
    if ($(this).val() === '') {
      isValid = false;
    }
  });
  
  return isValid;
}

$(document).ready(function() {
  // submit button callback
  $('#start-game').click(function(e) {
    e.preventDefault();
    
    if (isFormValid()) {
      $.post('/new', $('form').serialize()).done(function(data) {
        window.location = data.url;
      });
    } else {
      alert('Please enter player names');
    }
  });
});
