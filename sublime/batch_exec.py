from __future__ import generators

import sublime, sublime_plugin
import os, sys
import thread
import subprocess
import functools
import time

# TODO: is it possible to import ProcessListener and AsyncProcess from Default.exec ?

class ProcessListener(object):
    def on_data(self, proc, data):
        pass

    def on_finished(self, proc):
        pass

# Encapsulates subprocess.Popen, forwarding stdout to a supplied
# ProcessListener (on a separate thread)
class AsyncProcess(object):

    def __init__(self, arg_list, env, listener,
            # "path" is an option in build systems
            path="",
            # "shell" is an options in build systems
            shell=False):

        self.listener = listener
        self.killed = False

        self.start_time = time.time()

        # Hide the console window on Windows
        startupinfo = None
        if os.name == "nt":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        # Set temporary PATH to locate executable in arg_list
        if path:
            old_path = os.environ["PATH"]
            # The user decides in the build system whether he wants to append $PATH
            # or tuck it at the front: "$PATH;C:\\new\\path", "C:\\new\\path;$PATH"
            os.environ["PATH"] = os.path.expandvars(path).encode(sys.getfilesystemencoding())

        proc_env = os.environ.copy()
        proc_env.update(env)
        for k, v in proc_env.iteritems():
            proc_env[k] = os.path.expandvars(v).encode(sys.getfilesystemencoding())

        self.proc = subprocess.Popen(arg_list, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, startupinfo=startupinfo, env=proc_env, shell=shell)

        if path:
            os.environ["PATH"] = old_path

        if self.proc.stdout:
            thread.start_new_thread(self.read_stdout, ())

        if self.proc.stderr:
            thread.start_new_thread(self.read_stderr, ())

    def kill(self):
        if not self.killed:
            self.killed = True
            self.proc.terminate()
            self.listener = None

    def poll(self):
        return self.proc.poll() == None

    def exit_code(self):
        return self.proc.poll()

    def read_stdout(self):
        while True:
            data = os.read(self.proc.stdout.fileno(), 2**15)

            if data != "":
                if self.listener:
                    self.listener.on_data(self, data)
            else:
                self.proc.stdout.close()
                if self.listener:
                    self.listener.on_finished(self)
                break

    def read_stderr(self):
        while True:
            data = os.read(self.proc.stderr.fileno(), 2**15)

            if data != "":
                if self.listener:
                    self.listener.on_data(self, data)
            else:
                self.proc.stderr.close()
                break

class BatchExecCommand(sublime_plugin.WindowCommand, ProcessListener):

    def run(self, commands = [], callbackCmd = None, callbackArgs = None, encoding = "utf-8"):

        if not hasattr(self, 'output_view'):
            # Try not to call get_output_panel until the regexes are assigned
            self.output_view = self.window.get_output_panel("exec")

        self.window.get_output_panel("exec")

        self.commands = commands
        self.callbackCmd = callbackCmd
        self.callbackArgs = callbackArgs
        self.encoding = encoding

        self.proc = None

        sublime.status_message("Executing")
        self.window.run_command("show_panel", {"panel": "output.exec"})

        self.stepper = self.__stepper__()
        self.stepper.next()

    def __stepper__(self):

        err_type = OSError
        if os.name == "nt":
            err_type = WindowsError

        for command in self.commands:
            try:
                cmd = command['cmd']
                working_dir = command['working_dir']

                # Default the working_dir to the current files directory if no working directory was given
                if (working_dir == "" and self.window.active_view()
                                and self.window.active_view().file_name()):
                    working_dir = os.path.dirname(self.window.active_view().file_name())

                # Change to the working dir, rather than spawning the process with it,
                # so that emitted working dir relative path names make sense
                if working_dir != None and working_dir != "":
                    os.chdir(working_dir)

                self.append_data("%s $ %s\n"%(working_dir, " ".join(cmd))) 
                self.proc = AsyncProcess(cmd, {}, self)
                yield self

            except err_type as e:
                print "%s"%(str(e))
                self.append_data(str(e) + "\n")
                self.append_data("[cmd:  " + str(commands) + "]\n")
                self.append_data("[dir:  " + str(os.getcwdu()) + "]\n")
                if "PATH" in merged_env:
                    self.append_data("[path: " + str(merged_env["PATH"]) + "]\n")
                else:
                    self.append_data("[path: " + str(os.environ["PATH"]) + "]\n")

                self.append_data("[Finished]\n")

        # finally call a registered callback command
        if not self.callbackCmd == None:
          print("Executing callback: %s"%self.callbackCmd)
          self.window.run_command(self.callbackCmd, self.callbackArgs)

    def append_data(self, data):

        try:
            str = data.decode(self.encoding)
        except:
            str = "[Decode error - output not " + self.encoding + "]\n"

        # Normalize newlines, Sublime Text always uses a single \n separator
        # in memory.
        str = str.replace('\r\n', '\n').replace('\r', '\n')

        selection_was_at_end = (len(self.output_view.sel()) == 1
            and self.output_view.sel()[0]
                == sublime.Region(self.output_view.size()))
        self.output_view.set_read_only(False)
        edit = self.output_view.begin_edit()
        self.output_view.insert(edit, self.output_view.size(), str)
        if selection_was_at_end:
            self.output_view.show(self.output_view.size())
        self.output_view.end_edit(edit)
        self.output_view.set_read_only(True)

    def finish(self, proc):
        elapsed = time.time() - proc.start_time
        exit_code = proc.exit_code()
        if exit_code == 0 or exit_code == None:
            self.append_data(("[Finished in %.1fs]\n") % (elapsed))
        else:
            self.append_data(("[Finished in %.1fs with exit code %d]\n") % (elapsed, exit_code))

        try:
            self.stepper.next()
        except:
            pass

    def on_data(self, proc, data):
        sublime.set_timeout(functools.partial(self.append_data, data), 0)

    def on_finished(self, proc):
        sublime.set_timeout(functools.partial(self.finish, proc), 0)
