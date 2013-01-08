set(TARGET redisdocstore)

add_custom_command(
  OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/redis_access_wrap.cxx
  DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/redis_access.i 
          ${CMAKE_CURRENT_SOURCE_DIR}/redis_access.hpp
  COMMAND ${SWIG_COMMAND} -c++ -javascript -jsc
          -I${jsobjects_SWIG_INCLUDE_DIRS}
          -o ${CMAKE_CURRENT_BINARY_DIR}/redis_access_wrap.cxx
          ${CMAKE_CURRENT_SOURCE_DIR}/redis_access.i
  COMMENT "Creating native wrapper for redis_access.hpp"
)

set_property(SOURCE ${CMAKE_CURRENT_BINARY_DIR}/redis_access_wrap.cxx PROPERTY GENERATED ON)

set(REDIS_DOCSTORE_SOURCES
  redis_error.hpp
  redis_access.hpp
  redis_error.cpp
  ${CMAKE_CURRENT_BINARY_DIR}/redis_access_wrap.cxx
  hiredis_access_impl.cxx
)

include_directories(
  ${JS_INCLUDE_DIRS}
  ${BOOST_INCLUDE_DIRS}
  ${jsobjects_INCLUDE_DIRS}
  ${HIREDIS_INCLUDE_DIRS}
  ${CMAKE_CURRENT_SOURCE_DIR}
)

link_directories(
  ${HIREDIS_LIB_DIRS}
  ${JS_LIBRARY_DIRS}
)

add_library(
  ${TARGET} SHARED
  ${REDIS_DOCSTORE_SOURCES}
)

set_target_properties(${TARGET} PROPERTIES
  LIBRARY_OUTPUT_DIRECTORY ${OSX_LIBRARY_OUTPUT_DIR}
)

target_link_libraries(${TARGET}
  ${HIREDIS_LIBS}
  ${JS_LIBRARIES}
)

set_target_properties(${TARGET} PROPERTIES
  OUTPUT_NAME redis
)

set (redisdocstore_INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR} ${jsobjects_INCLUDE_DIRS} ${BOOST_INCLUDE_DIRS} CACHE INTERNAL "" FORCE)
