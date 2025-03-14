import { NextResponse } from 'next/server';
import gplay from 'google-play-scraper';

export async function GET(request: { url: string | URL; }) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim() === "") {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const results = await gplay.search({
      term: query.trim(),
      num: 26, // adjust as needed
    });

    // Remove the 'installs' field from each result
    const filteredResults = results.map((app: any) => {
      const { installs, ...rest } = app;
      return rest;
    });

    // Sort the results in descending order by rating ('score')
    const sortedResults = filteredResults.sort((a: any, b: any) => b.score - a.score);
    
    return NextResponse.json({ results: sortedResults });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
