# Note: this library provides a basic object mapper.
# In the context of substance currently the JSC version is used only.

IF(UNIX)
  include_directories(${JSC_INCLUDE_DIR})
ENDIF()

add_library(jsobjects
  jsobjects.h
  jsobjects_jsc.cxx
)
