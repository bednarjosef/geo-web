import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const apiFormData = new FormData();
    apiFormData.append('file', file);

    const geoApiUrl = process.env.GEO_API;
    
    const response = await fetch(`${geoApiUrl}/geolocate`, {
      method: 'POST',
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `GeoAPI error: ${errorText}` },
        { status: response.status }
      );
    }

    // return the result (lat, lon, confidence) to the frontend
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
