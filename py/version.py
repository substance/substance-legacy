import os
import re

VERSION_EXPRESSION = re.compile("(\d+)\.(\d+)\.(\d+)(.*)")

class SemanticVersion():

  def __init__(self, str):

    match = VERSION_EXPRESSION.match(str)

    if (not match):
      raise RuntimeError("Could not parse version string: %s"%(str))

    self.major = int(match.group(1))
    self.minor = int(match.group(2))
    self.patch = int(match.group(3))

  def compare(self, other):
    if (self.major != other.major):
      return self.major - other.major;
    if (self.minor != other.minor):
      return self.minor - other.minor;
    if (self.minor != other.minor):
      return self.patch - other.patch;
    return 0

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

def increment_version(root, module, level, previousVersion=None):
  # - iterate through all projects
  # - read the VERSION file and compare to previous version (given)
  # - if equal, automatically increase the version (on the given level)
  # - overwrite the VERSION

  filename = os.path.join(root, module.folder, "VERSION")

  if not os.path.exists(filename):
    print("VERSION does not exist in %s"%(module.folder))
    return None

  with open(filename, 'r') as f:
    VERSION = f.read()

  version = SemanticVersion(VERSION);

  # if (version.compare(previousVersion) != 0):
  #   return version
  # else:
  #   version.increment(level)

  version.increment(level)

  print ("Writing new version: %s"%(version.str()))
