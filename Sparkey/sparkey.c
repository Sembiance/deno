#define _XOPEN_SOURCE 600
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <zstd.h>
#include <pthread.h>

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

uint8_t delete(uint8_t * dbPath, uint32_t dbPathLen, uint8_t * key, uint32_t keyLen)
{
	sparkey_logwriter * writer;

	char * logFilePath = (char *)malloc(dbPathLen + 5);
	memcpy(logFilePath, dbPath, dbPathLen);
	memcpy(logFilePath + dbPathLen, ".spl", 4);
	logFilePath[dbPathLen + 4] = 0;

	sparkey_returncode r;
	r = sparkey_logwriter_append(&writer, logFilePath);
	if(r!=SPARKEY_SUCCESS)
	{
		free(logFilePath);
		return 0;
	}

	r = sparkey_logwriter_delete(writer, keyLen, key);
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

// The code below was vibe-coded by claude
typedef struct { uint8_t *key, *val, *comp; uint64_t keyLen, valLen; size_t compLen; } CompressEntry;

typedef struct {
	CompressEntry *batch; int start, end;
	ZSTD_CCtx *cctx; ZSTD_CDict *cdict;
	uint8_t success;
	volatile uint8_t *quit;
	pthread_barrier_t *readyBarrier, *doneBarrier;
} CompressWorkerArg;

static void * compressWorker(void *arg)
{
	CompressWorkerArg *a = (CompressWorkerArg *)arg;
	while(1)
	{
		pthread_barrier_wait(a->readyBarrier);
		if(*a->quit) break;
		a->success = 1;
		for(int i = a->start; i < a->end; i++)
		{
			CompressEntry *e = &a->batch[i];
			size_t compBufSize = ZSTD_compressBound(e->valLen);
			e->comp = (uint8_t *)malloc(compBufSize);
			e->compLen = ZSTD_compress_usingCDict(a->cctx, e->comp, compBufSize, e->val, e->valLen, a->cdict);
			if(ZSTD_isError(e->compLen)) { a->success = 0; break; }
		}
		pthread_barrier_wait(a->doneBarrier);
	}
	return NULL;
}

uint8_t compressAll(uint8_t * srcDbPath, uint32_t srcDbPathLen, uint8_t * dstDbPath, uint32_t dstDbPathLen, uint8_t * dictBuf, uint32_t dictLen, int32_t level)
{
	char * srcHashPath = (char *)malloc(srcDbPathLen + 5);
	memcpy(srcHashPath, srcDbPath, srcDbPathLen);
	memcpy(srcHashPath + srcDbPathLen, ".spi", 5);

	char * srcLogPath = (char *)malloc(srcDbPathLen + 5);
	memcpy(srcLogPath, srcDbPath, srcDbPathLen);
	memcpy(srcLogPath + srcDbPathLen, ".spl", 5);

	char * dstHashPath = (char *)malloc(dstDbPathLen + 5);
	memcpy(dstHashPath, dstDbPath, dstDbPathLen);
	memcpy(dstHashPath + dstDbPathLen, ".spi", 5);

	char * dstLogPath = (char *)malloc(dstDbPathLen + 5);
	memcpy(dstLogPath, dstDbPath, dstDbPathLen);
	memcpy(dstLogPath + dstDbPathLen, ".spl", 5);

	int numThreads = (int)sysconf(_SC_NPROCESSORS_ONLN);
	if(numThreads < 1) numThreads = 1;
	int batchSize = numThreads * 32;

	ZSTD_CDict * cdict = ZSTD_createCDict(dictBuf, dictLen, level);
	ZSTD_CCtx ** cctxs = (ZSTD_CCtx **)malloc(numThreads * sizeof(ZSTD_CCtx *));
	for(int i = 0; i < numThreads; i++) cctxs[i] = ZSTD_createCCtx();

	if(!cdict || !cctxs[0])
	{
		free(srcHashPath); free(srcLogPath); free(dstHashPath); free(dstLogPath);
		for(int i = 0; i < numThreads; i++) { if(cctxs[i]) ZSTD_freeCCtx(cctxs[i]); }
		free(cctxs);
		if(cdict) ZSTD_freeCDict(cdict);
		return 0;
	}

	sparkey_hashreader * reader;
	sparkey_returncode r = sparkey_hash_open(&reader, srcHashPath, srcLogPath);
	free(srcHashPath);
	free(srcLogPath);
	if(r != SPARKEY_SUCCESS)
	{
		for(int i = 0; i < numThreads; i++) ZSTD_freeCCtx(cctxs[i]);
		free(cctxs); ZSTD_freeCDict(cdict);
		free(dstHashPath); free(dstLogPath);
		return 0;
	}

	sparkey_logiter * iter;
	r = sparkey_logiter_create(&iter, sparkey_hash_getreader(reader));
	if(r != SPARKEY_SUCCESS)
	{
		sparkey_hash_close(&reader);
		for(int i = 0; i < numThreads; i++) ZSTD_freeCCtx(cctxs[i]);
		free(cctxs); ZSTD_freeCDict(cdict);
		free(dstHashPath); free(dstLogPath);
		return 0;
	}

	sparkey_logwriter * writer;
	r = sparkey_logwriter_create(&writer, dstLogPath, SPARKEY_COMPRESSION_NONE, 0);
	if(r != SPARKEY_SUCCESS)
	{
		sparkey_hash_close(&reader); sparkey_logiter_close(&iter);
		for(int i = 0; i < numThreads; i++) ZSTD_freeCCtx(cctxs[i]);
		free(cctxs); ZSTD_freeCDict(cdict);
		free(dstHashPath); free(dstLogPath);
		return 0;
	}

	pthread_barrier_t readyBarrier, doneBarrier;
	pthread_barrier_init(&readyBarrier, NULL, numThreads + 1);
	pthread_barrier_init(&doneBarrier, NULL, numThreads + 1);
	volatile uint8_t quit = 0;

	CompressEntry * batch = (CompressEntry *)calloc(batchSize, sizeof(CompressEntry));
	pthread_t * threads = (pthread_t *)malloc(numThreads * sizeof(pthread_t));
	CompressWorkerArg * args = (CompressWorkerArg *)malloc(numThreads * sizeof(CompressWorkerArg));

	for(int i = 0; i < numThreads; i++)
	{
		args[i] = (CompressWorkerArg){ .batch = batch, .start = 0, .end = 0, .cctx = cctxs[i], .cdict = cdict, .success = 1, .quit = &quit, .readyBarrier = &readyBarrier, .doneBarrier = &doneBarrier };
		pthread_create(&threads[i], NULL, compressWorker, &args[i]);
	}

	uint8_t success = 1;
	uint8_t done = 0;

	while(!done && success)
	{
		int count = 0;
		while(count < batchSize)
		{
			r = sparkey_logiter_hashnext(iter, reader);
			if(r != SPARKEY_SUCCESS) { success = 0; break; }
			if(sparkey_logiter_state(iter) != SPARKEY_ITER_ACTIVE) { done = 1; break; }

			CompressEntry * e = &batch[count];
			e->keyLen = sparkey_logiter_keylen(iter);
			e->valLen = sparkey_logiter_valuelen(iter);
			e->key = (uint8_t *)malloc(e->keyLen);
			e->val = (uint8_t *)malloc(e->valLen);
			e->comp = NULL;

			uint64_t actualKeyLen, actualValLen;
			r = sparkey_logiter_fill_key(iter, sparkey_hash_getreader(reader), e->keyLen, e->key, &actualKeyLen);
			if(r != SPARKEY_SUCCESS) { free(e->key); free(e->val); e->key = e->val = NULL; success = 0; break; }
			e->keyLen = actualKeyLen;
			r = sparkey_logiter_fill_value(iter, sparkey_hash_getreader(reader), e->valLen, e->val, &actualValLen);
			if(r != SPARKEY_SUCCESS) { free(e->key); free(e->val); e->key = e->val = NULL; success = 0; break; }
			e->valLen = actualValLen;
			count++;
		}

		if(count == 0) break;

		int perThread = count / numThreads;
		int remainder = count % numThreads;
		int offset = 0;
		for(int i = 0; i < numThreads; i++)
		{
			int chunk = perThread + (i < remainder ? 1 : 0);
			args[i].start = offset;
			args[i].end = offset + chunk;
			offset += chunk;
		}

		pthread_barrier_wait(&readyBarrier);
		pthread_barrier_wait(&doneBarrier);

		for(int i = 0; i < numThreads; i++) { if(!args[i].success) success = 0; }

		if(success)
		{
			for(int i = 0; i < count; i++)
			{
				r = sparkey_logwriter_put(writer, batch[i].keyLen, batch[i].key, batch[i].compLen, batch[i].comp);
				if(r != SPARKEY_SUCCESS) { success = 0; break; }
			}
		}

		for(int i = 0; i < count; i++) { free(batch[i].key); free(batch[i].val); free(batch[i].comp); }
		memset(batch, 0, count * sizeof(CompressEntry));
	}

	quit = 1;
	pthread_barrier_wait(&readyBarrier);
	for(int i = 0; i < numThreads; i++) pthread_join(threads[i], NULL);
	pthread_barrier_destroy(&readyBarrier);
	pthread_barrier_destroy(&doneBarrier);

	sparkey_logwriter_close(&writer);

	if(success)
		r = sparkey_hash_write(dstHashPath, dstLogPath, 0);

	sparkey_hash_close(&reader);
	sparkey_logiter_close(&iter);
	for(int i = 0; i < numThreads; i++) ZSTD_freeCCtx(cctxs[i]);
	free(cctxs);
	ZSTD_freeCDict(cdict);
	free(dstHashPath);
	free(dstLogPath);
	free(batch);
	free(threads);
	free(args);

	return (success && r == SPARKEY_SUCCESS) ? 1 : 0;
}
