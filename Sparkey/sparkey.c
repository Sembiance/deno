#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "sparkey/sparkey.h"

#define MAX(a,b) ((a) > (b) ? (a) : (b))
#define MIN(a,b) ((a) < (b) ? (a) : (b))

#define SPARKEY_BUF_LENGTH 1024*32	// 32k

uint8_t * get(uint8_t * dbPath, uint32_t dbPathLen, uint8_t * key, uint32_t keyLen, uint64_t maxLen)
{
	sparkey_hashreader * reader;

	char * hashFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(hashFilePath, dbPath, dbPathLen);
	memcpy(hashFilePath + dbPathLen, ".spi", 4);
	hashFilePath[dbPathLen + 4] = 0;

	char * logFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(logFilePath, dbPath, dbPathLen);
	memcpy(logFilePath + dbPathLen, ".spl", 4);
	logFilePath[dbPathLen + 4] = 0;

	sparkey_returncode r = sparkey_hash_open(&reader, hashFilePath, logFilePath);
	free(hashFilePath);
	free(logFilePath);
	if(r!=SPARKEY_SUCCESS)
		return 0;

	sparkey_logiter * iter;
	r = sparkey_logiter_create(&iter, sparkey_hash_getreader(reader));
	if(r!=SPARKEY_SUCCESS)
	{
		sparkey_hash_close(&reader);
		return 0;
	}

	r =  sparkey_hash_get(reader, key, keyLen, iter);
	if(sparkey_logiter_state(iter)!=SPARKEY_ITER_ACTIVE)
	{
		sparkey_hash_close(&reader);
		sparkey_logiter_close(&iter);
		return 0;
	}

	uint64_t valueLen = sparkey_logiter_valuelen(iter);
	if(maxLen!=0)
		valueLen = MIN(valueLen, maxLen);
	uint8_t * valueBuf = (uint8_t *)malloc(4 + valueLen);
	uint64_t actualValueLen;
	r = sparkey_logiter_fill_value(iter, sparkey_hash_getreader(reader), valueLen, valueBuf+4, &actualValueLen);

	sparkey_hash_close(&reader);
	sparkey_logiter_close(&iter);

	if(r!=SPARKEY_SUCCESS)
	{
		free(valueBuf);
		return 0;
	}

	memcpy(valueBuf, &actualValueLen, 4);

	return (uint8_t *)valueBuf;
}

uint64_t getLength(uint8_t * dbPath, uint32_t dbPathLen, uint8_t * key, uint32_t keyLen)
{
	sparkey_hashreader * reader;

	char * hashFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(hashFilePath, dbPath, dbPathLen);
	memcpy(hashFilePath + dbPathLen, ".spi", 4);
	hashFilePath[dbPathLen + 4] = 0;

	char * logFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(logFilePath, dbPath, dbPathLen);
	memcpy(logFilePath + dbPathLen, ".spl", 4);
	logFilePath[dbPathLen + 4] = 0;

	sparkey_returncode r = sparkey_hash_open(&reader, hashFilePath, logFilePath);
	free(hashFilePath);
	free(logFilePath);
	if(r!=SPARKEY_SUCCESS)
		return 0;

	sparkey_logiter * iter;
	r = sparkey_logiter_create(&iter, sparkey_hash_getreader(reader));
	if(r!=SPARKEY_SUCCESS)
	{
		sparkey_hash_close(&reader);
		return 0;
	}

	r =  sparkey_hash_get(reader, key, keyLen, iter);
	if(sparkey_logiter_state(iter)!=SPARKEY_ITER_ACTIVE)
	{
		sparkey_hash_close(&reader);
		sparkey_logiter_close(&iter);
		return 0;
	}

	uint64_t valueLen = sparkey_logiter_valuelen(iter);

	sparkey_hash_close(&reader);
	sparkey_logiter_close(&iter);

	return valueLen;
}

