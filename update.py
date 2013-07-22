#!/usr/bin/python
import argparse
import json
import os
import subprocess
import types

# Converts a dict into a dynamic object
class DictObject(dict):

  def __init__(self, d):
    self.update(d)

  def __getattr__(self, name):
    if not self.has_key(name):
      return None
    return self[name]

def as_object(d):
  if type(d) is types.DictType:
    d = DictObject(d)
    for key in d.iterkeys():
      d[key] = as_object(d[key])
  elif type(d) is types.ListType or type(d) is types.TupleType:
    for idx,elem in enumerate(d):
      d[idx] = as_object(d[idx])

  return d


def read_config():
  with open(".modules.config", 'r') as f:
    return as_object(json.load(f))

def read_json(filename):
  with open(filename, 'r') as f:
    return as_object(json.load(f))

def git_pull(root, module):
  module_dir = os.path.join(root, module.folder)

  if not os.path.exists(module_dir):
    print("Cloning sub-module: %s" %module.folder)

    parent_dir, name = os.path.split(module_dir)

    if not os.path.exists(parent_dir):
      print("Creating folder: %s" %parent_dir)
      os.makedirs(parent_dir)

    cmd = ["git", "clone", "-b", module.branch, module.repository, name]
    p = subprocess.Popen(cmd, cwd=parent_dir)
    p.communicate()

  else:
    cmd = ["git", "pull", "origin", module.branch]
    print("Pulling sub-module: %s, (%s)" %(module.folder, " ".join(cmd)))
    p = subprocess.Popen(cmd, cwd=module_dir)
    p.communicate()

def git_push(root, module):
  module_dir = os.path.join(root, module.folder)

  print("Pushing sub-module: %s" %module.folder)
  cmd = ["git", "push", "origin", module.branch]
  p = subprocess.Popen(cmd, cwd=module_dir)
  p.communicate()

def git_checkout(root, module, args):
  module_dir = os.path.join(root, module.folder)

  branch = module.branch
  if args['checkout'] != True:
    branch = args['checkout']

  print("git checkout", branch)
  cmd = ["git", "checkout", branch]
  p = subprocess.Popen(cmd, cwd=module_dir)
  p.communicate()

def git_command(root, module, args):
  module_dir = os.path.join(root, module.folder)

  cmd = ["git"] + args["git"]
  print("git command: ", cmd)
  p = subprocess.Popen(cmd, cwd=module_dir)
  p.communicate()

def npm_publish(root, module, args):
  module_dir = os.path.join(root, module.folder)

  package_json = os.path.join(module_dir, "package.json")
  if os.path.exists(package_json):
    package = read_json(package_json)
    if not package.private:
      print("Publishing sub-module: %s" %module.folder)
      cmd = ["npm", "publish"]
      if (args['force'] == True):
        cmd.append("--force")
      p = subprocess.Popen(cmd, cwd=module_dir)
      p.communicate()

def git_status(root, module, porcelain=True):
  cmd = ["git", "status"]
  if porcelain:
    cmd.append("--porcelain")
  p = subprocess.Popen(cmd, stdout=subprocess.PIPE, cwd=os.path.join(root, module.folder))
  out, err = p.communicate()

  name = os.path.basename(module.folder)
  if name == ".":
    name = "Mama Mia!"

  if len(out) > 0:

    print("%s" %name)
    print("--------\n")
    print(out)

def create_symlink(root, source, link):
  source_path = os.path.join(root, source)
  link_path = os.path.join(root, link)

  if not os.path.exists(link_path):
    parent_dir = os.path.dirname(link_path)

    if not os.path.exists(parent_dir):
      print("Creating parent dir(s).")
      os.makedirs(parent_dir)

    # recreate broken links
    if os.path.islink(link_path):
      os.remove(link_path)

    print("Creating symlink: %s -> %s"%(link_path, source_path))
    os.symlink(source_path, link_path)

def npm_build(root, module):
  module_dir = os.path.join(root, module.folder)
  if os.path.exists(os.path.join(module_dir, "package.json")):
    print("Building node-module: %s" %module.folder)
    cmd = ["npm", "install"]
    p = subprocess.Popen(cmd, cwd=module_dir)
    p.communicate();

def status(root, config, args=None):
  for m in config.modules:
    git_status(root_dir, m)

def symlinks(root, config, args=None):
  for symlink in config.symlinks:
    if not symlink.links == None:
      for l in symlink.links:
        create_symlink(root_dir, symlink.source, l)
    else:
      create_symlink(root_dir, symlink.source, symlink.link)

def pull(root, config, args=None):
  for m in config.modules:
    git_pull(root_dir, m)

def push(root, config, args=None):
  for m in config.modules:
    git_push(root_dir, m)

def checkout(root, config, args=None):
  for m in config.modules:
    git_checkout(root_dir, m, args)

def git(root, config, args=None):
  for m in config.modules:
    git_command(root_dir, m, args)

def publish(root, config, args=None):
  for m in config.modules:
    npm_publish(root_dir, m, args)

def build(root, config, args=None):
  for m in config.modules:
    npm_build(root_dir, m)

def update(root, config, args=None):
  pull(root, config, args)
  symlinks(root, config, args)
  build(root, config, args)


actions = {
 "status": status,
 "symlinks": symlinks,
 "push": push,
 "pull": pull,
 "checkout": checkout,
 "publish": publish,
 "git": git,
 "build": build,
 "update": update
}

# Command line arguments
# ========

parser = argparse.ArgumentParser(description='Update the mothership.')

parser.add_argument('--pull', '-u', action='store_const', dest="action", const="pull", help='Pull all sub-modules.')
parser.add_argument('--push', '-p', action='store_const', dest="action", const="push", help='Push all sub-modules.')
parser.add_argument('--status', '-s', action='store_const', dest="action", const="status", help='Git status for all sub-modules.')
parser.add_argument('--symlinks', action='store_const', dest="action", const="symlinks", help='Create symbolic links.')
parser.add_argument('--build', action='store_const', dest="action", const="build", help='Build node-modules.')
parser.add_argument('--checkout', nargs='?', const=True, default=False, help='Checkout a given branch or the one specified in .modules.config')
parser.add_argument('--git', nargs='+', default=False, help='Execute a git command on all modules.')
parser.add_argument('--publish', action='store_const', dest="action", const="publish", help='Publish node-modules.')
parser.add_argument('--force', action='store_const', dest="force", const=True, default=False, help='Force.')

# Main
# ========

args = vars(parser.parse_args())

action = args['action']
if args['checkout']:
  action = "checkout"
elif args['git']:
  action = "git"
elif action == None:
  action = "update"
config = read_config()
root_dir = os.path.realpath(os.path.dirname(__file__))

actions[action](root_dir, config, args)
