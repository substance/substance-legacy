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
)

add_executable(substance
  ${SUBSTANCE_APP_SOURCES}
)

add_dependencies(substance wxWidgets)

# TODO: extract these using pkg-config and wx-condfig
target_link_libraries(substance
  redisdocstore
  ${webkit_LIBRARIES}
  ${wxWidgets_LIBRARIES}
  ${HIREDIS_LIBS}
)
