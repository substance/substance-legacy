
if(APPLE)
# nothing to be done

elseif(UNIX)
  FIND_PATH(JSC_INCLUDE_DIR "JavaScriptCore/JavaScriptCore.h" "/usr/include/webkitgtk-1.0")
  SET(JSC_LIBS javascriptcoregtk-1.0)
  SET(JSC_INCLUDE_DIRS ${JSC_INCLUDE_DIR})

endif()
