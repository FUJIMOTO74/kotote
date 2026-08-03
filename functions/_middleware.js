/**
 * 旧サイト（kotote.pages.dev）だけを検索対象から外す。
 *
 * ★背景（2026-08-03 業務システム担当）:
 *   このプロジェクトは現在「中身は使っていないが、kotote.com のカスタムドメインを持っている」状態。
 *   実配信は kotote.com/* に載せた maintenance-gate Worker が kotote-hp.pages.dev から取って返している。
 *   → 残った kotote.pages.dev が**重複コンテンツ**として検索に出うる（canonical は既に kotote.com 向き）。
 *
 * 🔴 なぜ _headers ではなくここでやるか（★これが本質）:
 *   _headers はホストを区別できないため、全ホストに noindex が付きます。
 *   ★もし将来ゲート Worker を止める/外すと、その瞬間 kotote.com が**このプロジェクトから直接配信され、
 *     本番が noindex になります**（＝検索から消える）。時限爆弾になるので採りません。
 *   → **ホスト名で判定**し、`*.pages.dev` のときだけ付けます。本番ホストには**構造的に付きません**。
 *
 * ★同じ型の事故を1件止めた実績あり: HP#186（ゲートがヘッダを素通しし、本番を deindex しかけた）。
 */
export async function onRequest(context) {
  const response = await context.next();
  const host = new URL(context.request.url).hostname;

  // ★本番ホスト（kotote.com / www.kotote.com）には**絶対に付けない**
  if (host.endsWith(".pages.dev")) {
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return response;
}
