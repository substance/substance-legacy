PROJECT(substance)
CMAKE_MINIMUM_REQUIRED(VERSION 2.8.4)

SET(SUBSTANCE_VERSION "0.5.0")

IF(UNIX)
  # need a wxWidget version with JSC extensions enabled
  # this is currently only available at git@github.com:oliver----/wxWidgets.git
  # branch: webview_jsc_extensions
  # TODO: this stuff should finally land in the wxWidgets trunk...
  SET(WXWIDGETS_DIR "" CACHE PATH "Path to wxWidgets." FORCE)

  FIND_PATH(JSC_INCLUDE_DIR "JavaScriptCore/JavaScriptCore.h" "/usr/include/webkitgtk-1.0")
ENDIF()

ADD_SUBDIRECTORY(app)
