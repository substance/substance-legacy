include_directories(
  ${SUBSTANCE_EXTENSION_SOURCE_DIR}
  ${redisdocstore_INCLUDE_DIRS}
  ${GTEST_INCLUDE_DIRS}
  ${HIREDIS_INCLUDE_DIRS}
)

link_directories(
  ${GTEST_LIB_DIRS}
  ${HIREDIS_LIB_DIRS}
  ${jsobjects_LIBRARY_DIRS}
)

add_definitions(-DENABLE_TEST_EXTENSIONS)

add_executable(docstore.redis.unit
  test_access.hpp
  redis_unit.cxx
)

target_link_libraries(docstore.redis.unit
  jsobjects_cpp
  redisdocstore
  ${GTEST_LIBS}
  ${HIREDIS_LIBS}
)

add_test(
  NAME docstore.redis.unit
  COMMAND $<TARGET_FILE:docstore.redis.unit>
)
