# Configure UNIX specific projects:
# =================================
#
#   - JavaScriptCore from WebkitGTK
#   - wxWidgets with feature for JSC extensions
#

# JavaScriptCore
# --------------

FIND_PATH(JSC_INCLUDE_DIR "JavaScriptCore/JavaScriptCore.h" "/usr/include/webkitgtk-1.0")
SET(JSC_LIBS javascriptcoregtk-1.0)
SET(JSC_INCLUDE_DIRS ${JSC_INCLUDE_DIR})


# wxWidgets
# ---------

# SET(WXWIDGETS_EPBASE ${PROJECT_BINARY_DIR}/src/wxWidgets)
# SET(WXWIDGETS_DIR ${WXWIDGETS_EPBASE}/src/wxWidgets)
# SET(WXWIDGETS_BUILD_DIR ${WXWIDGETS_EPBASE}/src/wxWidgets-build)
# SET(WXWIDGETS_INSTALL_DIR ${WXWIDGETS_EPBASE}/install)
# 
# #### Download and Build
# # TODO: let user decide if to do that automatically...
# #       it takes quite a long time, which is annoying if it is retriggered unintentionally
# OPTION(SKIP_WXWIDGETS_BUILD "Skip wxWidgets build" ON)
# if(NOT EXISTS ${WXWIDGETS_EPBASE}/src/wxWidgets-stamp/wxWidgets-install)
#   message("Could not find stamp for wxWidgets install. Forcing re-build.")
#   set(SKIP_WXWIDGETS_BUILD OFF CACHE BOOL "Skip wxWidgets build" FORCE)
# endif()
# 
# if(SKIP_WXWIDGETS_BUILD)
#   set(WXWIDGETS_CONFIGURE_COMMAND  "")
#   set(WXWIDGETS_BUILD_COMMAND "")
# else()
#   set(WXWIDGETS_CONFIGURE_COMMAND  /bin/sh <SOURCE_DIR>/configure --prefix=${WXWIDGETS_INSTALL_DIR})
#   set(WXWIDGETS_BUILD_COMMAND make)
# endif()
# ExternalProject_Add(wxWidgets
#   PREFIX ${WXWIDGETS_EPBASE}
#   URL https://github.com/downloads/oliver----/wxWidgets/wxWidgetsJSC.tar.gz
#   CONFIGURE_COMMAND "${WXWIDGETS_CONFIGURE_COMMAND}"
#   BUILD_COMMAND "${WXWIDGETS_BUILD_COMMAND}"
# )
