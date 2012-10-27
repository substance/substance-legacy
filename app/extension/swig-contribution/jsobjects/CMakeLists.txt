# Note: this library provides a basic object mapper.
# In the context of substance currently the JSC version is used only.

include_directories("/usr/include/webkitgtk-1.0")

add_library(jsobjects
  jsobjects.h
  jsobjects_jsc.cxx
)
