import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || 'featured';
  const query = searchParams.get('q');
  const pos = searchParams.get('pos');
  
  let targetUrl = `https://tenor.bhopp.ing/v2/${path}?limit=20`;
  if (query) targetUrl += `&q=${encodeURIComponent(query)}`;
  if (pos) targetUrl += `&pos=${pos}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      throw new Error(`Proxy responded with status: ${res.status}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next API Tenor Error:", error);
    return NextResponse.json({ error: 'Failed to fetch from Tenor proxy' }, { status: 500 });
  }
}
