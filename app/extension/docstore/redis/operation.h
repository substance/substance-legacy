#ifndef DOCUMENT_OPERATION_H
#define DOCUMENT_OPERATION_H

#include "jsobjects.h"

class DocumentOperation {

public:
  virtual std::string getSha() {
    return sha;
  }

  virtual void setSha(const std::string& _sha) {
    sha = _sha;
  }

  virtual std::string getUser() {
    return user;
  }

  virtual void setUser(const std::string& _user) {
    user = _user;
  }

  virtual std::string getParent() {
    return parent;
  }

  virtual void setParent(const std::string& _parent) {
    parent = _parent;
  }
  
  virtual JSArrayPtr getOp() {
    return JSArrayPtr(op);
  }

  virtual void setOp(JSArrayPtr _op) {
    op = _op;
  }

protected:

  JSArrayPtr op;

private:

  std::string sha;
  std::string user;
  std::string parent;
};

#endif // DOCUMENT_OPERATION_H
