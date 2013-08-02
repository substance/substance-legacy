#!/usr/bin/python
import argparse
import os
import sys

__dirname__ = os.path.dirname(os.path.realpath(__file__));
sys.path.append(os.path.join(__dirname__, "py"));

from util import as_object, read_config, read_json
from git import git_pull, git_push, git_checkout, git_command, git_status
from npm import npm_publish, npm_build, npm_symlinks

class Actions():

  @staticmethod
  def status(root, config, args=None):
    for m in config.modules:
      git_status(root_dir, m)

  @staticmethod
  def symlinks(root, config, args=None):
    for m in config.modules:
      npm_symlinks(root, m)

  @staticmethod
  def pull(root, config, args=None):
    for m in config.modules:
      git_pull(root_dir, m)

  @staticmethod
  def push(root, config, args=None):
    for m in config.modules:
      git_push(root_dir, m)

  @staticmethod
  def checkout(root, config, args=None):
    for m in config.modules:
      git_checkout(root_dir, m, args)

  @staticmethod
  def git(root, config, args=None):
    for m in config.modules:
      git_command(root_dir, m, args)

  @staticmethod
  def publish(root, config, args=None):
    for m in config.modules:
      npm_publish(root_dir, m, args)

  @staticmethod
  def build(root, config, args=None):
    for m in config.modules:
      npm_build(root_dir, m)

  @staticmethod
  def update(root, config, args=None):
    pull(root, config, args)
    symlinks(root, config, args)
    build(root, config, args)

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

method = getattr(Actions, action)
method(root_dir, config, args)
