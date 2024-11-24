import React from "react";
import logo from "./logo.svg";
import { useState } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

import "./App.css";
const marks = [
  {
    value: 0,
    label: "0",
  },
  {
    value: 20,
    label: "20",
  },
  {
    value: 37,
    label: "37",
  },
  {
    value: 100,
    label: "100°C",
  },
];

function App() {
  const [tem, setTem] = useState<string>("nowTem");
  const [moisture, setMoisture] = useState<string>("Moisture");
  const [openAir, setOpenAir] = useState<boolean>(false);
  const [valueAir, setValueAir] = useState<number>(25);
  const [OutdoorLight, setOutdoorLight] = useState<boolean>(false);
  const [IndoorLight, setIndoorLight] = useState<boolean>(false);
  const [TestEnvironment, setTestEnvironment] = useState<string>("Normal");
  // outdoor light bulb
  const handleChange = (event: Event, newValue: number | number[]) => {
    setValueAir(newValue as number);
  };
  function valuetext(value: number) {
    return `${value}°C`;
  }
  return (
    <div className="min-h-s creen bg-black flex flex-col items-center min-h-screen m-0 p-0">
      <div className="flex flex-row bg-black justify-center items-center min-w-full">
        <img className=" w-6/12 h-auto" src="/Picture1.png"></img>
        <h1 className="text-3xl font-bold text-white">
          Control your Smart Home
        </h1>
      </div>
      <div className="flex flex-col rounded-3xl bg-slate-900 justify-center  w-4/5">
        <h1 className=" mt-6 text-3xl text-center font-bold text-cyan-500">
          Temperature Control
        </h1>
        <div className="flex flex-row items-center mt-auto ">
          <img className=" w-4/12 h-auto" src="/sk-1514-00.png"></img>
          <div className="felx flex-col">
            <h1 className="text-1xl font-bold text-white">
              Current Temperature : {tem}
            </h1>
            <h1 className="text-1xl font-bold text-white">
              Current Moisture : {moisture}
            </h1>
          </div>
        </div>
        {/* Air.jpg */}
        <div className="flex flex-row items-center mt-auto min-w-full">
          <img className=" w-4/12 h-auto" src="/Air.png"></img>
          <div className="felx flex-col">
            <h1 className="text-1xl font-bold text-cyan-500">
              Open Air conditioner
            </h1>
            <button
              className="bg-slate-500 text-sm text-white rounded-xl m-3 pr-4 pl-4 pt-2 pb-2"
              type="button"
              onClick={() => {
                setOpenAir(!openAir);
              }}
            >
              {openAir ? "Air Conditioner is On" : "Air Conditioner is Off"}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center text-center ">
          {openAir ? (
            <Box sx={{ width: "50%" }}>
              <Slider
                className="-mt-3"
                aria-label="Custom marks"
                defaultValue={20}
                getAriaValueText={valuetext}
                value={valueAir}
                onChange={handleChange}
                valueLabelDisplay="auto"
                marks={marks}
                sx={{
                  "& .MuiSlider-markLabel": {
                    color: "white", // Change text color
                    fontSize: "50%", // Adjust font size if needed
                  },
                }}
              />
            </Box>
          ) : (
            ""
          )}
        </div>
      </div>
      <div className="flex flex-col rounded-3xl bg-slate-900 justify-center mt-7 mb-5 w-4/5">
        <h1 className=" mt-6 text-3xl text-center font-bold text-cyan-500">
          Light Control
        </h1>
        <div className="flex flex-row items-center mt-auto ">
          <img className=" w-4/12 h-auto" src="/Light.png"></img>
          <div className="felx flex-col">
            <h1 className="text-1xl font-bold text-white">
              {OutdoorLight
                ? "Outdoor light bulb : on"
                : "Outdoor light bulb : off"}
            </h1>
            <h1 className="text-1xl font-bold text-white">
              {IndoorLight
                ? "Indoor light bulb : on"
                : "Indoor light bulb : off"}
            </h1>
          </div>
        </div>
        <div className="flex flex-row items-center mt-auto min-w-full">
          <img className=" w-4/12 h-auto" src="/Environment.png"></img>
          <div className="felx flex-col">
            <h1 className="text-1xl font-bold text-cyan-500">
              Home Environment
            </h1>
            <h1 className="text-1xl font-bold text-white">
              Current Environment : {TestEnvironment}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
