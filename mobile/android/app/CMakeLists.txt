cmake_minimum_required(VERSION 3.13)

set(PACKAGE_NAME "mobile")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

project(${PACKAGE_NAME})

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)