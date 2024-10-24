CFLAGS	= -std=c99 -Wall -Wextra -O3 -g -Wno-unused-parameter
LDFLAGS	=
LIBS	= -lsparkey

all: sparkey_put

sparkey_put: sparkey_put.c
	gcc $(CFLAGS) $(LDFLAGS) -o $@ $< $(LIBS)

clean:
	rm -f sparkey_put
