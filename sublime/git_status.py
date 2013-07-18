import sublime, sublime_plugin
import subprocess
import os
import time
import re
from utils import read_config, MODULES_CONFIG

PACKAGE_SETTINGS = "SubstanceGit.sublime-settings"

MANAGERS = {}
NAME = ".Git.Status"

class GitStatusManager():


  def __init__(self, window, view):
    self.window = window
    self.view = view
    self.config = {}
    self.short = True
    self.settings = sublime.load_settings(PACKAGE_SETTINGS)
    self.entries = []

  def process_folder(self, folder, config):

    git_command = self.settings.get('git_command')
    cmd = [git_command, "status", "-b"]
    if self.short:
      cmd.append("-s")

    try:
      p = subprocess.Popen(cmd, stdout=subprocess.PIPE, cwd=folder)
      out, err = p.communicate()

      lines = out.splitlines()

      if self.short and len(lines) == 1 and not "..." in lines[0]:
        return None
      if out == None or out == "":
        return None
      else:
        return [folder, out]

    except OSError as err:
      print(err)
      return None

  def process_top_folder(self, folder):
    result = []
    config = self.config[folder]

    for m in config['data'].modules:
      module_dir = os.path.join(folder, m.folder)
      if not os.path.exists(module_dir):
        continue

      item = self.process_folder(module_dir, m)
      if not item == None:
        result.append(item)

    return result

  def load_config(self):
    # Check if we have to reload the config file
    for folder in self.window.folders():
      config_file = os.path.join(folder, MODULES_CONFIG)
      if not os.path.exists(config_file):
        continue

      if not folder in self.config or self.config[folder]['timestamp'] < os.path.getmtime(config_file):
        print("Loading config: %s"%config_file)
        self.config[folder] = {
          "timestamp": os.path.getmtime(config_file),
          "data": read_config(config_file)
        }

    return self.config

  def get_entry(self, pos):
    pos = pos.begin()
    folder = None

    for entry in self.entries:
      folder = entry[1]
      if (entry[0] > pos):
        break
    return folder

  def update(self):

    if self.view == None:
      return

    view = self.view

    self.load_config()
    self.window.focus_view(self.view)

    changes = []
    for folder in self.window.folders():
      if folder in self.config:
        changes.extend(self.process_top_folder(folder))

    # begin edit for adding content
    view.set_read_only(False)
    edit = view.begin_edit()

    self.entries = []

    # erase existent content
    all = sublime.Region(0, view.size()+1)
    view.erase(edit, all)

    if len(changes) == 0:
      view.insert(edit, view.size(), "Everything committed. Yeaah!\n")

    else:

      for folder, output in changes:
        entry = {"folder": folder}
        view.insert(edit, view.size(), "- %s:\n"%(folder))
        view.insert(edit, view.size(), "\n")
        view.insert(edit, view.size(), "%s\n"%output)
        view.insert(edit, view.size(), "\n")
        self.entries.append([view.size(), folder])

    view.end_edit(edit)

    # freeze the file
    view.set_read_only(True)
    view.set_scratch(True)

    view.sel().clear()
    view.sel().add(sublime.Region(0,0))
    view.show(0)

class GitStatusCommand(sublime_plugin.WindowCommand):

  def run(self):
    window = self.window
    views = filter(lambda x: x.name() == NAME, window.views())
    if len(views) == 0:
      view = window.new_file()
      view.set_name(NAME)
      view.settings().set('syntax', 'Packages/Substance/Status.tmLanguage')
    else:
      view = views[0]

    view.settings().set('command_mode', True)

    if not view.id() in MANAGERS:
      MANAGERS[view.id()] = GitStatusManager(window, view)

    MANAGERS[view.id()].update()

class GitGuiCommand(sublime_plugin.TextCommand):

  def __init__(self, view):
    self.view = view
    self.settings = sublime.load_settings(PACKAGE_SETTINGS)

  def run(self, edit):
    view = self.view

    if not view.id() in MANAGERS:
      return
    manager = MANAGERS[view.id()]

    pos = view.sel()[0]
    folder = manager.get_entry(pos)
    if folder == None:
      return

    cmd = self.settings.get("git_gui_command")
    # TODO: prepare command?

    print("Running %s in %s"%(str(cmd), folder))
    p = subprocess.Popen(cmd, cwd=folder)


class GitCommand(sublime_plugin.TextCommand):

  def __init__(self, view):
    self.view = view
    self.settings = sublime.load_settings(PACKAGE_SETTINGS)

  def execute(self, command, folders):

    if len(folders) == 0:
      return

    git = self.settings.get("git_command")

    commands = []
    git_pull = [git] + command

    for folder in folders:
      commands.append({"cmd": git_pull, "working_dir": folder})

    self.view.window().run_command("batch_exec", {
      "commands": commands,
      "callbackCmd": "git_status"
    })

  def run(self, edit, command, all=False):
    view = self.view

    if not view.id() in MANAGERS:
      return
    manager = MANAGERS[view.id()]

    pos = view.sel()[0]

    folders = []
    if all:
      config = manager.load_config()
      for topFolder in config:
        for m in config[topFolder]['data'].modules:
          folders.append(os.path.join(topFolder, m.folder))

    else:
      folder = manager.get_entry(pos)
      if folder != None:
        folders.append(folder)

    self.execute(command, folders)

class GitToggleStatusCommand(sublime_plugin.TextCommand):

  def run(self, edit):

    if not self.view.id() in MANAGERS:
      return
    manager = MANAGERS[self.view.id()]

    manager.short = not manager.short
    #self.view.window().run_command("git_status")
    manager.update()

class GitCommitListener(sublime_plugin.EventListener):

  def on_query_context(self, view, key, value, operand, match_all):
    if NAME == view.name() and key == "git_status":
      return True
    return None

  def on_activated(self, view):

    if not view.id() in MANAGERS:
      return

    manager = MANAGERS[view.id()]
    manager.update()
