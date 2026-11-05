import { NextRequest, NextResponse } from 'next/server';
import { countryCodeToLanguage, getLanguageMeta } from '@/utils/i18n';

const IMPERIAL_COUNTRIES = new Set(['US', 'LR', 'MM']);

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return true;
  const trimmed = ip.trim();
  return (
    trimmed === '127.0.0.1' ||
    trimmed === '::1' ||
    trimmed === 'localhost' ||
    trimmed.startsWith('10.') ||
    trimmed.startsWith('192.168.') ||
    trimmed.startsWith('172.16.') ||
    trimmed.startsWith('172.17.') ||
    trimmed.startsWith('172.18.') ||
    trimmed.startsWith('172.19.') ||
    trimmed.startsWith('172.2') ||
    trimmed.startsWith('172.30.') ||
    trimmed.startsWith('172.31.') ||
    trimmed.startsWith('fc00:') ||
    trimmed.startsWith('fe80:')
  );
}

export async function GET(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language') || '';

  // 1. Check Edge / CDN Geolocation Headers (Vercel, Cloudflare, Fastly, AWS CloudFront)
  const edgeCountry =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('cloudfront-viewer-country') ||
    request.headers.get('x-country-code') ||
    '';

  const rawCity =
    request.headers.get('x-vercel-ip-city') ||
    request.headers.get('cf-ipcity') ||
    '';

  let countryCode = edgeCountry.toUpperCase().trim();
  if (countryCode === 'XX' || countryCode === 'T1') {
    countryCode = '';
  }

  let countryName = '';
  let city = rawCity ? decodeURIComponent(rawCity) : '';
  let source: 'edge' | 'geoip' | 'accept-language' = countryCode ? 'edge' : 'accept-language';

  // 2. If no Edge Country Header is present (e.g. local dev or non-Edge server), lookup via GeoJS IP API
  if (!countryCode) {
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIp = request.headers.get('x-real-ip') || '';
    const clientIp = (forwardedFor.split(',')[0] || realIp || '').trim();

    const geoEndpoint =
      clientIp && !isPrivateOrLocalIp(clientIp)
        ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(clientIp)}.json`
        : 'https://get.geojs.io/v1/ip/geo.json';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2400);
      const geoRes = await fetch(geoEndpoint, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData?.country_code && typeof geoData.country_code === 'string') {
          countryCode = geoData.country_code.toUpperCase().trim();
          countryName = geoData.country || '';
          city = city || geoData.city || '';
          source = 'geoip';
        }
      }
    } catch {
      // Fall back gracefully to Accept-Language / client-side GeoIP
    }
  }

  const lang = countryCodeToLanguage(countryCode, acceptLanguage);
  const meta = getLanguageMeta(lang);
  const unit = countryCode && IMPERIAL_COUNTRIES.has(countryCode) ? 'imperial' : 'metric';

  return NextResponse.json(
    {
      countryCode: countryCode || null,
      countryName: countryName || null,
      city: city || null,
      lang,
      langMeta: meta,
      unit,
      source,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    }
  );
}

