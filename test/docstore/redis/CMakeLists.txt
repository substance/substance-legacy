include_directories(
    ${GTEST_INCLUDE_DIRS}
)

link_directories(
  ${GTEST_LIB_DIRS}
)

add_executable(docstore.redis.unit
  redis_unit.cxx
)

target_link_libraries(docstore.redis.unit
  ${GTEST_LIBS}
)
