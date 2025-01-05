import maplibregl from "maplibre-gl";

export const handleMapClick = (
  e: maplibregl.MapMouseEvent,
  map: maplibregl.Map
) => {
  // クリック箇所に指定緊急避難場所レイヤーが存在するかどうかをチェック
  const features = map.queryRenderedFeatures(e.point, {
    layers: [
      "skhb-1-layer",
      "skhb-2-layer",
      "skhb-3-layer",
      "skhb-4-layer",
      "skhb-5-layer",
      "skhb-6-layer",
      "skhb-7-layer",
      "skhb-8-layer",
    ],
  });
  if (features.length === 0) return; // 地物がなければ処理を終了

  // 地物があればポップアップを表示する
  const feature = features[0]; // 複数の地物が見つかっている場合は最初の要素を用いる
  new maplibregl.Popup()
    .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number]) // [lon, lat]
    // 名称・住所・備考・対応している災害種別を表示するよう、HTMLを文字列でセット
    .setHTML(
      `
      <div style="font-weight:900; font-size: 1rem;">${
        feature.properties.name
      }</div>
      <div>${feature.properties.address}</div>
      <div>${feature.properties.remarks ?? ""}</div>
      <div>
        <span${
          feature.properties.disaster1 ? "" : ' style="color:#ccc;"'
        }>洪水</span>
        <span${
          feature.properties.disaster2 ? "" : ' style="color:#ccc;"'
        }>崖崩れ/土石流/地滑り</span>
        <span${
          feature.properties.disaster3 ? "" : ' style="color:#ccc;"'
        }>高潮</span>
        <span${
          feature.properties.disaster4 ? "" : ' style="color:#ccc;"'
        }>地震</span>
        <div>
          <span${
            feature.properties.disaster5 ? "" : ' style="color:#ccc;"'
          }>津波</span>
          <span${
            feature.properties.disaster6 ? "" : ' style="color:#ccc;"'
          }>大規模な火事</span>
          <span${
            feature.properties.disaster7 ? "" : ' style="color:#ccc;"'
          }>内水氾濫</span>
          <span${
            feature.properties.disaster8 ? "" : ' style="color:#ccc;"'
          }>火山現象</span>
        </div>
      </div>
      `
    )
    .addTo(map);
};
