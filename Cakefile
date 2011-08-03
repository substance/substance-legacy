# Build script adpated from http://github.com/jashkenas/coffee-script/Cakefile
# ==============================================================================

fs            = require 'fs'
sys           = require 'sys'
CoffeeScript  = require 'coffee-script'
{spawn, exec} = require 'child_process'

config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'))
settings = JSON.parse(fs.readFileSync(__dirname+ '/settings.json', 'utf-8'))

# ANSI terminal colors.
red   = '\033[0;31m'
green = '\033[0;32m'
reset = '\033[0m'

# Commands
compressionCmd = (module) ->
  "java -jar ./lib/compiler.jar --js public/javascripts/#{module}.js --js_output_file public/javascripts/#{module}.min.js"

couchPushCmd = "cd couch && couchapp push #{config.couchdb_url} && cd .."

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
  content += fs.readFileSync("src"+file)+'\n' for file in settings.scripts.source
  fs.writeFileSync('./public/javascripts/substance.js', content, encoding='utf8')
  
  # Build Data.js
  content = ''
  content += fs.readFileSync(file)+'\n' for file in ['lib/data/data.js', 'lib/data/adapters/ajax_adapter.js']
  fs.writeFileSync('./public/javascripts/data.js', content, encoding='utf8')

task 'build', 'Rebuild from source', ->
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