uint64_t extractFile(uint8_t * dbPath, uint32_t dbPathLen, uint8_t * key, uint32_t keyLen, uint8_t * filePath, uint32_t filePathLen)
{
	sparkey_hashreader * reader;

	char * hashFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(hashFilePath, dbPath, dbPathLen);
	memcpy(hashFilePath + dbPathLen, ".spi", 4);
	hashFilePath[dbPathLen + 4] = 0;

	char * logFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(logFilePath, dbPath, dbPathLen);
	memcpy(logFilePath + dbPathLen, ".spl", 4);
	logFilePath[dbPathLen + 4] = 0;

	sparkey_returncode r = sparkey_hash_open(&reader, hashFilePath, logFilePath);
	free(hashFilePath);
	free(logFilePath);
	if(r!=SPARKEY_SUCCESS)
		return 0;

	sparkey_logreader * logReader = sparkey_hash_getreader(reader);
	sparkey_logiter * iter;
	r = sparkey_logiter_create(&iter, logReader);
	if(r!=SPARKEY_SUCCESS)
	{
		sparkey_hash_close(&reader);
		return 0;
	}

	r =  sparkey_hash_get(reader, key, keyLen, iter);
	if(sparkey_logiter_state(iter)!=SPARKEY_ITER_ACTIVE)
	{
		sparkey_hash_close(&reader);
		sparkey_logiter_close(&iter);
		return 0;
	}

	char * outFilePath = (char *)malloc(filePathLen + 1);
	memcpy(outFilePath, filePath, filePathLen);
	outFilePath[filePathLen] = 0;

	FILE * fp = fopen(outFilePath, "w");

	uint64_t valueLen = sparkey_logiter_valuelen(iter);

	uint64_t totalReadCount = 0;
	uint8_t * buf = (uint8_t *)malloc(SPARKEY_BUF_LENGTH);
	do
	{
		uint64_t amountToRead = MIN(SPARKEY_BUF_LENGTH, (valueLen-totalReadCount));
		if(amountToRead==0)
			break;

		uint64_t readCount;
		r = sparkey_logiter_fill_value(iter, logReader, amountToRead, buf, &readCount);
		if(readCount>0)
		{
			fwrite(buf, readCount, 1, fp);
			totalReadCount+=readCount;
		}
	} while(r==SPARKEY_SUCCESS && totalReadCount<valueLen);

	fclose(fp);

	sparkey_hash_close(&reader);
	sparkey_logiter_close(&iter);

	return totalReadCount;
}

uint8_t put(uint8_t * dbPath, uint32_t dbPathLen, uint8_t * key, uint32_t keyLen, uint8_t * value, uint32_t valueLen)
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
		free(logFilePath);
		return 0;
	}

	r = sparkey_logwriter_put(writer, keyLen, key, valueLen, value);
	if(r!=SPARKEY_SUCCESS)
	{
		sparkey_logwriter_close(&writer);
		free(logFilePath);
		return 0;
	}

	r = sparkey_logwriter_close(&writer);
	if(r!=SPARKEY_SUCCESS)
	{
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
		return 0;

	return 1;
}

uint8_t putMany(uint8_t * dbPath, uint32_t dbPathLen, uint32_t entryCount, uint8_t * keys, uint8_t * values)
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
		free(logFilePath);
		return 0;
	}

	uint32_t keypos = 0;
	uint32_t keylen = 0;
	uint32_t valuepos = 0;
	uint32_t valuelen = 0;
	for(uint32_t i=0;i<entryCount;i++)
	{
		memcpy(&keylen, keys + keypos, 4);
		keypos += 4;
		memcpy(&valuelen, values + valuepos, 4);
		valuepos += 4;

		r = sparkey_logwriter_put(writer, keylen, keys+keypos, valuelen, values+valuepos);		
		if(r!=SPARKEY_SUCCESS)
		{
			sparkey_logwriter_close(&writer);
			free(logFilePath);
			return 0;
		}
		
		keypos += keylen;
		valuepos += valuelen;
	}

	r = sparkey_logwriter_close(&writer);
	if(r!=SPARKEY_SUCCESS)
	{
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
		return 0;

	return 1;
}
