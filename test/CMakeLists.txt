enable_testing()

add_subdirectory(docstore/redis)

add_test(
  NAME docstore.redis.unit
  COMMAND $<TARGET_FILE:docstore.redis.unit>
)
