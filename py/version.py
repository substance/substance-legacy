import os
import re
import json
import sys
import subprocess

from util import module_file, read_json, write_json, MODULE_CONFIG_FILE

VERSION_EXPRESSION = re.compile("(\d+)\.(\d+)\.(\d+)(.*)")
git_version_str = "git+%s#%s"

class SemanticVersion():

  def __init__(self, versionStr):

    match = VERSION_EXPRESSION.match(versionStr)

    if (not match):
      raise RuntimeError("Could not parse version string: %s"%(str))

    self.major = int(match.group(1))
    self.minor = int(match.group(2))
    self.patch = int(match.group(3))

  def increment(self, level):
    if level == "patch":
      self.patch = self.patch + 1
    elif level == "minor":
      self.patch = 0
      self.minor = self.minor + 1
    elif level == "major":
      self.patch = 0
      self.minor = 0
      self.major = self.major + 1

  def str(self):
    return "%d.%d.%d"%(self.major, self.minor, self.patch)

def increment_version(folder, config, level):
  # - iterate through all projects
  # - read the VERSION file and compare to previous version (given)
  # - if equal, automatically increase the version (on the given level)
  # - overwrite the VERSION

  if not "version" in config:
    print("Could not find 'version' in config of %s"%folder)
    return None

  version = SemanticVersion(config["version"]);
  version.increment(level)

  config["version"] = version.str();

  print ("Writing new version: %s"%(version.str()))
  write_json(module_file(folder), config)


def git_command(cwd, args):

  cmd = ["git"] + args
  print("git command: ", cmd)
  p = subprocess.Popen(cmd, cwd=cwd)
  return p.communicate()

def bump_version(folder, config):

  #filename = module_file(folder)
  if not "version" in config:
    print "Could not find version in config of %s"%(folder)
    return None
  version = str(config["version"])

  git_command(folder, ["add", MODULE_CONFIG_FILE])
  git_command(folder, ["commit", "-m", 'Bumped version to %s'%version])

def replace_deps(config, table, deps, tag=None, github=True):
  if not deps in config: return

  deps = config[deps]

  # Note: table contains either module specifications
  # such as:
  #      "substance-data": {
  #        "repository": "git@github.com:michael/data.git",
  #        "folder": "node_modules/substance-data",
  #        "branch": "master"
  #      }
  #
  # or it specifies a version of a npm module, e.g.:
  #      "underscore": "1.5.x"

  for dep in deps:

    # if the dependency is registered globally
    if dep in table:
      module = table[dep]
      if isinstance(module, basestring):
        version = module
      else:
        version = tag if tag != None else module["branch"]
        # in case we have a module specification it is possible to create
        # the dependency entry as "git+https"
        if github:
          if not "repository" in module:
            raise RuntimeError("Invalid module specification: %s"%(module));
          version = git_version_str%(module["repository"]["url"], version)

      print("Replacing dependency: %s = %s"%(dep, version))
      deps[dep] = version

    # in this case there is no global specification
    # and the local specification is mandatory
    else:
      if deps[dep] == "":
        raise RuntimeError("Incomplete specification %s in %s"%(dep, config["name"]));

def create_package(folder, config, table, tag=None, github=True):
  """
    Creates 'package.json' based on 'module.json'.
  """

  replace_deps(config, table, "dependencies", tag, github)
  replace_deps(config, table, "devDependencies", tag, github)

  filename = os.path.join(folder, "package.json")
  print("Writing %s"%(filename))
  write_json(filename, config)

def create_tag(folder, config, table, tag=None, github=True):
  """
    Creates a new release tag.

    1. Checksout the release branch and brings it up-to-date.
    2. Creates package.json and commits it.
    3. Creates a new tag.
  """

  if not "version" in config:
    print "Could not find version in config of %s"%(folder)
    return None

  git_command(folder, ["checkout", "-b", "release"])
  git_command(folder, ["merge", "master"])

  create_package(folder, config, table, tag, github)

  tag = tag if tag != None else config["version"]

  # commit the change
  filename = os.path.join(folder, "package.json")
  git_command(folder, ["add", filename])
  git_command(folder, ["commit", "-m", 'Created package.json for version %s'%(tag)])
  git_command(folder, ["tag", "-a", tag, "-m", 'Version %s.'%(tag)])


def save_current_version(modules_iter):
  current_version={}
  for folder, conf in modules_iter:
    HEAD = git_command(folder, ["rev-parse", "HEAD"])
    current_version[conf["name"]] = HEAD
  
  write_json(".version.snapshot.json", current_version)

def restore_last_version(modules_iter):
  last_version = read_json(".version.snapshot.json")
  for folder, conf in modules_iter:
    HEAD = last_version[conf["name"]]
    git_command(folder, ["reset", "--hard", HEAD])
