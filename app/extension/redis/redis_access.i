%module redis

%header %{
#define SWIG 1

#include <jsobjects_jsc.hpp>
#include <redis_error.hpp>
#include <redis_access.hpp>

using namespace jsobjects;
%}

%include <std_string.i>
%include <jsobjects.i>

%include "redis_error.hpp"
%include "redis_access.hpp"
