set(DOWNLOAD_DIR ${EXTERNALS_DIR}/swig)

if(APPLE)
  # HACK: switch for OSX version
  set(SWIGJS_GIT_TAG js_mountain_lion)
  set(SWIGJS_AUTOGEN)
elseif()
  set(SWIGJS_GIT_TAG devel)
  set(SWIGJS_AUTOGEN ${DOWNLOAD_DIR}/swig/autogen.sh)
endif()


if (DOWNLOAD_EXTERNALS)

  ExternalProject_Add(swig_js
    GIT_REPOSITORY https://github.com/oliver----/swig-v8.git
    GIT_TAG ${SWIGJS_GIT_TAG}
    PREFIX ${DOWNLOAD_DIR}
    DOWNLOAD_DIR ${DOWNLOAD_DIR}
    STAMP_DIR ${DOWNLOAD_DIR}/stamp
    SOURCE_DIR ${DOWNLOAD_DIR}/swig
    BINARY_DIR ${DOWNLOAD_DIR}/swig
    UPDATE_COMMAND ${SWIGJS_AUTOGEN}
    CONFIGURE_COMMAND /bin/sh ${DOWNLOAD_DIR}/swig/configure
    BUILD_COMMAND make
    INSTALL_COMMAND "" # skip install
  )

else ()

set(JS_INTERPRETER_DIR ${DOWNLOAD_DIR}/swig/Tools/javascript)

if (ENABLE_JSC)
  include_directories(${JSC_INCLUDE_DIRS})
  add_library(jsc_shell STATIC
    ${JS_INTERPRETER_DIR}/js_shell.h
    ${JS_INTERPRETER_DIR}/jsc_shell.cxx
    ${JS_INTERPRETER_DIR}/js_shell.cxx
  )
endif ()

if (ENABLE_V8)
  add_library(v8_shell STATIC
    ${JS_INTERPRETER_DIR}/js_shell.h
    ${JS_INTERPRETER_DIR}/js_shell.cxx
    ${JS_INTERPRETER_DIR}/v8_shell.cxx
  )
endif ()

endif ()

set(SWIG_COMMAND ${DOWNLOAD_DIR}/swig/preinst-swig)
