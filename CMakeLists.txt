project(Substance)
cmake_minimum_required(VERSION 2.8.4)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/config)
set(SUBSTANCE_VERSION "0.5.0")

set(EXTERNALS_DIR ${PROJECT_SOURCE_DIR}/ext CACHE STRING "Directory where external projects should be downloaded to" )
set(EXTERNALS_ONLY OFF CACHE BOOL "Set this if you want to build externals only. (ON|OFF)")

set(ENABLE_JSC ON)
set(ENABLE_TESTING ON CACHE BOOL "Enable test suite. (ON|OFF)")

# Configure external projects
# ===========================
if (EXTERNALS_ONLY)

  set (DOWNLOAD_EXTERNALS ON)
  include(Externals)

endif()


# Process subdirectories
# ======================
if (NOT EXTERNALS_ONLY)

  include(ExportTarget)
  include(ConfigureVariables)

  # include Externals to get variables set
  include(Externals)

  add_subdirectory(app)

  # Configure Testing
  # =================
  if (ENABLE_TESTING)
    enable_testing()
    add_subdirectory(test)

  endif()

endif () # EXTERNALS_ONLY
