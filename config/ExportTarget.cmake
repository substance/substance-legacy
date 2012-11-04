function(export_target _TARGET_NAME)

get_directory_property(${_TARGET_NAME} _INCLUDE_DIRS INCLUDE_DIRECTORIES)
SET(${_TARGET_NAME}_INCLUDE_DIRS "${${_TARGET_NAME}_INCLUDE_DIRS}" CACHE INTERNAL "Include dirs to use ${_TARGET_NAME}")

endfunction(export_target)
