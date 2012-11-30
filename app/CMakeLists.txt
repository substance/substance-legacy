SET(JS_INCLUDE_DIRS)
SET(JS_LIBRARY_DIRS ${jsobjects_LIBRARY_DIRS})
SET(JS_LIBRARIES ${JSC} jsobjects_jsc)

IF(APPLE)
  ADD_SUBDIRECTORY(osx)
ELSEIF(UNIX)
  ADD_SUBDIRECTORY(gtk)
ELSE()
  MESSAGE(FATAL_ERROR "Substance native is only available for OSX and UNIX systems")
ENDIF()

# the redis based document store
ADD_SUBDIRECTORY(extension/redis)
