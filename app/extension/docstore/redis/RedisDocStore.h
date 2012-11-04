#ifndef _REDIS_DOC_STORE_H_
#define _REDIS_DOC_STORE_H_

#include <string>
#include "operation.h"

struct redisContext;

class RedisDocStore {

public:

  RedisDocStore();

  RedisDocStore(const std::string& url, int port);

  ~RedisDocStore();

  /**
   * Creates a document with a given id.
   **/
  void create(const std::string &id);

  /**
   * Removes a document with a given id from the doc store.
   **/
  void remove(const std::string &id);

  /**
   * Updates a document with a given id applying the provided operations.
   **/
  void update(const std::string &id, DocumentOperation operations[]);

  // Document* get(const std::string &id);

#ifdef ENABLE_TEST_EXTENSIONS
/* -------- TESTING: Methods for checking during testing */

private:
  friend class RedisDocStoreTestAccess;
/* -------- TESTING */
#endif

protected:
  void connect();

  redisContext *redis;
  const std::string& hostUrl;
  const int port;
};

class RedisDocstoreException {

public:
  RedisDocstoreException(const std::string& msg);

  const std::string &msg;
};

#endif
