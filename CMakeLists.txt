project(Substance)
cmake_minimum_required(VERSION 2.8.4)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/config)

set(SUBSTANCE_VERSION "0.5.0")

add_subdirectory(app)
