set(SUBSTANCE_EXTENSION_SOURCE_DIR ${PROJECT_SOURCE_DIR}/app/extension)

set(BOOST_INCLUDE_DIRS ${PROJECT_SOURCE_DIR}/ext/boost)

set(GTEST_INCLUDE_DIRS ${PROJECT_SOURCE_DIR}/ext/gtest/gtest/include)
set(GTEST_LIB_DIRS ${PROJECT_SOURCE_DIR}/ext/gtest/bin)
set(GTEST_LIBS gtest gtest_main)

set(HIREDIS_INCLUDE_DIRS ${PROJECT_SOURCE_DIR}/ext/hiredis/hiredis)
set(HIREDIS_LIB_DIRS "${PROJECT_SOURCE_DIR}/ext/hiredis/hiredis")
set(HIREDIS_LIBS libhiredis.a)

IF (NOT APPLE AND UNIX)

  # use pkg-config module to configure webkit-1.0
  include(FindPkgConfig)
  pkg_check_modules (webkit webkit-1.0 REQUIRED)

  # use wxWidgets configuration as described here: http://wiki.wxwidgets.org/CMake
  include(FindwxWidgets)
  FIND_PACKAGE(wxWidgets COMPONENTS core base webview REQUIRED)
  include("${wxWidgets_USE_FILE}")

ENDIF () # NOT APPLE AND UNIX
