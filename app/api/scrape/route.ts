import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const lang = searchParams.get('lang') || 'en';
  const country = searchParams.get('country') || 'us';

  if (!appId) {
    return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
  }

  try {
    const appDetails = await gplay.app({ appId, lang, country });
    const reviews = await gplay.reviews({
      appId,
      lang,
      country,
      num: 100,
      sort: gplay.sort.NEWEST,
    });

    return NextResponse.json({
      app: {
        title: appDetails.title,
        appId: appDetails.appId,
        version: appDetails.version,
        recentChanges: appDetails.recentChanges,
        rating: appDetails.score,
        installs: appDetails.installs,
        updated: new Date(appDetails.updated).toISOString(),
      },
      reviews: reviews.data,
      pagination: reviews.nextPaginationToken
        ? {
            nextToken: reviews.nextPaginationToken,
            hasMore: true,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
