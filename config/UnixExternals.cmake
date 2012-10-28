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

SET(WXWIDGETS_EPBASE ${PROJECT_BINARY_DIR}/lib/wxWidgets)
SET(WXWIDGETS_DIR ${WXWIDGETS_EPBASE}/src/wxWidgets)
SET(WXWIDGETS_BUILD_DIR ${WXWIDGETS_EPBASE}/src/wxWidgets-build)
SET(WXWIDGETS_INSTALL_DIR ${WXWIDGETS_EPBASE}/install)

#### Download and Build
# TODO: let user decide if to do that automatically...
#       it takes quite a long time, which is annoying if it is retriggered unintentionally
OPTION(SKIP_WXWIDGETS_BUILD "Skip wxWidgets build" ON)
if(NOT EXISTS ${WXWIDGETS_EPBASE}/src/wxWidgets-stamp/wxWidgets-install)
  message("Could find stamp for wxWisgets install. Forcing re-build.")
  set(SKIP_WXWIDGETS_BUILD OFF CACHE BOOL "Skip wxWidgets build" FORCE)
endif()

if(SKIP_WXWIDGETS_BUILD)
  set(WXWIDGETS_CONFIGURE_COMMAND  "")
  set(WXWIDGETS_BUILD_COMMAND "")
else()
  set(WXWIDGETS_CONFIGURE_COMMAND  /bin/sh <SOURCE_DIR>/configure --prefix=${WXWIDGETS_INSTALL_DIR})
  set(WXWIDGETS_BUILD_COMMAND make)
endif()
ExternalProject_Add(wxWidgets
  PREFIX ${WXWIDGETS_EPBASE}
  URL https://github.com/downloads/oliver----/wxWidgets/wxWidgetsJSC.tar.gz
  CONFIGURE_COMMAND "${WXWIDGETS_CONFIGURE_COMMAND}"
  BUILD_COMMAND "${WXWIDGETS_BUILD_COMMAND}"
)

#### Variables for includes and libraries

# TODO: extract these using wx-condfig
SET(WXWIDGETS_INCLUDE_DIRS
  /usr/include/webkitgtk-1.0
  /usr/include/glib-2.0
  /usr/lib/x86_64-linux-gnu/glib-2.0/include
  /usr/include/gtk-2.0
  /usr/lib/x86_64-linux-gnu/gtk-2.0/include
  /usr/include/libsoup-2.4
  /usr/include/atk-1.0
  /usr/include/cairo
  /usr/include/gdk-pixbuf-2.0
  /usr/include/pango-1.0
  /usr/include/gio-unix-2.0/
  /usr/include/pixman-1
  /usr/include/freetype2
  /usr/include/libpng12
  /usr/include/libxml2
  ${WXWIDGETS_DIR}/include
  ${WXWIDGETS_BUILD_DIR}/lib/wx/include/gtk2-unicode-2.9
)

set(WXWIDGETS_LIB_DIRS ${WXWIDGETS_BUILD_DIR}/lib)
set(WXWIDGETS_LIBS
  wx_gtk2u_xrc-2.9
  wx_gtk2u_webview-2.9
  wx_gtk2u_html-2.9
  wx_gtk2u_qa-2.9
  wx_gtk2u_adv-2.9
  wx_gtk2u_core-2.9
  wx_baseu_xml-2.9
  wx_baseu_net-2.9
  wx_baseu-2.9
)
