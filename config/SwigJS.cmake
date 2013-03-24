set(SWIG_DIR ${EXTERNALS_DIR}/swig)

set(JS_INTERPRETER_DIR ${SWIG_DIR}/Tools/javascript)

if (ENABLE_JSC)
  include_directories(${JSC_INCLUDE_DIRS})
  add_library(jsc_shell STATIC
    ${JS_INTERPRETER_DIR}/js_shell.h
    ${JS_INTERPRETER_DIR}/jsc_shell.cxx
    ${JS_INTERPRETER_DIR}/js_shell.cxx
  )
endif ()

if (ENABLE_V8)
  include_directories(${V8_INCLUDE_DIRS})
  add_library(v8_shell STATIC
    ${JS_INTERPRETER_DIR}/js_shell.h
    ${JS_INTERPRETER_DIR}/js_shell.cxx
    ${JS_INTERPRETER_DIR}/v8_shell.cxx
  )
endif ()

set(SWIG_COMMAND ${SWIG_DIR}/preinst-swig)
