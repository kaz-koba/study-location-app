import React, { useEffect, useState } from "react";
import MapComponent from "./MapComponent";

const App: React.FC = () => {
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./sw.js")
        .then(() => setServiceWorkerRegistered(true))
        .catch(() => setServiceWorkerRegistered(false));
    }
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <h1>位置情報アプリケーション開発実践編</h1>
      <div style={{ width: "100vw", height: "calc(100vh - 2.5rem)" }}>
        {serviceWorkerRegistered ? (
          <MapComponent />
        ) : (
          <p>Service Workerの登録が必要です。</p>
        )}
      </div>
    </div>
  );
};

export default App;
