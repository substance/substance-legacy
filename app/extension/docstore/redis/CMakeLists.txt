INCLUDE_DIRECTORIES(
  ${PROJECT_SOURCE_DIR}/app/extension/swig-contribution/jsobjects
)

IF(UNIX)
  include_directories(${JSC_INCLUDE_DIR})
ENDIF()

SET(REDIS_DOCSTORE_SOURCES
  operation.h
  operation_impl.h
  operation_impl.cxx
  RedisDocStore.h
  RedisDocStore.cxx
  RedisDocStore_wrap_manual.cxx
)

ADD_LIBRARY(
  redisdocstore SHARED
  ${REDIS_DOCSTORE_SOURCES}
)

target_link_libraries(redisdocstore jsobjects)