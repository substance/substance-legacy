SET(JS_INCLUDE_DIRS)
SET(JS_LIBRARY_DIRS ${jsobjects_LIBRARY_DIRS})
SET(JS_LIBRARIES ${JSC} jsobjects_jsc)
SET(REDIS_CONF ${CMAKE_CURRENT_SOURCE_DIR}/redis.conf)

IF(APPLE)
	SET(OSX_LIBRARY_OUTPUT_DIR ${PROJECT_BINARY_DIR}/app/osx/libraries)
endif()

IF(APPLE)
  ADD_SUBDIRECTORY(osx)
ELSEIF(UNIX)
  ADD_SUBDIRECTORY(gtk)
  ADD_SUBDIRECTORY(extension/core)
ELSE()
  MESSAGE(FATAL_ERROR "Substance native is only available for OSX and UNIX systems")
ENDIF()

# the redis based document store
ADD_SUBDIRECTORY(extension/redis)
