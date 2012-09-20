find_library(COREDATA CoreData)
find_library(FOUNDATION Foundation)
find_library(APPKIT AppKit)
find_library(COCOA Cocoa)

add_executable(myapp
  main.m
  appDelegate.h
  appDelegate.m
)

target_link_libraries(myapp 
  ${COREDATA} ${FOUNDATION}
  ${APPKIT} ${COCOA}
)
