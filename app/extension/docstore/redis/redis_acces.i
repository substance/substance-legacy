%module redis

%header %{
#define SWIG 1

#include "redis_access.hpp"
%}

%include "redis_access.hpp"
