ADD_SUBDIRECTORY(extension/core)

set(SUBSTANCE_APP_SOURCES
  main.cxx
  mainframe.h
  mainframe.cxx
  webinspector.h
  webinspector.cxx
  wxresourceprovider.h
  wxresourceprovider.cxx
)

include_directories(
  ${webkit_INCLUDE_DIRS}
  ${wxWidgets_INCLUDE_DIRS}
  ${core_utils_DIR}
  ${jsobjects_INCLUDE_DIRS}
  ${BOOST_INCLUDE_DIRS}
)

link_directories(
  ${wxWidgets_LIBRARY_DIRS}
  ${HIREDIS_LIB_DIRS}
  #HACK: don't know why I need to add the jsobjects_LIBRARY_DIRS here
  #      they are not used directly... but cmake adds them to link list
  ${jsobjects_LIBRARY_DIRS}
)

add_executable(substance
  ${SUBSTANCE_APP_SOURCES}
)

target_link_libraries(substance
  ${HIREDIS_LIBS}
  ${webkit_LIBRARIES}
  ${wxWidgets_LIBRARIES}
  redisdocstore
  core_extensions
 )
