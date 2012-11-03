PROJECT(substance)
CMAKE_MINIMUM_REQUIRED(VERSION 2.8.4)

SET(SUBSTANCE_VERSION "0.5.0")

# Configure external projects
# ===========================
if (EXTERNALS)

  include(ExternalProject)
  include(config/Externals.cmake)

  if(APPLE)
    include(config/OSXExternals.cmake)

  elseif(UNIX)
    include(config/UnixExternals.cmake)

  endif()

# Process subdirectories
# ======================
else (EXTERNALS)

  include(config/ConfigureVariables.cmake)


  add_subdirectory(app)

  # Configure Testing
  # =================
  if (TESTING)
    add_subdirectory(test)

  endif()

endif () # EXTERNALS
