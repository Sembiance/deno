#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>
#include <fcntl.h>
#include <signal.h>
#include <string.h>
#include <sys/types.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>
#include <errno.h>
#include <time.h>

#include "sparkey/sparkey.h"

#define SPARKEY_PUT_VERSION "1.0.0"

#define MAX(a,b) ((a) > (b) ? (a) : (b))
#define MIN(a,b) ((a) < (b) ? (a) : (b))

static void usage(void)
{
    fprintf(stderr,
            "sparkey_put %s\n"
            "Puts a single key/val file path into a sparkey db\n"
            "\n"
            "Usage: sparkey_put <dbFilePathPrefix> <keyName> <inputFilePath>\n"
            "  -h, --help              Output this help and exit\n"
            "  -V, --version           Output version and exit\n"
            "\n", SPARKEY_PUT_VERSION);
    exit(EXIT_FAILURE);
}

char * dbFilePathPrefix=0;
char * keyName=0;
char * inputFilePath=0;

static void parse_options(int argc, char **argv)
{
    int i;

    for(i=1;i<argc;i++)
    {
        int lastarg = i==argc-1;

        if(!strcmp(argv[i],"-h") || !strcmp(argv[i], "--help"))
        {
            usage();
        }
        else if(!strcmp(argv[i],"-V") || !strcmp(argv[i], "--version"))
        {
            printf("sparkey_put %s\n", SPARKEY_PUT_VERSION);
            exit(EXIT_SUCCESS);
        }
        else
        {
            break;
        }
    }

    argc -= i;
    argv += i;

    if(argc<3)
        usage();

    dbFilePathPrefix = argv[0];
    keyName = argv[1];
	inputFilePath = argv[2];
}

uint8_t put(uint8_t * dbPath, uint32_t dbPathLen, uint8_t * key, uint32_t keyLen, uint8_t * value, uint64_t valueLen)
{
	sparkey_logwriter * writer;

	char * logFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(logFilePath, dbPath, dbPathLen);
	memcpy(logFilePath + dbPathLen, ".spl", 4);
	logFilePath[dbPathLen + 4] = 0;

	sparkey_returncode r;

	if(access(logFilePath, F_OK)!=-1)
		r = sparkey_logwriter_append(&writer, logFilePath);
	else
		r = sparkey_logwriter_create(&writer, logFilePath, SPARKEY_COMPRESSION_NONE, 0);

	if(r!=SPARKEY_SUCCESS)
	{
		fprintf(stderr, "Failed to create or append log writer, error: %d %s\n", r, sparkey_errstring(r));
		free(logFilePath);
		return 0;
	}

	r = sparkey_logwriter_put(writer, keyLen, key, valueLen, value);
	if(r!=SPARKEY_SUCCESS)
	{
		fprintf(stderr, "Failed to put key/val, error: %d %s\n", r, sparkey_errstring(r));
		sparkey_logwriter_close(&writer);
		free(logFilePath);
		return 0;
	}

	r = sparkey_logwriter_close(&writer);
	if(r!=SPARKEY_SUCCESS)
	{
		fprintf(stderr, "Failed to close log writer, error: %d %s\n", r, sparkey_errstring(r));
		free(logFilePath);
		return 0;
	}

	char * hashFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(hashFilePath, dbPath, dbPathLen);
	memcpy(hashFilePath + dbPathLen, ".spi", 4);
	hashFilePath[dbPathLen + 4] = 0;

	r = sparkey_hash_write(hashFilePath, logFilePath, 0);
	free(logFilePath);
	free(hashFilePath);

	if(r!=SPARKEY_SUCCESS)
	{
		fprintf(stderr, "Failed to write hash file, error: %d %s\n", r, sparkey_errstring(r));
		return 0;
	}

	return 1;
}

int main(int argc, char ** argv)
{
    int infd=-1;
    uint8_t * data=0;
    struct stat s;
	uint8_t result=0;
	int exitCode = EXIT_SUCCESS;

    parse_options(argc, argv);

    if(stat(inputFilePath, &s)==-1)
    {
        fprintf(stderr, "Failed to stat [%s]: %s\n", inputFilePath, strerror(errno));
		exitCode = EXIT_FAILURE;
        goto cleanup;
    }

    if(s.st_size==0)
    {
        fprintf(stderr, "Input file [%s] is zero bytes long\n", inputFilePath);
		exitCode = EXIT_FAILURE;
        goto cleanup;
    }

    infd = open(inputFilePath, O_RDONLY);
    if(infd==-1)
    {
        fprintf(stderr, "Failed to open input file [%s]: %s\n", inputFilePath, strerror(errno));
		exitCode = EXIT_FAILURE;
        goto cleanup;
    }

    data = mmap(0, s.st_size, PROT_READ, MAP_PRIVATE, infd, 0);
    if((void *)data==MAP_FAILED)
    {
        fprintf(stderr, "Failed to mmap input file [%s]: %s\n", inputFilePath, strerror(errno));
		data = 0;
		exitCode = EXIT_FAILURE;
        goto cleanup;
    }

	result = put((uint8_t *)dbFilePathPrefix, strlen(dbFilePathPrefix), (uint8_t *)keyName, strlen(keyName), data, s.st_size);
	if(result==0)
	{
		exitCode = EXIT_FAILURE;
		goto cleanup;
	}

    cleanup:
    if(data!=0)
        munmap(data, s.st_size);
    if(infd>=0)
        close(infd);

    exit(exitCode);
}
