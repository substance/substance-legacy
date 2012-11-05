#include "test_access.hpp"
#include <hiredis.h>

void RedisDocStoreTestAccess::DeleteData(const char *prefix)
{
  redisReply *reply;
  char buf[1024];
  snprintf(buf, 1024,"KEYS %s*", prefix);
  reply = (redisReply*) redisCommand(redis, buf);

  redisAppendCommand(redis, "MULTI");
  for(size_t idx = 0; idx < reply->elements; ++idx) {
    redisAppendCommand(redis, "DEL %s", reply->element[idx]->str);
  }
  redisAppendCommand(redis, "EXEC");
  redisGetReply(redis, (void**) &reply);
  // TODO check if ok
  freeReplyObject(reply);
}
