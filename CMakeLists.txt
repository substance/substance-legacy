project(Substance)
cmake_minimum_required(VERSION 2.8.4)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/config)
set(SUBSTANCE_VERSION "0.5.0")

set(EXTERNALS_DIR ${PROJECT_SOURCE_DIR}/ext CACHE STRING "Directory where external projects should be downloaded to" )
set(ENABLE_DEVELOPER_EXTRAS OFF CACHE BOOL "Activate developer extras (e.g., WebInspector). (ON|OFF)")

set(ENABLE_JSC ON)

include(ExportTarget)
include(ConfigureVariables)

# include Externals to get variables set
include(Externals)

add_subdirectory(app)
