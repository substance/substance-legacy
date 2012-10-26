#include "operation.h"
#include <v8.h>
#include <assert.h>

/* TODO: put this in the header of a generated wrapper */
// NOTE: this file will be generated into the wrapper
//       so that no extern imports are necessary
extern JSValuePtr CreateJSValueV8(v8::Handle<v8::Value> val);
extern JSObjectPtr CreateJSObjectV8(v8::Handle<v8::Object> obj);
extern JSArrayPtr CreateJSArrayV8(v8::Handle<v8::Array> arr);
extern std::string JSValueV8_toString(v8::Handle<v8::String> s);
extern v8::Handle<v8::String> JSValueV8_fromString(const std::string& s);
/* END */


// NOTE: This should be generated, e.g., by marking DocumentOperation as "directed"
class DocumentOperationDirector: public DocumentOperation {

private:
  // instances for property names
  v8::Persistent<v8::Object> obj;

  // TODO: the keys for property names are created once
  v8::Persistent<v8::String> key_sha;
  v8::Persistent<v8::String> key_user;
  v8::Persistent<v8::String> key_parent;
  v8::Persistent<v8::String> key_op;

public:

  DocumentOperationDirector(v8::Handle<v8::Object> jsobj) {
    obj = v8::Persistent<v8::Object>::New(jsobj);

    // TODO: the keys for property names are created once
    key_sha = v8::Persistent<v8::String>::New(v8::String::New("sha"));
    key_user = v8::Persistent<v8::String>::New(v8::String::New("user"));
    key_parent = v8::Persistent<v8::String>::New(v8::String::New("parent"));

    // TODO: could be local
    key_op = v8::Persistent<v8::String>::New(v8::String::New("op"));

    // going deeper: wrap complex members
    setOp(CreateJSArrayV8(v8::Handle<v8::Array>::Cast(obj->Get(key_op))));
  }

  ~DocumentOperationDirector() {
    obj.Dispose();
    key_sha.Dispose();
    key_user.Dispose();
    key_parent.Dispose();
    key_op.Dispose();
  }

  virtual std::string getSha() {
    return JSValueV8_toString(obj->Get(key_sha)->ToString());
  }

  virtual void setSha(const std::string& sha) {
    obj->Set(key_sha, JSValueV8_fromString(sha));
  }

  virtual std::string getUser() {
    return JSValueV8_toString(obj->Get(key_user)->ToString());
  }

  virtual void setUser(const std::string& user) {
    obj->Set(key_user, JSValueV8_fromString(user));
  }

  virtual std::string getParent() {
    return JSValueV8_toString(obj->Get(key_parent)->ToString());
  }

  virtual void setParent(const std::string& parent) {
    obj->Set(key_parent, JSValueV8_fromString(parent));
  }

};
