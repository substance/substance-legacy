import subprocess
import os
from util import read_json

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

def npm_build(root, module):
  module_dir = os.path.join(root, module.folder)
  if os.path.exists(os.path.join(module_dir, "package.json")):
    print("Building node-module: %s" %module.folder)
    cmd = ["npm", "install"]
    p = subprocess.Popen(cmd, cwd=module_dir)
    p.communicate();

def npm_symlinks(root, module):
  module_dir = os.path.join(root, module.folder)
  module_config_file = os.path.join(module_dir, "package.json");
  if os.path.exists(module_config_file):
    module_config = read_json(module_config_file)

    deps = []

    if ("dependencies" in module_config):
      deps += [dep for dep in module_config.dependencies if dep.startswith("substance")]

    if ("devDependencies" in module_config):
      deps += [dep for dep in module_config.devDependencies if dep.startswith("substance")]

    for dep in deps:
      create_symlink(root, os.path.join("node_modules", dep), os.path.join(module_dir, "node_modules", dep))
