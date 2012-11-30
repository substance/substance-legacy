#ifndef REDIS_ERROR_HPP
#define REDIS_ERROR_HPP

class RedisError {
  
public:

  RedisError();

#ifndef SWIG

  RedisError(const std::string& msg);
  
  RedisError(const char* format, ...);

#endif // SWIG

  const std::string msg;
};

#endif /* REDIS_ERROR_HPP */
