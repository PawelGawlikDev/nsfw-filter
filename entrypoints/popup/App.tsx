import wxtLogo from "/wxt.svg";
import "./App.css";
import { Slider } from "@/components/Slider";

function App() {
  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank" rel="noreferrer">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
      </div>
      <h1>NSFW Filter</h1>
      <Slider />
    </>
  );
}

export default App;
