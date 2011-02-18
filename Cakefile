# Build script adpated from http://github.com/jashkenas/coffee-script/Cakefile
# ==============================================================================

fs            = require 'fs'
sys           = require 'sys'
CoffeeScript  = require 'coffee-script'
{spawn, exec} = require 'child_process'

config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'))

# ANSI terminal colors.
red   = '\033[0;31m'
green = '\033[0;32m'
reset = '\033[0m'

# Commands
compressionCmd = (module) ->
  "java -jar ./lib/compiler.jar --js public/javascripts/#{module}.js --js_output_file public/javascripts/#{module}.min.js"

couchPushCmd = "cd couch && couchapp push #{config.couchdb_url} && cd .."


# Substance source files
files = [  
  "src/client/notifier.js"
  "src/client/helpers.js"
  "src/client/renderers/html_renderer.js"
  "src/client/node_editors/document_editor.js"
  "src/client/node_editors/section_editor.js"
  "src/client/node_editors/text_editor.js"
  "src/client/node_editors/quote_editor.js"
  "src/client/node_editors/code_editor.js"
  "src/client/node_editors/question_editor.js"
  "src/client/node_editors/answer_editor.js"
  "src/client/node_editors/image_editor.js"
  "src/client/controllers/application.js"
  
  "src/client/ui/common.js"
  "src/client/ui/string_editor.js"
  "src/client/ui/multi_string_editor.js"
  
  "src/client/views/document.js"
  "src/client/views/attributes.js"
  
  "src/client/commands.js"
  "src/client/views/document_browser.js"
  "src/client/views/facets.js"
  "src/client/views/collaborators.js"
  "src/client/views/user_settings.js"
  "src/client/views/new_document.js"
  "src/client/views/browser_tab.js"
  "src/client/views/header.js"
  "src/client/views/application.js"
]

# Run a CoffeeScript through the node/coffee interpreter.
run = (args) ->
  proc =         spawn 'bin/coffee', args
  proc.stderr.on 'data', (buffer) -> puts buffer.toString()
  proc.on        'exit', (status) -> process.exit(1) if status != 0

# Log a message with a color.
log = (message, color, explanation) ->
  console.log "#{color or ''}#{message}#{reset} #{explanation or ''}"

# Build from source
build = ->
  # Build Client
  content = ''
  content += fs.readFileSync(file)+'\n' for file in files
  fs.writeFileSync('./public/javascripts/substance.js', content, encoding='utf8')
  
  # Build Data.js
  content = ''
  content += fs.readFileSync(file)+'\n' for file in ['lib/data/data.js', 'lib/data/adapters/ajax_adapter.js']
  fs.writeFileSync('./public/javascripts/data.js', content, encoding='utf8')

# Watch a source file for changes
watch = (file) ->
  fs.watchFile file, {persistent: true, interval: 300}, (curr, prev) ->
    return if curr.mtime.getTime() is prev.mtime.getTime()
    build()
    log "Sucessfully rebuilt public/javascripts/substance.js at #{curr.mtime}", green  

task 'build:continuously', 'Build continuously (during development)', ->
  build()
  watch(file) for file in files

task 'build', 'Rebuild from source', ->    
  build()
  log 'Sucessfully built public/javascripts/substance.js', green

task 'build:full', 'Rebuild and create a compressed version', ->
  build()
  exec compressionCmd('substance'), (err, stdout, stderr) ->
    throw err if err
    log 'Sucessfully built public/javascripts/substance.js and public/javascripts/substance.min.js', green
    
  exec compressionCmd('data'), (err, stdout, stderr) ->
    throw err if err
    log 'Sucessfully built public/javascripts/data.js and public/javascripts/data.min.js', green

task 'couch:push', 'Push design documents to the CouchDB instance', ->
  exec couchPushCmd, (err, stdout, stderr) ->
    throw err if err
    log 'Successfully pushed the CouchApp', green
