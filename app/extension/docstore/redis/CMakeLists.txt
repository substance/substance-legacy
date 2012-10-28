INCLUDE_DIRECTORIES(
  ${PROJECT_SOURCE_DIR}/app/extension/swig-contribution/jsobjects
)

SET(REDIS_DOCSTORE_SOURCES
  operation.h
  operation_impl.h
  operation_impl.cxx
  RedisDocStore.h
  RedisDocStore.cxx
  RedisDocStore_wrap_manual.cxx
)

ADD_LIBRARY(
  redisdocstore STATIC
  ${REDIS_DOCSTORE_SOURCES}
)

include_directories(
  ${JSC_INCLUDE_DIR}
  ${BOOST_INCLUDE_DIRS}
)

target_link_libraries(redisdocstore jsobjects)
