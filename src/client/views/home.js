s.views.Home = Backbone.View.extend({

  events: {
    'click .watch-intro': 'watchIntro'
  },

  watchIntro: function() {
    $('#startpage .intro').height('400');
    $('#startpage .intro .intro-text').fadeOut();
    setTimeout(function() {
      $('#startpage .intro .video').html('<video autoplay width="920" height="400" controls><source src="http://substance.io/videos/substance_intro.mp4" type=\'video/mp4; codecs="avc1.42E01E, mp4a.40.2"\'><source src="http://substance.io/videos/substance_intro.ogv" type="video/ogg" /> </video>')
      setTimeout(function() {
        $('#startpage .intro .video').fadeIn();
      }, 400);
    }, 1000);
    
    return false;
  },

  render: function () {
    $(this.el).html(s.util.tpl('home', {}));
    
    // Load Flattr
    (function () {
      var s = document.createElement('script'), t = document.getElementsByTagName('script')[0];
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'http://api.flattr.com/js/0.6/load.js?mode=auto';
      t.parentNode.insertBefore(s, t);
    })();
    
    return this;
  }

});
