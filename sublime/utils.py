import json
import os
import types

MODULES_CONFIG = ".modules.config"

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

def read_config(path):
  with open(path, 'r') as f:
    return as_object(json.load(f))
