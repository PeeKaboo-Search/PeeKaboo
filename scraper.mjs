import gplay from 'google-play-scraper';
import process from 'process';

async function getAppInfo(appId, lang = 'en', country = 'us') {
    return gplay.app({ appId, lang, country });
}

async function getReviews(options) {
    return gplay.reviews({
        ...options,
        sort: gplay.sort.NEWEST // or gplay.sort.RATING/HELPFULNESS
    });
}

async function main() {
    const args = process.argv.slice(2);
    const [appId, lang, country, num, paginate, nextToken] = args;
    
    if (!appId) {
        console.error(JSON.stringify({ error: "App ID is required" }));
        process.exit(1);
    }

    try {
        // Get app details
        const appDetails = await getAppInfo(appId, lang, country);
        
        // Get reviews configuration
        const reviewOptions = {
            appId,
            lang: lang || 'en',
            country: country || 'us',
            num: num ? parseInt(num) : 100,
            paginate: paginate === 'true',
            nextPaginationToken: nextToken || null
        };

        // Get reviews
        const reviews = await getReviews(reviewOptions);

        // Format response
        const response = {
            app: {
                title: appDetails.title,
                appId: appDetails.appId,
                version: appDetails.version,
                recentChanges: appDetails.recentChanges,
                rating: appDetails.score,
                installs: appDetails.installs,
                updated: new Date(appDetails.updated).toISOString()
            },
            reviews: reviews.data || reviews,
            pagination: reviewOptions.paginate ? {
                nextToken: reviews.nextPaginationToken,
                hasMore: !!reviews.nextPaginationToken
            } : null
        };

        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error(JSON.stringify({ error: error.message }));
        process.exit(1);
    }
}

main();