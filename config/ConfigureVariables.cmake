set(SUBSTANCE_EXTENSION_SOURCE_DIR ${PROJECT_SOURCE_DIR}/app/extension)

IF (NOT APPLE AND UNIX)

  # use pkg-config module to configure webkit-1.0
  include(FindPkgConfig)
  pkg_check_modules (webkit webkit-1.0 REQUIRED)

  # use wxWidgets configuration as described here: http://wiki.wxwidgets.org/CMake
  include(FindwxWidgets)
  FIND_PACKAGE(wxWidgets COMPONENTS core base webview REQUIRED)
  include("${wxWidgets_USE_FILE}")

ENDIF () # NOT APPLE AND UNIX
