import json
import os
import types
from collections import OrderedDict

MODULE_CONFIG_FILE = "module.json"

def config_file(root):
  return os.path.join(root, "module.json")

def read_json(filename):
  with open(filename, 'r') as f:
    data = f.read()
    return json.JSONDecoder(object_pairs_hook=OrderedDict).decode(data)

def write_json(filename, data):
  with open(filename, 'w') as f:
    json.dump(data, f, indent=2, separators=(',', ':'))

def read_config(root=None):
  if root == None:
    filename = MODULE_CONFIG_FILE
  else:
    filename = os.path.join(root, MODULE_CONFIG_FILE)

  if not os.path.exists(filename):
    raise RuntimeError("File does not exist: %s"%filename)

  return read_json(filename)
