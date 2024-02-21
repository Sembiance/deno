#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "sparkey/sparkey.h"

// make a main that just writes hello world
int main(int argc, char **argv)
{
	sparkey_hashreader * reader;
	sparkey_returncode r = sparkey_hash_open(&reader, "/tmp/test.spi", "/tmp/test.spl");
	if(r!=SPARKEY_SUCCESS) {
		fprintf(stderr, "Failed to open hash reader: %s\n", sparkey_errstring(r));
		exit(1);
	}

	sparkey_logiter * iter;
	r = sparkey_logiter_create(&iter, sparkey_hash_getreader(reader));
	if(r!=SPARKEY_SUCCESS) {
		fprintf(stderr, "Failed to create log iterator: %s\n", sparkey_errstring(r));
		exit(1);
	}

	r =  sparkey_hash_get(reader, (uint8_t*)"hello", 5, iter);
	if(sparkey_logiter_state(iter)!=SPARKEY_ITER_ACTIVE)
	{
		fprintf(stderr, "Failed to find key\n");
	}
	else
	{
		// Extracting value is done the same as when iterating.
		uint64_t valueLen = sparkey_logiter_valuelen(iter);
		uint8_t * valueBuf = (uint8_t *)malloc(valueLen);
		uint64_t actual_valuelen;
		r = sparkey_logiter_fill_value(iter, sparkey_hash_getreader(reader), valueLen, valueBuf, &actual_valuelen);
		if(r!=SPARKEY_SUCCESS) {
			fprintf(stderr, "Failed to read value: %s\n", sparkey_errstring(r));
			exit(1);
		}

		char * value = (char *)malloc(actual_valuelen + 1);
		memcpy(value, valueBuf, actual_valuelen);

		printf("Got value: %s\n", value);
	}

	sparkey_hash_close(&reader);
	sparkey_logiter_close(&iter);
}