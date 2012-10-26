#ifndef _REDIS_DOC_STORE_H_
#define _REDIS_DOC_STORE_H_

#include <string>
#include "operation.h"

class RedisDocStore {

public:

  RedisDocStore();
  
  ~RedisDocStore();
  
  void create(const std::string &id);
  
  void remove(const std::string &id);
  
  void update(const std::string &id, DocumentOperation operations[]);

  // Document* get(const std::string &id);

};

#endif
