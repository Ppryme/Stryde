// app/api/health/route.js
export async function HEAD() {
  return new Response(null, { status: 200 });
}