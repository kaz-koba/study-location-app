import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// 地図コンポーネント
const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // MapLibre GL のインスタンスを初期化
    const map = new maplibregl.Map({
      container: mapContainer.current, // 地図を表示するコンテナ
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [138, 37], // 初期表示の中心座標
      zoom: 5, // 初期ズームレベル
      minZoom: 5,
      maxZoom: 18,
      maxBounds: [
        [122, 20], // 南西座標
        [154, 50], // 北東座標
      ],
    });

    return () => {
      // クリーンアップ: Map の破棄
      map.remove();
    };
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
};

export default MapComponent;
