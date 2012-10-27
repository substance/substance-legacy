PROJECT(substance)
CMAKE_MINIMUM_REQUIRED(VERSION 2.8.4)

SET(SUBSTANCE_VERSION "0.5.0")

IF(UNIX)
  FIND_PATH(JSC_INCLUDE_DIR "JavaScriptCore/JavaScriptCore.h" "/usr/include/webkitgtk-1.0")
  SET(JSC_LIBS javascriptcoregtk-1.0)
  SET(JSC_INCLUDE_DIRS ${JSC_INCLUDE_DIR})

  # need a wxWidget version with JSC extensions enabled
  # this is currently only available at git@github.com:oliver----/wxWidgets.git
  # branch: webview_jsc_extensions
  # TODO: this stuff should finally land in the wxWidgets trunk...
  SET(WXWIDGETS_DIR "" CACHE PATH "Path to wxWidgets.")
  
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
    ${WXWIDGETS_DIR}/../include
    ${WXWIDGETS_DIR}/lib/wx/include/gtk2-unicode-2.9 
  )
  
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

  set(WXWIDGETS_LIB_DIRS ${WXWIDGETS_DIR}/lib)


  # NOTE: could not get it working with these...
  #execute_process(COMMAND pkg-config --cflags webkit-1.0
  #    OUTPUT_VARIABLE WEBKIT_COMPILE_FLAGS
  #    OUTPUT_STRIP_TRAILING_WHITESPACE
  #)
  #execute_process(COMMAND pkg-config --libs webkit-1.0
  #    OUTPUT_VARIABLE WEBKIT_LINK_FLAGS
  #    OUTPUT_STRIP_TRAILING_WHITESPACE
  #)

  #IF(EXISTS ${WXWIDGETS_DIR})
  #  execute_process(COMMAND ./wx-config --cxxflags
  #      WORKING_DIRECTORY ${WXWIDGETS_DIR}
  #      OUTPUT_VARIABLE WXWIDGETS_COMPILE_FLAGS
  #      OUTPUT_STRIP_TRAILING_WHITESPACE
  #  )
  #  execute_process(COMMAND ./wx-config --libs
  #      WORKING_DIRECTORY ${WXWIDGETS_DIR}
  #      OUTPUT_VARIABLE WXWIDGETS_LINK_FLAGS
  #      OUTPUT_STRIP_TRAILING_WHITESPACE
  #  )
  #ENDIF()

ENDIF()

ADD_SUBDIRECTORY(app)

