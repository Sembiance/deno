CFLAGS	= -std=c99 -Wall -Wextra -O3 -g -Wno-unused-parameter -shared -fPIC
LDFLAGS	=
LIBS	= -lsparkey

all: sparkey

sparkey: sparkey.c
	gcc $(CFLAGS) $(LDFLAGS) -o $@.so $< $(LIBS)

clean:
	rm -f sparkey.so
