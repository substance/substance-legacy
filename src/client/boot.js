// The global graph instance
var graph = new Data.Graph(seed, {dirty: false, syncMode: 'push'}).connect('ajax'); // The database

$(function () {
  if (!s.util.browserSupported()) {
    $('#container').html(s.util.tpl('browser_not_supported'));
    $('#container').show();
    return;
  }
  
  // Start the engines
  window.app = new s.views.Application({ el: $('#container') });
  
  // Set up a global instance of the Proper Richtext Editor
  window.editor = new Proper();
  
  // Initialize router
  window.router = new s.Router({});
  
  // Start responding to routes
  Backbone.history.start({ pushState: true });
  
  // Prevent exit when there are unsaved changes
  window.onbeforeunload = confirmExit;
  function confirmExit() {
    if (graph.dirtyNodes().length>0) return "You have unsynced changes, which will be lost.";
  }
   
  function resetWorkspace() {
    confirm('There are conflicted or rejected nodes since the last sync. The workspace will be reset for your own safety. Keep in mind we do not yet support simultaneous editing of one document.');
    window.location.reload(true);
  }
  
  window.pendingSync = false;
  graph.bind('dirty', function() {
    // Reload document browser
    if (!pendingSync) {
      pendingSync = true;
      setTimeout(function() {
        $('#sync_state').fadeIn(100);
        graph.sync(function(err) {
          pendingSync = false;
          if (!err) {
            setTimeout(function() {
              $('#sync_state').fadeOut(100);
            }, 1500);
          } else {
            resetWorkspace();
          }
        });
      }, 3000);
    }
  });
});
