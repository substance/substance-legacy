set(TARGET redisdocstore)

SET(REDIS_DOCSTORE_SOURCES
  redis_error.hpp
  redis_access.hpp
  redis_error.cpp
  hiredis_access_impl.cxx
  redis_acces_wrap.cxx
)

include_directories(
  ${webkit_INCLUDE_DIRS}
  ${BOOST_INCLUDE_DIRS}
  ${jsobjects_INCLUDE_DIRS}
  ${HIREDIS_INCLUDE_DIRS}
)

link_directories(
  ${HIREDIS_LIB_DIRS}
  ${webkit_LIBRARY_DIRS}
)

ADD_LIBRARY(
  ${TARGET} SHARED
  ${REDIS_DOCSTORE_SOURCES}
)

target_link_libraries(${TARGET}
  ${HIREDIS_LIBS}
  ${webkit_LIBRARIES}
)

set_target_properties(${TARGET} PROPERTIES
  OUTPUT_NAME redis
)

#export_target(redisdocstore)
