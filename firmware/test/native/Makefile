CXX ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -Werror

test: test_chronotime
	./test_chronotime

test_chronotime: test_chronotime.cpp ../../lib/chronotime/chronotime.cpp ../../lib/chronotime/chronotime.h
	$(CXX) $(CXXFLAGS) -o $@ test_chronotime.cpp ../../lib/chronotime/chronotime.cpp

clean:
	rm -f test_chronotime

.PHONY: test clean
