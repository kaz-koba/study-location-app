import React from "react";
import MapComponent from "./MapComponent";

const App: React.FC = () => {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>背景地図を表示する</h1>
      <MapComponent />
    </div>
  );
};

export default App;
