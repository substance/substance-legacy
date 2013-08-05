import subprocess
import os

def git_pull(root, module):
  module_dir = os.path.join(root, module["folder"])

  if not os.path.exists(module_dir):
    print("Cloning sub-module: %s" %module["folder"])

    parent_dir, name = os.path.split(module_dir)

    if not os.path.exists(parent_dir):
      print("Creating folder: %s" %parent_dir)
      os.makedirs(parent_dir)

    cmd = ["git", "clone", "-b", module["branch"], module["repository"], name]
    p = subprocess.Popen(cmd, cwd=parent_dir)
    p.communicate()

  else:
    cmd = ["git", "pull"]
    print("Pulling sub-module: %s, (%s)" %(module["folder"], " ".join(cmd)))
    p = subprocess.Popen(cmd, cwd=module_dir)
    p.communicate()

def git_push(root, module):
  module_dir = os.path.join(root, module["folder"])

  print("Pushing sub-module: %s" %module["folder"])
  cmd = ["git", "push", "origin", module["branch"]]
  p = subprocess.Popen(cmd, cwd=module_dir)
  p.communicate()

def git_checkout(root, module, args):
  module_dir = os.path.join(root, module["folder"])

  branch = module["branch"]
  if args['checkout'] != True:
    branch = args['checkout']

  print("git checkout", branch)
  cmd = ["git", "checkout", branch]
  p = subprocess.Popen(cmd, cwd=module_dir)
  p.communicate()

def git_command(root, module, argv):
  module_dir = os.path.join(root, module["folder"])

  cmd = ["git"] + argv
  print("git command: ", cmd)
  p = subprocess.Popen(cmd, cwd=module_dir)
  p.communicate()

def git_status(root, module, porcelain=True):
  cmd = ["git", "status"]
  if porcelain:
    cmd.append("--porcelain")
  p = subprocess.Popen(cmd, stdout=subprocess.PIPE, cwd=os.path.join(root, module["folder"]))
  out, err = p.communicate()

  name = os.path.basename(module["folder"])
  if name == ".":
    name = "Mama Mia!"

  if len(out) > 0:

    print("%s" %name)
    print("--------\n")
    print(out)
