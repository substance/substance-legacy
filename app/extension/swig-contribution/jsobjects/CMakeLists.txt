# Note: this library provides a basic object mapper.
# In the context of substance currently the JSC version is used only.

include_directories(
  ${webkit_INCLUDE_DIRS}
  ${BOOST_INCLUDE_DIRS}
)

add_library(jsobjects
  jsobjects.h
  jsobjects_jsc.cxx
)

SET(jsobjects_INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR} CACHE INTERNAL "Include dirs to use jsobjects lib")