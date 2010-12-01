# Build script adpated from http://github.com/jashkenas/coffee-script/Cakefile
# ==============================================================================

fs            = require 'fs'
sys           = require 'sys'
CoffeeScript  = require 'coffee-script'
{spawn, exec} = require 'child_process'

# ANSI terminal colors.
red   = '\033[0;31m'
green = '\033[0;32m'
reset = '\033[0m'

# Commands
compressionCmd = 'java -jar ./lib/compiler.jar --js substance.js --js_output_file substance.min.js'
couchPushCmd = 'cd couch && couchapp push http://substance.cloudant.com/development && cd ..'


# Substance source files
files = [
  
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
  content = ''
  content += fs.readFileSync(file)+'\n' for file in files
  fs.writeFileSync('./unveil.js', content, encoding='utf8')

# Watch a source file for changes
watch = (file) ->
  fs.watchFile file, {persistent: true, interval: 300}, (curr, prev) ->
    return if curr.mtime.getTime() is prev.mtime.getTime()
    build()
    log "Sucessfully rebuilt ./unveil.js at #{curr.mtime}", green  

# task 'build:continuously', 'Build continuously (during development)', ->
#   watch(file) for file in files
# 
# 
# task 'build', 'Rebuild from source', ->    
#   build()
#   log 'Sucessfully built ./unveil.js', green


# task 'build:full', 'Rebuild and create a compressed version', ->
#   build()
#   exec compressionCmd, (err, stdout, stderr) ->
#     throw err if err
#     log 'Sucessfully built ./unveil.js and ./unveil.min.js', green

task 'couch:push', 'Push design documents to the CouchDB instance', ->
  exec couchPushCmd, (err, stdout, stderr) ->
    throw err if err
    log 'Successfully pushed the CouchApp', green
