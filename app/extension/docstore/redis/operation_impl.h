#ifndef OPERATION_IMPL_H
#define OPERATION_IMPL_H

#include "operation.h"

class DefaultDocumentOperation: public DocumentOperation {

public:
  virtual std::string getSha();
  virtual void setSha(const std::string& _sha);

  virtual std::string getUser();
  virtual void setUser(const std::string& _user);
  
  virtual std::string getParent();
  virtual void setParent(const std::string& _parent);
  
  virtual JSArrayPtr getOp();
  virtual void setOp(JSArrayPtr _op);

protected:
  std::string m_sha;
  std::string m_user;
  std::string m_parent;
  JSArrayPtr m_op;

};

#endif // OPERATION_IMPL_H
