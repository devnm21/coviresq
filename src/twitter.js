import needle from 'needle';
import Twit from 'twit';
import config from './config';
// import Twitter from 'twitter';
// const client = new Twitter(config);

const coviResId = '1387856184510582785';
const url = `https://api.twitter.com/2/users/${coviResId}/mentions`;
const twit = new Twit(config);

const bearerToken = process.env.BEARER_TOKEN;

const options = {
	headers: {
		"User-Agent": "v2UserMentionssJS",
		"authorization": `Bearer ${bearerToken}`
	}
}
export const getUserMentions = async (sinceId) => {
	let userMentions = [];
	let params = {
		"max_results": 100,
		"tweet.fields": "created_at",
		"expansions": 'referenced_tweets.id',
		start_time: sinceId
	}

	
	let hasNextPage = true;
	let nextToken = null;
	console.log("Retrieving mentions...");
	while (hasNextPage) {
		let resp = await getPage(url, params, options, nextToken);
		console.log(resp.meta)
		if (resp && resp.meta && resp.meta.result_count && resp.meta.result_count > 0) {
			if (resp.data) {
				userMentions.push.apply(userMentions, resp.data);
			}
			if (resp.meta.next_token) {
				nextToken = resp.meta.next_token;
			} else {
				hasNextPage = false;
			}
		} else {
			hasNextPage = false;
		}
	}
	console.dir(userMentions, {
		depth: null
	});
	for (const mention of userMentions) {
		if (mention.text.includes('working') && mention.referenced_tweets && mention.referenced_tweets.length > 0)
		twit.post('statuses/retweet/:id', { id: mention.referenced_tweets[0].id }, function (err, data, response) {
			console.log('retweeted', mention.referenced_tweets[0].id);
		})
	}
	console.log(`Got ${userMentions.length} mentions for user ID ${coviResId}!`);
}

export const getUserTweets = async () => {
	const url = `https://api.twitter.com/2/users/${coviResId}/tweets`;
	let userTweets = [];
	
	// we request the author_id expansion so that we can print out the user name later
	let params = {
		"max_results": 5,
		"tweet.fields": "created_at",
		"expansions": "author_id"
	}
	
	const options = {
		headers: {
			"User-Agent": "v2UserTweetsJS",
			"authorization": `Bearer ${bearerToken}`
		}
	}
	
	let hasNextPage = true;
	let nextToken = null;
	let userName;
	console.log("Retrieving Tweets...");
	
	while (hasNextPage) {
		let resp = await getPage(url, params, options, nextToken);
		console.log(resp.meta)
		if (resp && resp.meta && resp.meta.result_count && resp.meta.result_count > 0) {
			userName = resp.includes.users[0].username;
			if (resp.data) {
				userTweets.push.apply(userTweets, resp.data);
			}
			if (resp.meta.next_token) {
				nextToken = resp.meta.next_token;
			} else {
				hasNextPage = false;
			}
		} else {
			hasNextPage = false;
		}
	}
	
	console.dir(userTweets, {
		depth: null
	});
	await getUserMentions(userTweets[0].created_at)
	console.log(`Got ${userTweets.length} Tweets from ${userName} (user ID ${coviResId})!`);
	
}


const getPage = async (url, params, options, nextToken) => {
	console.log({url})
	if (nextToken) {
		params.pagination_token = nextToken;
	}
	
	try {
		const resp = await needle('get', url, params, options);
		
		if (resp.statusCode != 200) {
			console.log(`${resp.statusCode} ${resp.statusMessage}:\n${resp.body}`);
			return;
		}
		return resp.body;
	} catch (err) {
		throw new Error(`Request failed: ${err}`);
	}
};


