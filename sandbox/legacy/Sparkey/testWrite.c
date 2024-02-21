#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "sparkey/sparkey.h"

// make a main that just writes hello world
int main(int argc, char **argv)
{
	sparkey_logwriter * writer;
	sparkey_returncode r = sparkey_logwriter_create(&writer, "/tmp/test.spl", SPARKEY_COMPRESSION_NONE, 0);
	if(r!=SPARKEY_SUCCESS) {
		fprintf(stderr, "Failed to create log writer: %s\n", sparkey_errstring(r));
		exit(1);
	}

	const char * k = "hello";
	const char * v = "Hello, World!";
	r = sparkey_logwriter_put(writer, strlen(k), (uint8_t*)k, strlen(v), (uint8_t*)v);
	if(r!=SPARKEY_SUCCESS) {
		fprintf(stderr, "Failed to write log entry: %s\n", sparkey_errstring(r));
		exit(1);
	}

	r = sparkey_logwriter_close(&writer);
	if(r!=SPARKEY_SUCCESS) {
		fprintf(stderr, "Failed to close log writer: %s\n", sparkey_errstring(r));
		exit(1);
	}

	r = sparkey_hash_write("/tmp/test.spi", "/tmp/test.spl", 0);
	if(r!=SPARKEY_SUCCESS) {
		fprintf(stderr, "Failed to write hash file: %s\n", sparkey_errstring(r));
		exit(1);
	}
}