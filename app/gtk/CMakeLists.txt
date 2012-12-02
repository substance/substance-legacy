set(SUBSTANCE_APP_SOURCES
  main.cxx
  webframe.h
  webframe.cxx
  webinspector.h
  webinspector.cxx
)

include_directories(
  ${webkit_INCLUDE_DIRS}
  ${wxWidgets_INCLUDE_DIRS}
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
 )
