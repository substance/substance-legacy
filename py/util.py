import json
import os
import types
from collections import OrderedDict

PROJECT_CONFIG_FILE = "project.json"
MODULE_CONFIG_FILE = "module.json"

def project_file(root):
  return os.path.join(root, PROJECT_CONFIG_FILE)

def module_file(root):
  return os.path.join(root, MODULE_CONFIG_FILE)

def read_json(filename):
  with open(filename, 'r') as f:
    try:
      data = f.read()
      return json.JSONDecoder(object_pairs_hook=OrderedDict).decode(data)
    except ValueError as ve:
      print("Could not parse file %s"%filename)
      print(ve)
      return None

def write_json(filename, data):
  with open(filename, 'w') as f:
    json.dump(data, f, indent=2, separators=(',', ': '))
