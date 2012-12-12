#ifndef REDIS_ERROR_HPP
#define REDIS_ERROR_HPP

class RedisError {
  
public:

  RedisError();

  RedisError(const std::string& msg);

#ifndef SWIG

  RedisError(const char* format, ...);

#endif // SWIG

  std::string toString();

private:

  const std::string msg;
};

#endif /* REDIS_ERROR_HPP */
