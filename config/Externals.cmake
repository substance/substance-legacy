include(ExternalProject)

#################
# Boost

FIND_PACKAGE(Boost REQUIRED)

#################
# JavaScriptCore

include(JavaScriptCore)

#################
# jsobjects

set(JSOBJECTS_DIR ${EXTERNALS_DIR}/jsobjects)
if(NOT EXISTS ${JSOBJECTS_DIR})
	message(FATAL_ERROR "JSOBJECTS_DIR does not exist: ${JSOBJECTS_DIR}.")
endif()
set(jsobjects_INCLUDE_DIRS ${JSOBJECTS_DIR}/include)
set(jsobjects_SWIG_INCLUDE_DIRS ${JSOBJECTS_DIR}/swig)

#################
# SWIG

include(SwigJS)

#################
# substance redis store

include(${EXTERNALS_DIR}/store/build/RedisDocStore.cmake)

################
# redis server
set(REDIS_SERVER_EXECUTABLE ${EXTERNALS_DIR}/redis/bin/redis-server)
if(NOT EXISTS ${REDIS_SERVER_EXECUTABLE})
	message(FATAL_ERROR "REDIS_SERVER_EXECUTABLE not found: ${REDIS_SERVER_EXECUTABLE}.")
endif()
