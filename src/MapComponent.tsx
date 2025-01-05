import React, { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "maplibre-gl-opacity/dist/maplibre-gl-opacity.css";
import { initMap } from "./mapConfig";
import { addOpacityControls } from "./layersConfig";
import { handleMapClick } from "./popups";
import { useGsiTerrainSource } from "maplibre-gl-gsi-terrain";
import maplibregl from "maplibre-gl";

const MapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  // 地形データ生成（地理院標高タイル）
  const gsiTerrainSource = useGsiTerrainSource(maplibregl.addProtocol);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = initMap(mapContainer.current);
    // 地形データ追加（type=raster-dem）

    map.on("load", () => {
      addOpacityControls(map);
      map.on("click", (e) => handleMapClick(e, map));

      // 地図上でマウスが移動した際のイベント
      map.on("mousemove", (e) => {
        // マウスカーソル以下に指定緊急避難場所レイヤーが存在するかどうかをチェック
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
        if (features.length > 0) {
          // 地物が存在する場合はカーソルをpointerに変更
          map.getCanvas().style.cursor = "pointer";
        } else {
          // 存在しない場合はデフォルト
          map.getCanvas().style.cursor = "";
        }
      });

      map.addSource("terrain", gsiTerrainSource);
      // 陰影図追加
      map.addLayer(
        {
          id: "hillshade",
          source: "terrain", // type=raster-demのsourceを指定
          type: "hillshade", // 陰影図レイヤー
          paint: {
            "hillshade-illumination-anchor": "map", // 陰影の方向の基準
            "hillshade-exaggeration": 0.2, // 陰影の強さ
          },
        },
        "hazard_jisuberi-layer" // どのレイヤーの手前に追加するかIDで指定
      );
      // 3D地形
      map.addControl(
        new maplibregl.TerrainControl({
          source: "terrain", // type="raster-dem"のsourceのID
          exaggeration: 1, // 標高を強調する倍率
        })
      );
    });

    return () => {
      map.remove(); // クリーンアップ
    };
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default MapComponent;
