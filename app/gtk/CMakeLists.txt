set(SUBSTANCE_APP_SOURCES
  main.cxx
  webframe.h
  webframe.cxx
  webinspector.h
  webinspector.cxx
)

include_directories(
  ${JSC_INCLUDE_DIRS}
  ${WXWIDGETS_INCLUDE_DIRS}
)

link_directories(
 ${WXWIDGETS_LIB_DIRS}
)

add_executable(substance
  ${SUBSTANCE_APP_SOURCES}
)

# TODO: extract these using pkg-config and wx-condfig
set_target_properties(substance
  PROPERTIES
    COMPILE_FLAGS "-DWXUSINGDLL -D__WXGTK__"
)

add_dependencies(substance wxWidgets)

# TODO: extract these using pkg-config and wx-condfig
target_link_libraries(substance
  jsobjects redisdocstore
  ${JSC_LIBS}
  ${WXWIDGETS_LIBS}
)
