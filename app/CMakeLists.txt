
IF(APPLE)
  ADD_SUBDIRECTORY(osx)
ELSEIF(UNIX)
  ADD_SUBDIRECTORY(gtk)
ELSE()
  MESSAGE(FATAL_ERROR "Substance native is only available for OSX and UNIX systems")
ENDIF()

# a library for automatic js-c++ object mapping
ADD_SUBDIRECTORY(extension/swig-contribution/jsobjects)

# the redis based document store
ADD_SUBDIRECTORY(extension/docstore/redis)
