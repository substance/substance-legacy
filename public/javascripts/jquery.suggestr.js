/*
 * Suggestr - the dead simple autocompleter for jQuery
 * Author: Honza Pokorny
 * Usage: $('#input').suggestr(['John', 'Peter', 'Mark']);
 * URL: https://github.com/honza/suggestr.js
 * License: BSD
 *
 */

(function($) {
  
  var keyMap = {
    up: 38,
    down: 40,
    enter: 13
  };

  var activeCss = {
    listStyle: 'none',
    backgroundColor: '#ececec'
  };

  var inactiveCss = {
    listStyle: 'none',
    backgroundColor: '#fff'
  };

  var boxCss = {
    width: '200px',
    position: 'absolute'
  };

  $.fn.suggestr = function(data) {
    
    // Remove old sht
    $('#suggestr-div').remove();
    
    var ui, that, value;
    that = this;

    ui = $('<div id="suggestr-div"></div>');
    ui.css(boxCss);
    ui.data('active', 0);

    ui.delegate('li', 'mouseover', function() {
      $(this).css(activeCss);
    });

    ui.delegate('li', 'mouseout', function() {
      $(this).css(inactiveCss);
    });

    ui.delegate('li', 'click', function() {
      var val = $(this).text();
      that.val(val);
      reset();
    });

    function moveSelection(direction) {
      var index = ui.data('active');
      if (direction == keyMap.up)
        var newIndex = index - 1;
      else
        var newIndex = index + 1;
      if (-1 < newIndex && newIndex < ui.children().length) {
        ui.children().each(function(i, item) {
          $(item).css(inactiveCss);
        });
        $(ui.children()[newIndex]).css(activeCss);
        ui.data('active', newIndex);
      }
    }

    function reset() {
      ui.data('active', 0);
      ui.children().remove();
    }
    
    this.keyup(function(k) {
      
      console.log(data);
      if (k.keyCode == keyMap.enter) {
        var val = $(ui.children()[ui.data('active')]).text();
        that.val(val);
        reset();
        return;
      }

      if (k.keyCode == keyMap.up || k.keyCode == keyMap.down) {
        moveSelection(k.keyCode);
        return false;
      }

      ui.children().remove();

      value = that.val().toLowerCase();

      if (!value.length)
        return;

      $.each(data, function(index, item) {
        if (item.toLowerCase().indexOf(value) > -1) {
          var regx = new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + value + ")(?![^<>]*>)(?![^&;]+;)", "gi");
          item = item.replace(regx, "<strong>$1</strong>");
          var x = $('<li>' + item + '</li>');
          $(x).css(inactiveCss);
          ui.append(x);
        }
      });
    
      that.after(ui);
      ui.children().first().css(activeCss);

    });

  };

})(jQuery);