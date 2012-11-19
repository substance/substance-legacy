#define BUFFER_LEN 1024
#include <stdio.h>
#include <stdarg.h>
#include <string>

#include "redis_error.hpp"

std::string RedisError_createMessage(const char *format, va_list ap) {
  char buf[BUFFER_LEN];
  vsnprintf(buf, BUFFER_LEN, format, ap);
  return std::string(buf);
}

RedisError::RedisError()
: msg("")
{
}

RedisError::RedisError(const std::string& msg)
: msg(msg)
{
}

RedisError::RedisError(const char *format, ...)
{
  va_list ap;
  va_start(ap, format);
  std::string _msg(RedisError_createMessage(format, ap));
  va_end(ap);
  std::string* pmsg = const_cast<std::string*>(&msg);
  pmsg->append(msg);
}
