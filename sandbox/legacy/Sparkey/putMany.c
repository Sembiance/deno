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
