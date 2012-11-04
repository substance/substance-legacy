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
  ${webkit_INCLUDE_DIRS}
  ${BOOST_INCLUDE_DIRS}
  ${jsobjects_INCLUDE_DIRS}
  ${HIREDIS_INCLUDE_DIRS}
)

target_link_libraries(
  redisdocstore jsobjects
)

export_target(redisdocstore)
