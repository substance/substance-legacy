include_directories(
  ${SUBSTANCE_EXTENSION_SOURCE_DIR}
  ${redisdocstore_INCLUDE_DIRS}
  ${GTEST_INCLUDE_DIRS}
  ${HIREDIS_INCLUDE_DIRS}
)

link_directories(
  ${GTEST_LIB_DIRS}
  ${HIREDIS_LIB_DIRS}
)

add_definitions(-DENABLE_TEST_EXTENSIONS)

add_executable(docstore.redis.unit
  redis_unit.cxx
)

target_link_libraries(docstore.redis.unit
  redisdocstore
  ${GTEST_LIBS}
  ${HIREDIS_LIBS}
)
