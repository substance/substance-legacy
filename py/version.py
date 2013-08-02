import os
import re
import json
import sys

from util import config_file, read_json, write_json, MODULE_CONFIG_FILE

VERSION_EXPRESSION = re.compile("(\d+)\.(\d+)\.(\d+)(.*)")

class SemanticVersion():

  def __init__(self, str):

    match = VERSION_EXPRESSION.match(str)

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
    print("Config file does not contain version: %s"%filename)
    return None

  version = SemanticVersion(config["version"]);
  version.increment(level)

  config["version"] = version.str();

  print ("Writing new version: %s"%(version.str()))
  write_json(config_file(folder), config)


def git_command(cwd, args):

  cmd = ["git"] + args
  print("git command: ", cmd)
  if (True):
    return
  
  p = subprocess.Popen(cmd, cwd=cwd)
  p.communicate()

def bump_version(folder, config):

  filename = config_file(folder)
  if not "version" in config:
    print "Could not find version in config of %s"%(folder)
    return None
  version = str(config["version"])

  git_command(folder, ["add", MODULE_CONFIG_FILE])
  git_command(folder, ["commit", "-m", 'Bumped version to %s'%version])

git_version_str = "git+%s#%s"

def replace_deps(config, table, deps, tag=None, github=False):
  if not deps in config: return

  for dep in config[deps]:
    if dep in table:
      version = tag if tag != None else table[dep]["version"]
      if github:
        version = git_version_str%(table[dep]["repository"]["url"], version)

      print("Replacing dependency: %s = %s"%(dep, version))
      config[deps][dep] = version


def create_package(folder, config, table, tag=None, github=True):

  if not "version" in config:
    print "Could not find version in config of %s"%(folder)
    return None

  git_command(folder, ["checkout", "-b", "release"])
  git_command(folder, ["merge", "master"])

  replace_deps(config, table, "dependencies", tag, github)
  replace_deps(config, table, "devDependencies", tag, github)

  filename = os.path.join(folder, "package.json")
  #write_json(filename, config)
  print("Writing %s"%(filename))
  print(json.dump(config, sys.stdout))
