// DocumentComposer - Data-driven content authoring
(function() {
  
  $(function() {

    // Load a document
    // var doc = new ContentGraph(Document.EMPTY_DOC);
    
    // Start the engines
    var app = new DocumentComposer({el: $('#container')});
    
    // Initial rendering
    app.render();
    
    app.newDocument();
    
    // Load initial doc
    
    // Documents.fetch({
    //   success: function() {
    //     app.loadDocument('e59976ea3dca7ba11cffd2d5f20026b0');
    //   }
    // });
        
  });
  
})();
