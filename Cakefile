fs            = require 'fs'
util           = require 'util'
{spawn, exec} = require 'child_process'

config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'))

# ANSI terminal colors.
red   = ''  # '\033[0;31m'
green = ''  # '\033[0;32m'
reset = ''  # '\033[0m'

# Commands
compressionCmd = (module) ->
  "java -jar ./lib/compiler.jar --js public/javascripts/#{module}.js --js_output_file public/javascripts/#{module}.min.js"

lessCmd = "lessc styles/main.less"

# Run a CoffeeScript through the node/coffee interpreter.
run = (args) ->
  proc =         spawn 'bin/coffee', args
  proc.stderr.on 'data', (buffer) -> puts buffer.toString()
  proc.on        'exit', (status) -> process.exit(1) if status != 0

# Log a message with a color.
log = (message, color, explanation) ->
  console.log "#{color or ''}#{message}#{reset} #{explanation or ''}"


buildStyles = (cb) ->
  exec lessCmd, (err, stdout, stderr) ->
    if (err)
      log stderr, red
    else
      fs.writeFileSync('./dist/composer.css', stdout, 'utf8')

# Build from source
build = (cb) ->
  buildStyles()
  # buildScripts()

  # Build Client
  content = 'Substance Composer'
  fs.writeFileSync('./dist/composer.js', 'here_comes_teh_content', 'utf8')
  cb()

task 'build', 'Rebuild from source', ->
  build ->
    log 'Sucessfully built dist/composer.js and dist/composer.min.js', green
  # exec compressionCmd('substance'), (err, stdout, stderr) ->
  #   throw err if err
  #   log 'Sucessfully built public/javascripts/substance.js and public/javascripts/substance.min.js', green
    
  # exec compressionCmd('data'), (err, stdout, stderr) ->
  #   throw err if err
  #   log 'Sucessfully built public/javascripts/data.js and public/javascripts/data.min.js', green

