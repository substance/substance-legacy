set(DOWNLOAD_DIR ${EXTERNALS_DIR}/swig)
set (SWIGJS_INCLUDED ON CACHE INTERNAL "" FORCE)

if(APPLE)
  # HACK: For Mountain Lion there is a pre-configured build to avoid dependency to automake chain
  set(SWIGJS_GIT_TAG js_mountain_lion)
  set(UPDATE_COMMAND)
else()
  set(SWIGJS_GIT_TAG devel)
  set(UPDATE_COMMAND /bin/sh autogen.sh)
endif()

if (SWIGJS_INCLUDED AND DOWNLOAD_EXTERNALS)

  message("###### NOTE: you can avoid downloading and building the swig-v8 project by providing a CMake variable 'SWIG_COMMAND'")

  ExternalProject_Add(swig_js
    LIST_SEPARATOR ":"
    GIT_REPOSITORY https://github.com/oliver----/swig-v8.git
    GIT_TAG ${SWIGJS_GIT_TAG}
    PREFIX ${DOWNLOAD_DIR}
    DOWNLOAD_DIR ${DOWNLOAD_DIR}
    STAMP_DIR ${DOWNLOAD_DIR}/stamp
    SOURCE_DIR ${DOWNLOAD_DIR}/swig
    BINARY_DIR ${DOWNLOAD_DIR}/swig
    UPDATE_COMMAND ${UPDATE_COMMAND}
    CONFIGURE_COMMAND /bin/sh configure
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
    include_directories(${V8_INCLUDE_DIRS})
    add_library(v8_shell STATIC
      ${JS_INTERPRETER_DIR}/js_shell.h
      ${JS_INTERPRETER_DIR}/js_shell.cxx
      ${JS_INTERPRETER_DIR}/v8_shell.cxx
    )
  endif ()

endif ()

set(SWIG_COMMAND ${DOWNLOAD_DIR}/swig/preinst-swig)
