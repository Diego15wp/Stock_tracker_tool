"use server";

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { cache } from 'react';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
// Minimal types used by searchStocks
type FinnhubSearchResult = {
  symbol: string;
  description?: string;
  displaySymbol?: string;
  type?: string;
  exchange?: string;
};

type FinnhubSearchResponse = {
  result: FinnhubSearchResult[];
};

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';
if (!token){
    throw new Error('FINNHUB API key is not configured');
}

export const fetchJSON = async (url: string, revalidateSeconds?: number) => {
  const fetchOptions: RequestInit = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } as any }
    : { cache: 'no-store' };

  const res = await fetch(url, fetchOptions);
  if (!res.ok) throw new Error(`Fetch error ${res.status} for ${url}`);
  return res.json();
};

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    let results: FinnhubSearchResult[] = [];

    if (!query || query.trim() === '') {
      // Fetch top 10 popular symbols' profiles
      const symbols = (POPULAR_STOCK_SYMBOLS || []).slice(0, 10);
      const profiles = await Promise.all(
        symbols.map(async (s) => {
          const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(s)}&token=${token}`;
          const profile = await fetchJSON(url, 3600);
          const symbol = (s || '').toUpperCase();
          const description = profile?.name || '';
          const displaySymbol = symbol;
          const type = 'Common Stock';
          const exchange = profile?.exchange || 'US';
          return { symbol, description, displaySymbol, type, exchange } as FinnhubSearchResult;
        })
      );
      results = profiles.filter(Boolean);
    } else {
      const q = query.trim();
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(q)}&token=${token}`;
      const data = (await fetchJSON(url, 1800)) as FinnhubSearchResponse | any;
      if (data && Array.isArray(data.result)) {
        results = data.result as FinnhubSearchResult[];
      } else if (Array.isArray(data)) {
        results = data as FinnhubSearchResult[];
      }
    }

    const mapped: StockWithWatchlistStatus[] = (results || [])
      .map((r) => {
        const symbol = (r.symbol || '').toUpperCase();
        const name = r.description || '';
        const exchange = r.displaySymbol || r.exchange || 'US';
        const type = r.type || 'Stock';
        return {
          symbol,
          name,
          exchange,
          type,
          isInWatchlist: false,
        } as StockWithWatchlistStatus;
      })
      .filter((s) => !!s.symbol)
      .slice(0, 15);

    return mapped;
  } catch (e) {
    // do not throw; log and return empty array
    // eslint-disable-next-line no-console
    console.error('error in stock search', e);
    return [];
  }
});

export const getNews = async (symbols?: string[]) => {
  try {
    const { from, to } = getDateRange(5);
    const maxArticles = 6;
    const articles: RawNewsArticle[] = [];

    if (symbols && symbols.length > 0) {
      const cleaned = Array.from(new Set(symbols.map((s) => (s || '').toUpperCase().trim()))).filter(Boolean);
      if (cleaned.length === 0) return [];

      // Round-robin, up to maxArticles rounds
      let round = 0;
      while (articles.length < maxArticles && round < 6) {
        const symbol = cleaned[round % cleaned.length];
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${token}`;
        const data = await fetchJSON(url);
        if (Array.isArray(data) && data.length > 0) {
          const valid = data.find((a: RawNewsArticle) => validateArticle(a) && !articles.some((ex) => ex.url === a.url));
          if (valid) articles.push(valid);
        }
        round++;
      }

      const formatted = articles
        .slice(0, maxArticles)
        .map((a, i) => formatArticle(a as RawNewsArticle, true, undefined, i));

      // Sort by datetime desc
      formatted.sort((x: any, y: any) => (y.datetime || 0) - (x.datetime || 0));
      return formatted;
    }

    // No symbols: fetch general market news
    const url = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const data = await fetchJSON(url);
    if (!Array.isArray(data)) return [];

    // Deduplicate by id/url/headline
    const seen = new Set<string>();
    const deduped: RawNewsArticle[] = [];
    for (let i = 0; i < data.length && deduped.length < maxArticles; i++) {
      const a: RawNewsArticle = data[i];
      if (!validateArticle(a)) continue;
      const key = String(a.id || a.url || a.headline).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(a);
    }

    const formatted = deduped.map((a, i) => formatArticle(a, false, undefined, i)).slice(0, maxArticles);
    formatted.sort((x: any, y: any) => (y.datetime || 0) - (x.datetime || 0));
    return formatted;
  } catch (e) {
    console.error('Error fetching news:', e);
    throw new Error('Failed to fetch news');
  }
};


export default getNews;
