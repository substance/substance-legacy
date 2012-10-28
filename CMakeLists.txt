PROJECT(substance)
CMAKE_MINIMUM_REQUIRED(VERSION 2.8.4)

SET(SUBSTANCE_VERSION "0.5.0")

# Configure external projects
# ===========================

include(ExternalProject)

include(config/Externals.cmake)
IF(APPLE)
  include(config/OSXExternals.cmake)
ELSEIF(UNIX)
  include(config/UnixExternals.cmake)
ENDIF()


# Process subdirectories
# ======================

ADD_SUBDIRECTORY(app)
