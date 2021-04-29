import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import { getUserTweets } from './twitter';

const app = express();
cron.schedule('*/20 * * * * *', async () => {
	await getUserTweets();
	console.log('ran at', new Date());
});
app.listen(3000);