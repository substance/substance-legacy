%module redis

%header %{
#define SWIG 1

#include <jsobjects_jsc.hpp>
#include <redis_access.hpp>
%}

%include "redis_access.hpp"
