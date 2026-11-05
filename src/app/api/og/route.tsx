import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const WMO_LABELS_ID: Record<number, string> = {
  0: 'Cerah Bersih',
  1: 'Cerah Berawan Tipis',
  2: 'Awan Tersebar',
  3: 'Mendung Tebal',
  45: 'Berkabut',
  48: 'Kabut Beku',
  51: 'Gerimis Ringan',
  53: 'Gerimis Sedang',
  55: 'Gerimis Rapat',
  61: 'Hujan Ringan',
  63: 'Hujan Sedang',
  65: 'Hujan Lebat',
  71: 'Bersalju Ringan',
  73: 'Bersalju',
  75: 'Badai Salju',
  80: 'Hujan Guyur Ringan',
  81: 'Hujan Guyur',
  82: 'Hujan Deras Guyur',
  95: 'Badai Petir',
  96: 'Badai Petir & Es',
  99: 'Badai Petir Ekstrem',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let city = (searchParams.get('city') || 'Jakarta').trim();
    let country = (searchParams.get('country') || 'ID').trim();
    const unit = searchParams.get('unit') === 'imperial' ? 'imperial' : 'metric';
    const unitSymbol = unit === 'imperial' ? '°F' : '°C';

    let temp = searchParams.get('temp');
    let cond = searchParams.get('cond');
    let humidity = searchParams.get('humidity');
    let wind = searchParams.get('wind');

    // If live telemetry parameters are not passed in the URL, fetch live data from Open-Meteo
    if (!temp || !cond) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`,
          { next: { revalidate: 600 } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const hit = geoData?.results?.[0];
          if (hit) {
            city = hit.name || city;
            country = hit.country_code || country;
            const tempUnitParam = unit === 'imperial' ? 'fahrenheit' : 'celsius';
            const wxRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=${tempUnitParam}&wind_speed_unit=kmh`,
              { next: { revalidate: 300 } }
            );
            if (wxRes.ok) {
              const wxData = await wxRes.json();
              if (wxData?.current) {
                temp = String(Math.round(Number(wxData.current.temperature_2m ?? 28)));
                humidity = String(Math.round(Number(wxData.current.relative_humidity_2m ?? 70)));
                wind = String(Math.round(Number(wxData.current.wind_speed_10m ?? 12)));
                const code = Number(wxData.current.weather_code ?? 0);
                cond = WMO_LABELS_ID[code] || 'Cerah Berawan';
              }
            }
          }
        }
      } catch {
        // Fallback gracefully to defaults if network is unreachable
      }
    }

    const displayTemp = temp || '29';
    const displayCond = cond || 'Cerah Berawan';
    const displayHumidity = humidity || '72';
    const displayWind = wind || '14';

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '54px 64px',
            background: 'linear-gradient(135deg, #060b16 0%, #0f172a 52%, #0c243c 100%)',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background: '#38bdf8',
                  display: 'flex',
                }}
              />
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#e0f2fe',
                }}
              >
                WEATHERAETHER
              </span>
              <span
                style={{
                  fontSize: 18,
                  color: '#7dd3fc',
                  background: 'rgba(56, 189, 248, 0.14)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  marginLeft: '10px',
                }}
              >
                LIVE ATMOSPHERIC TELEMETRY
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: 20,
                color: '#94a3b8',
              }}
            >
              weatheraether.vercel.app
            </div>
          </div>

          {/* Center Main City & Temperature Hero */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: '12px',
              marginBottom: '12px',
              padding: '38px 46px',
              borderRadius: '32px',
              background: 'rgba(15, 23, 42, 0.72)',
              border: '1px solid rgba(148, 163, 184, 0.22)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 800,
                    color: '#ffffff',
                    lineHeight: 1.05,
                  }}
                >
                  {city}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#facc15',
                    background: 'rgba(250, 204, 21, 0.14)',
                    border: '1px solid rgba(250, 204, 21, 0.35)',
                    padding: '6px 16px',
                    borderRadius: '12px',
                  }}
                >
                  {country}
                </span>
              </div>

              <span
                style={{
                  fontSize: 32,
                  color: '#7dd3fc',
                  fontWeight: 600,
                }}
              >
                {displayCond}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontSize: 132,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 0.9,
                }}
              >
                {displayTemp}
              </span>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: '#38bdf8',
                  marginLeft: '4px',
                }}
              >
                {unitSymbol}
              </span>
            </div>
          </div>

          {/* Bottom Metrics Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  fontSize: 22,
                }}
              >
                <span style={{ color: '#94a3b8' }}>Kelembapan:</span>
                <strong style={{ color: '#38bdf8' }}>{displayHumidity}%</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  background: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  fontSize: 22,
                }}
              >
                <span style={{ color: '#94a3b8' }}>Kecepatan Angin:</span>
                <strong style={{ color: '#34d399' }}>{displayWind} km/j</strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 20,
                color: '#cbd5e1',
              }}
            >
              Radar Doppler • Indeks Drone • Pasang Surut • Epemeris
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return new Response(`Failed to generate OG image: ${msg}`, { status: 500 });
  }
}

