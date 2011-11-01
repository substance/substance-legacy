// fyi, 'this' is a 'section' on the page
// you can reach the controls you declared via 'this.$('css-selector')'

var GistEditor = Backbone.View.extend({
  // rather use jQuery's event system than this one
  events: {},
  
  // hold a ref to the jQueryified controls
  controls: {
    url: null,
    lineStart: null,
    lineEnd: null,
    code: null,
    editInC9: null,
    file: null,
    selectFile: null,
    selectFileDdl: null
  },
  
  state: {
    cache: {},
    fileCache: {},
    currentRepo: null
  },
  
  initialize: function () {
      var that = this;
      
      function bindControls (controls) {
          var node = app.document.selectedNode.data;
          
          controls.url = that.$('.url').val(node.url);
          controls.lineStart = that.$('.line_start').val(node.line_start);
          controls.lineEnd = that.$('.line_end').val(node.line_end);
          controls.code = that.$('.snippet').val(node.snippet);
          controls.editInC9 = that.$('.edit-in-c9 a');
          controls.file = that.$('.file').val(node.file);
          controls.selectFile = that.$('.select-file');
          controls.selectFileDdl = that.createDropdown();
          
          // default content
          if(!controls.code.html()) {
              controls.code.html('/* Create a repository on http://gist.github.com first and paste the URL in the input field */');
          }
          
          // now bind codeMirror to it
          that.bindCodeMirror(controls.code);
      }
      
      function bindEvents (controls) {
          var onBlurUpdate = controls.url.add(controls.lineStart).add(controls.lineEnd).add(controls.file);
          onBlurUpdate.blur(function () { 
              that.update();
          });
          
          controls.file.change(function () {
              // when changing the select button thingy, clear out the line numbers
              controls.lineStart.val('');
              controls.lineEnd.val('');
              
              // set the dropdown button
              controls.selectFile.text($(this).val());
              
              that.update();
          });
          
          // show/hide the select file button
          controls.selectFile.click(function () {
              controls.selectFileDdl.toggle();
          });
          
          that.update();
      }
      
      this.state.currentRepo = null;
      
      bindControls(this.controls);
      bindEvents(this.controls);
  },
  
  update: function () { 
      var controls = this.controls;
      
      controls.selectFileDdl.hide();
      
      this.getGist(controls.url.val(), controls.file.val(), this.updateGistRawContent);
      
      // when the url changes, update data.js
      app.document.updateSelectedNode({
        url: controls.url.val(),
        'file': controls.file.val(),
        'line_start': controls.lineStart.val(),
        'line_end': controls.lineEnd.val()
      });
      
      controls.editInC9.attr({
          href: 'http://localhost:5000/open/gist/' 
          + '?url=' + this.trim(controls.url.val())
          + '&file=' + this.trim(controls.file.val())
          + '&line_start=' + this.trim(controls.lineStart.val())
          + '&line_end=' + this.trim(controls.lineEnd.val())
      });
  },
  
  updateGistRawContent: function (content, controls) {      
        // select the correct lines, Git uses Unix line endings by default, so we only have to deal with the '\n' char
        var snippet = content, ix;
        var startingLine = parseInt(controls.lineStart.val() || 0, 10), endingLine = parseInt(controls.lineEnd.val() || 0, 10);
        
        if (startingLine) {
            for(ix = 1; ix < startingLine; ix++) {
                // this probably can be faster
                var newLineIndex = snippet.indexOf('\n');
                
                if (newLineIndex === -1) break;
                
                snippet = snippet.substring(newLineIndex + 1);
            }
        }
        
        if (endingLine) {
            var ending = 0;
            for(ix = 0; ix < endingLine - startingLine + 1; ix++) {
                var c = snippet[ending], reachedEndOfFile = false;
                while(snippet[++ending] !== '\n') {
                    if(ending === snippet.length) {
                        reachedEndOfFile = true;
                        break;
                    }
                }
                
                if (reachedEndOfFile) break;
            }
            if (ending) {
                snippet = snippet.substring(0, ending);
            }
        }
        
        // send a callback to data.js to update the current node
        // we store the snippet also in couchDb because you don't want to query GitHub every time someone views this
        app.document.updateSelectedNode({
            snippet: snippet
        });
        
        // update the syntax highlighting plugin
        var codeMirror = controls.code.data('codemirror');
        codeMirror.setOption('firstLineNumber', startingLine || 1);
        codeMirror.setValue(snippet);
  },
  
  updateFileList: function (files, controls) {
      var curVal = controls.file.val();
      
      // remove current options
      controls.file.find('option').remove();
      
      for(var ix = 0, file = files[ix]; ix < files.length; file = files[++ix]) {
          controls.file.append($('<option>').val(file).text(file));
      }
      
      controls.file.val(curVal);
      
      this.updateDropdown();
  },
  
  createDropdown: function () {
      if (this.$('ul.select-file-ddl').length) {
          return this.$('ul.select-file-ddl');
      }
      
      var ele = $('<ul>').addClass('select-file-ddl').hide();
      this.controls.selectFile.after(ele);
      
      return ele;
  },
  
  updateDropdown: function () {
      var controls = this.controls;
      var ddl = controls.selectFileDdl;
      ddl.find('li').remove();
      
      var curVal = controls.file.val();
      
      controls.file.find('option').each(function (ix, el) {
          var $el = $(el),
              li = $('<li>').append($('<a>').text($el.text()).attr('data-value', $el.val()).attr('href', '#'));
                
          if ($el.val() === curVal) {
              li.addClass('selected');
          }
          ddl.append(li);
      });
      
      if (controls.file.find('option').length === 1) {
          controls.selectFile.text(controls.file.find('option:first').text());
      }
      
      // bind click events
      controls.selectFileDdl.find('li a').click(function() {
          controls.file.val($(this).attr('data-value')).change(); // change doesnt fire; do manual
          return false;
      });   
  },
  
  getGist: function (publicCloneUrl, file, callback) {
      var that = this;
      
      publicCloneUrl = that.trim(publicCloneUrl);
      
      // if the file list is still in cache, then update UI
      if (publicCloneUrl !== that.state.currentRepo && that.state.fileCache[publicCloneUrl]) {
          that.updateFileList(that.state.fileCache[publicCloneUrl], that.controls);
          that.state.currentRepo = publicCloneUrl;
      }
      
      var cacheKey = publicCloneUrl + file;
      
      // if the gist is in cache, then return that
      if (file && that.state.cache[cacheKey]) {
          callback(that.state.cache[cacheKey], that.controls);
          return;
      }
      
      // retrieve the gist id from the public repo url
      var gitUrlMatch = that.trim(publicCloneUrl).match(/\/(\d+)\.git$/);
      
      if (!gitUrlMatch) {
          that.onNonGithubUrl();
          return;
      }
      
      var gistId = gitUrlMatch[1];
      
      // grab all files available in this gist repo
      // what are we going to do with multiple files in a gist?
      $.getJSON('https://gist.github.com/api/v1/json/' + gistId + '?callback=?', function (data) {

          // read them files, put them in cache, and then update the UI
          var fileCollection = data.gists[0].files;
          that.state.fileCache[publicCloneUrl] = fileCollection;
          
          if (publicCloneUrl !== that.state.currentRepo) {
                that.updateFileList(fileCollection, that.controls);
                that.state.currentRepo = publicCloneUrl;
          }
          
          // no file selected? then just ditch it (except if ur the only one)
          file = file || (fileCollection.length === 1 ? fileCollection[0] : null);
          
          if (!file) return;
          
          // retrieve file contents
          var rawUrl = 'https://raw.github.com/gist/:id/:file'.replace(/:id/, gistId).replace(/:file/, file);
          var proxy = '/proxy/json?url=:url&callback=?'.replace(/:url/, encodeURIComponent(rawUrl));
          
          // we use a proxy in node.js that can read the https file and get it back via jsonp
          $.getJSON(proxy, function (rawFileContent) {
               if (!that.state.cache[cacheKey]) {
                   that.state.cache[cacheKey] = rawFileContent;
               }
               callback(rawFileContent, that.controls);
          });
      });
  },
  
  trim: function (str) {
      if (!str) {
          return str;
      }
      
      // if native, then use that one
      if (String.prototype.trim) {
          return str.trim();   
      }
      
      // otherwise do regexp
      return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  },
  
  bindCodeMirror: function (el) {
      // bind code mirror to a textarea.
      // the default way of doing this in substance is not really generic
      // so we move this into the plugin where it belongs
      var escape = function (str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');
      };
  
      el = $(el);
      
      // prevent doing it twice
      if (!el.data('codemirror')) {
            var cm = CodeMirror.fromTextArea(el.get(0), {
                  mode: 'javascript',
                  lineNumbers: true,
                  theme: 'elegant',
                  indentUnit: 2,
                  indentWithTabs: false,
                  tabMode: 'shift',
                  readOnly: true,
                  onBlur: function () {
                    cm.setSelection({line:0,ch:0}, {line:0,ch:0});
                  }
            });
            setTimeout(function () { cm.refresh(); }, 10);
            
            // store the data so we can get the instance back from the element
            el.data('codemirror', cm);
      }
      
      return el.data('codemirror'); 
  },
    
    onNonGithubUrl: function () {
        // event placeholder
    }
});
