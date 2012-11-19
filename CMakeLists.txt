PROJECT(substance)
CMAKE_MINIMUM_REQUIRED(VERSION 2.8.4)

SET(SUBSTANCE_VERSION "0.5.0")

set(EXTERNALS_DIR ${PROJECT_SOURCE_DIR}/ext)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/config)

# Configure external projects
# ===========================
if (EXTERNALS)

  set (DOWNLOAD_EXTERNALS ON)
  include(Externals)

endif()


# Process subdirectories
# ======================
if (NOT EXTERNALS)

  include(ExportTarget)
  include(ConfigureVariables)

  # include Externals to get variables set
  include(Externals)

  add_subdirectory(app)

  # Configure Testing
  # =================
  if (TESTING)
    enable_testing()
    add_subdirectory(test)

  endif()

endif () # EXTERNALS
