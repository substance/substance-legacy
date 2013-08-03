#!/usr/bin/python
import argparse
import os
import sys

# TODO: next steps:
#   - Add shared module versions to table for package.json generation

__dirname__ = os.path.dirname(os.path.realpath(__file__));
sys.path.append(os.path.join(__dirname__, "py"));

from util import read_json, project_file, module_file
from git import git_pull, git_push, git_checkout, git_command, git_status
from npm import npm_publish, npm_install
from version import increment_version, bump_version, create_package

def get_module_config(root, module):
  folder = os.path.join(root, module["folder"])
  filename = module_file(folder)
  if not os.path.exists(filename):
    return None
  return read_json(filename)

def iterate_modules(root, config):
  for m in config["modules"]:
    conf = get_module_config(root, m)
    if conf == None: continue
    folder = os.path.join(root, m["folder"])
    yield [folder, conf]


def get_configured_deps(folder, conf):
  result = {}
  if "dependencies" in conf:
    for dep, version in conf["dependencies"].iteritems():
      if version != "":
        result[dep] = version

  if "devDependencies" in conf:
    for dep, version in conf["dependencies"].iteritems():
      if version != "":
        result[dep] = version

  return result

class Actions():

  @staticmethod
  def status(root, config, args=None):
    for m in config["modules"]:
      git_status(root_dir, m)

  @staticmethod
  def pull(root, config, args=None):
    for m in config["modules"]:
      git_pull(root_dir, m)

  @staticmethod
  def push(root, config, args=None):
    for m in config["modules"]:
      git_push(root_dir, m)

  @staticmethod
  def checkout(root, config, args=None):
    for m in config["modules"]:
      git_checkout(root_dir, m, args)

  @staticmethod
  def git(root, config, args=None):
    for m in config["modules"]:
      git_command(root_dir, m, args)

  @staticmethod
  def publish(root, config, args=None):
    for m in config["modules"]:
      npm_publish(root_dir, m, args)

  @staticmethod
  def update(root, config, args=None):
    # 1. Clone/pull all sub-modules
    Actions.pull(root, config, args)

    # 2. Install all shared node modules
    node_modules = config["node_modules"] if "node_modules" in config else {}
    for folder, conf in iterate_modules(root, config):
      node_modules.update(get_configured_deps(folder, conf))

    npm_install(root, node_modules)


  @staticmethod
  def increment_versions(root, config, args=None):
    level = args["increment_version"]
    for folder, conf in iterate_modules(root, config):
      increment_version(folder, conf, m, level)

  @staticmethod
  def tag(root, config, args=None):
    tag = args["tag"]

    table = {}
    for folder, conf in iterate_modules(root, config):
      table[conf["name"]] = conf
    if "node_modules" in config:
      table.update(config["node_modules"])

    for folder, conf in iterate_modules(root, config):
      if "npm" in config:
        conf.update(config["npm"])
      create_package(folder, conf, table, tag)

  @staticmethod
  def bump(root, config, args=None):
    for folder, conf in iterate_modules(root, config):
      bump_version(folder, conf, m)

# Command line arguments
# ========

parser = argparse.ArgumentParser(description='Update the mothership.')

parser.add_argument('--pull', '-u', action='store_const', dest="action", const="pull", help='Pull all sub-modules.')
parser.add_argument('--push', '-p', action='store_const', dest="action", const="push", help='Push all sub-modules.')
parser.add_argument('--status', '-s', action='store_const', dest="action", const="status", help='Git status for all sub-modules.')
parser.add_argument('--checkout', nargs='?', const=True, default=False, help='Checkout a given branch or the one specified in .modules.config')
parser.add_argument('--git', nargs='+', default=False, help='Execute a git command on all modules.')
parser.add_argument('--publish', action='store_const', dest="action", const="publish", help='Publish node-modules.')
parser.add_argument('--force', action='store_const', dest="force", const=True, default=False, help='Force.')
parser.add_argument('--increment-version', nargs='?', const="patch", default=False, help='Increment the VERSION files (default: patch level).')
parser.add_argument('--tag', nargs='?', const=None, default=False, help='Create a new branch taking the current module configurations.')
parser.add_argument('--bump', action='store_const', dest="action", const="bump", help='"Bump" the version by committing all (changed) module configurations')

# Main
# ========

args = vars(parser.parse_args())

print(args)

action = args['action']
if args['checkout'] != False:
  action = "checkout"
elif args['git'] != False:
  action = "git"
elif args['increment_version'] != False:
  action = "increment_versions"
elif args["tag"] != False:
  action = "tag"
elif action == None:
  action = "update"

root_dir = os.path.realpath(os.path.dirname(__file__))
project_config = read_json(project_file(root_dir))

method = getattr(Actions, action)
method(root_dir, project_config, args)
