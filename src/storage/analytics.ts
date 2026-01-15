/// <reference types="@cloudflare/workers-types" />

export interface AnalyticsData {
  clicks: number;
  lastClicked: string | null;
}

export async function incrementClicks(kv: KVNamespace, shortCode: string): Promise<void> {
  const now = new Date().toISOString();
  const clicksData = await kv.get(`analytics:${shortCode}:clicks`);
  const currentClicks = clicksData ? parseInt(clicksData, 10) : 0;
  await Promise.all([
    kv.put(`analytics:${shortCode}:clicks`, String(currentClicks + 1)),
    kv.put(`analytics:${shortCode}:lastClicked`, now),
  ]);
}

export async function getAnalytics(kv: KVNamespace, shortCode: string): Promise<AnalyticsData> {
  const clicksData = await kv.get(`analytics:${shortCode}:clicks`);
  const lastClickedData = await kv.get(`analytics:${shortCode}:lastClicked`);

  return {
    clicks: clicksData ? parseInt(clicksData, 10) : 0,
    lastClicked: lastClickedData,
  };
}

export async function shouldTrackClicks(kvUrl: KVNamespace, shortCode: string): Promise<boolean> {
  const data = await kvUrl.get(`short:${shortCode}`);
  if (!data) return false;
  const record = JSON.parse(data);
  return record.trackClicks === true;
}
