import maplibregl from "maplibre-gl";
import OpacityControl from "maplibre-gl-opacity";
import distance from "@turf/distance";

export const addOpacityControls = (map: maplibregl.Map) => {
  const opacity = new OpacityControl({
    baseLayers: {
      "hazard-flood-layer": "洪水浸水想定区域",
      "hazard-hightide-layer": "高潮浸水想定区域",
      "hazard-tsunami-layer": "津波浸水想定区域",
      "hazard-doseki-layer": "土石流警戒区域",
      "hazard-kyukeisha-layer": "急傾斜警戒区域",
      "hazard-jisuberi-layer": "地滑り警戒区域",
    },
  });
  map.addControl(opacity, "top-left");

  const opacitySkhb = new OpacityControl({
    baseLayers: {
      "skhb-1-layer": "洪水",
      "skhb-2-layer": "崖崩れ/土石流/地滑り",
      "skhb-3-layer": "高潮",
      "skhb-4-layer": "地震",
      "skhb-5-layer": "津波",
      "skhb-6-layer": "大規模な火事",
      "skhb-7-layer": "内水氾濫",
      "skhb-8-layer": "火山現象",
    },
  });
  map.addControl(opacitySkhb, "top-right");

  // ユーザーの最新の現在地を保存する変数
  let userLocation: [number, number] | null = null;

  // MapLibre GL JSの現在地取得機能
  const geolocationControl = new maplibregl.GeolocateControl({
    trackUserLocation: true,
  });

  // 地図にコントロールを追加
  map.addControl(geolocationControl, "bottom-right");

  // 現在地が更新された際のイベントリスナー
  geolocationControl.on("geolocate", (e: GeolocationPosition) => {
    // 位置情報を更新
    userLocation = [e.coords.longitude, e.coords.latitude];

    // 地図をユーザーの現在地に移動
    if (userLocation) {
      map.flyTo({
        center: userLocation,
        zoom: 15, // ズームレベルを指定 (任意で調整)
      });
    }
  });

  /**
   * filter を持つレイヤーかどうかを判定する型ガード
   */
  function hasFilter(
    layer: maplibregl.LayerSpecification
  ): layer is
    | maplibregl.FillLayerSpecification
    | maplibregl.LineLayerSpecification
    | maplibregl.SymbolLayerSpecification {
    return "filter" in layer;
  }

  /**
   * 現在選択されている指定緊急避難場所レイヤー(skhb)を特定しそのfilter条件を返す
   */
  const getCurrentSkhbLayerFilter = ():
    | (string | number | boolean)[][]
    | null => {
    const style = map.getStyle(); // style定義を取得

    // skhbから始まるレイヤーを抽出
    const skhbLayers = style.layers.filter(
      (layer: maplibregl.LayerSpecification) => layer.id.startsWith("skhb")
    );

    // 表示中のレイヤーを抽出
    const visibleSkhbLayers = skhbLayers.filter(
      (layer: maplibregl.LayerSpecification) =>
        layer.layout?.visibility === "visible" && hasFilter(layer)
    );

    // 表示中レイヤーのfilter条件を返す
    return visibleSkhbLayers.length > 0 && hasFilter(visibleSkhbLayers[0]) && Array.isArray(visibleSkhbLayers[0].filter) ? visibleSkhbLayers[0].filter as (string | number | boolean)[][] : null;
  };

  type FeatureWithDistance = maplibregl.MapGeoJSONFeature & {
    properties: {
      dist?: number;
      [key: string]: unknown;
    };
  };

  /**
   * 経緯度を渡すと最寄りの指定緊急避難場所を返す
   */
  const getNearestFeature = (
    longitude: number,
    latitude: number
  ): FeatureWithDistance | null => {
    // 現在表示中の指定緊急避難場所のタイルデータ（＝地物）を取得する
    const currentSkhbLayerFilter = getCurrentSkhbLayerFilter();

    const features: maplibregl.MapGeoJSONFeature[] = map.querySourceFeatures(
      "skhb",
      {
        sourceLayer: "skhb",
        filter: currentSkhbLayerFilter || [], // 表示中のレイヤーのfilter条件に合致する地物のみを抽出
      }
    );

    // featuresが空の場合はnullを返す
    if (features.length === 0) {
      return null;
    }

    // 現在地に最も近い地物を見つける
    const nearestFeature = features.reduce<FeatureWithDistance | null>(
      (minDistFeature, feature) => {
        const dist = distance(
          [longitude, latitude],
          (feature.geometry as GeoJSON.Point).coordinates
        );

        if (
          minDistFeature === null ||
          (minDistFeature.properties.dist ?? Infinity) > dist
        ) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              dist,
            },
            geometry: feature.geometry,
            id: feature.id,
            type: feature.type,
            _geometry: feature._geometry,
            _vectorTileFeature: feature._vectorTileFeature,
            layer: feature.layer,
            source: feature.source,
            sourceLayer: feature.sourceLayer,
            state: feature.state,
            toJSON: feature.toJSON,
          };
        }
        return minDistFeature;
      },
      null
    );

    return nearestFeature;
  };

  map.on("render", () => {
    // GeolocationControlがオフなら現在位置を消去する
    if (geolocationControl._watchState === "OFF") userLocation = null;

    // ズームが一定値以下または現在地が計算されていない場合はラインを消去する
    if (map.getZoom() < 7 || userLocation === null) {
      const routeSource = map.getSource("route");
      if (routeSource) {
        (routeSource as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      return;
    }

    // 現在地の最寄りの地物を取得
    const nearestFeature = getNearestFeature(userLocation[0], userLocation[1]);

    // 現在地と最寄りの地物をつないだラインのGeoJSON-Feature
    if (nearestFeature) {
      const routeFeature: GeoJSON.Feature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [userLocation, (nearestFeature.geometry as GeoJSON.Point).coordinates],
        },
        properties: {},
      };

      // style.sources.routeのGeoJSONデータを更新する
      const routeSource = map.getSource("route");
      if (routeSource) {
        (routeSource as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [routeFeature],
        });
      }
    }
  });
};
