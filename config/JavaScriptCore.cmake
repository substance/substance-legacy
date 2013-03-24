if(APPLE)

    find_library(JSC JavaScriptCore)

elseif(UNIX)

  FIND_PATH(JSC_INCLUDE_DIR "JavaScriptCore/JavaScriptCore.h" "/usr/include/webkitgtk-1.0")
  SET(JSC javascriptcoregtk-1.0)
  SET(JSC_INCLUDE_DIRS ${JSC_INCLUDE_DIR})

endif()
