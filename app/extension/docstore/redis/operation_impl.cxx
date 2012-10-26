#include "operation_impl.h"

std::string DefaultDocumentOperation::getSha() {
  return m_sha;
}

void DefaultDocumentOperation::setSha(const std::string& sha) {
  m_sha = sha;
}

std::string DefaultDocumentOperation::getUser() {
  return m_user;
}

void DefaultDocumentOperation::setUser(const std::string& user) {
  m_user = user;
}

std::string DefaultDocumentOperation::getParent() {
  return m_parent;
}

void DefaultDocumentOperation::setParent(const std::string& parent) {
  m_parent = parent;
}
  
JSArrayPtr DefaultDocumentOperation::getOp() {
  return op;
}

void DefaultDocumentOperation::setOp(JSArrayPtr op) {
  m_op = op;
}
