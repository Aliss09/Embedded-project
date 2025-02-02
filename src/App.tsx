import React, { useEffect } from "react";
import logo from "./logo.svg";
import { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import GetData from "./GetData";
import { ref, set } from "firebase/database";
import { database } from "./firebaseConfig";
import Snackbar from "@mui/material/Snackbar";

import "./App.css";
import AiAssistant from "./components/tss";
const marks = [
  {
    value: 35,
    label: "35°C",
  },
  {
    value: 15,
    label: "15°C",
  },
  {
    value: 40,
    label: "40°C",
  },
  {
    value: 25,
    label: "25°C",
  },
];

interface googleSheetData {
  name: string;
  //   setNavbarIsOpen: (newvalue: Boolean) => void;
  timestamp: string;
}

function App() {
  const [tem, setTem] = useState<string>("nowTem");
  const [moisture, setMoisture] = useState<string>("Moisture");
  const [openAir, setOpenAir] = useState<boolean>(false);
  const [valueAir, setValueAir] = useState<number>(25);
  const [OutdoorLight, setOutdoorLight] = useState<boolean>(false);
  const [IndoorLight, setIndoorLight] = useState<boolean>(false);
  const [TestEnvironment, setTestEnvironment] = useState<string>("Normal");
  // const [SheetData, setSheetData] = useState<googleSheetData[]>([]);
  // const [SheetDataLenght, setSheetDataLenght] = useState<number>(99999);
  const {
    humidity,
    temperature,
    indoorLed,
    outdoorLed,
    isSmoke,
    isAir,
    airTemp,
  } = GetData();
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  useEffect(() => {
    setOpenAir(isAir);
    console.log(isAir);
  }, [isAir]);

  useEffect(() => {
    setValueAir(airTemp);
    console.log(airTemp);
  }, [airTemp]);

  // useEffect(() => {
  //   setSnackbarMessage(`Temperature changed: ${temperature}°C`);
  //   setSnackbarOpen(true); // Open the Snackbar when temperature changes
  // }, [temperature]);

  const sheetDataRef = useRef<googleSheetData[]>([]);
  const SheetDataLenghtRef = useRef<number>(Infinity);

  useEffect(() => {
    const fetchData = () => {
      fetch(
        "https://script.google.com/macros/s/AKfycbxRXLzij7I_XLes4A4TS2Cl0AECTi0CVHFtcg20ndLwPpaSWvLhmeAhrvbPeg94XwMt/exec"
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("d", data.data);
          sheetDataRef.current = data.data;

          // const date = new Date(data.data.at(1).timestamp);
          // console.log(date);
        })
        .then(() => {
          console.log("6666666666");
          if (SheetDataLenghtRef.current < sheetDataRef.current.length) {
            const date = new Date(
              sheetDataRef.current[sheetDataRef.current.length - 1].timestamp
            );
            const showDate = date.toLocaleString("en-US", {
              hour: "numeric",
              minute: "numeric",
            });
            const name =
              sheetDataRef.current[sheetDataRef.current.length - 1].name;
            setSnackbarMessage(`${name} come in: ${showDate}`);
            setSnackbarOpen(true);
            SheetDataLenghtRef.current = sheetDataRef.current.length;
            // setSheetDataLenght(SheetData.length);
            console.log("55555555555555");
          } else {
            console.log("7777777777777");
            SheetDataLenghtRef.current = sheetDataRef.current.length;
            console.log(
              SheetDataLenghtRef.current,
              sheetDataRef.current.length
            );
            // setSheetDataLenght(2);
            // console.log(SheetDataLenght);
          }
        })
        // .then(() => console.log(leanghtNow))
        .catch((error) => console.error("Error fetching data:", error));
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // ฟังก์ชันสำหรับการเขียนข้อมูลไปยัง Firebase
  // function writeDataToFirebase(humidity: number, temperature: number) {
  //   // ระบุ path ในฐานข้อมูลที่จะเขียนข้อมูลไป
  //   const humidityRef = ref(database, "humidity");
  //   const temperatureRef = ref(database, "temperature");

  //   // ใช้ set() เพื่อเขียนข้อมูลใหม่ไปยัง path นั้น
  //   set(humidityRef, {
  //     humidity: humidity,
  //   });
  // }
  const writeDataToFirebase = async (
    event: Event,
    newValue: number | number[]
  ) => {
    // const humidityRef = ref(database, "humidity");
    const temperatureRef = ref(database, "airTemp");
    await set(temperatureRef, newValue);
  };

  const writeDataToFirebaseAir = async () => {
    // const humidityRef = ref(database, "humidity");
    const newAir = !openAir;
    setOpenAir(newAir);
    const temperatureAirRef = ref(database, "isAir");
    await set(temperatureAirRef, newAir);
  };

  // outdoor light bulb
  // const handleChange = async (event: Event, newValue: number | number[]) => {
  //   setValueAir(newValue as number); // อัปเดตค่าใน state
  //   await writeDataToFirebase(); // เขียนข้อมูลใหม่ไปยัง Firebase
  // };
  function valuetext(value: number) {
    return `${value}°C`;
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
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
            <h1 className="text-1xl font-bold text-white ">
              Current Temperature : {temperature}°C
            </h1>
            <h1 className="text-1xl font-bold text-white">
              Current Moisture : {humidity} %
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
                writeDataToFirebaseAir();
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
                value={valueAir}
                defaultValue={valueAir}
                max={40}
                min={15}
                getAriaValueText={valuetext}
                onChange={writeDataToFirebase}
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
      <div className="flex flex-col rounded-3xl bg-slate-900 justify-center mt-7 mb-36 w-4/5">
        <h1 className=" mt-6 text-3xl text-center font-bold text-cyan-500">
          Light Control
        </h1>
        <div className="flex flex-row items-center mt-auto ">
          <img className=" w-4/12 h-auto" src="/Light.png"></img>
          <div className="felx flex-col">
            <h1 className="text-1xl font-bold text-white">
              {outdoorLed
                ? "Outdoor light bulb : on"
                : "Outdoor light bulb : off"}
            </h1>
            <h1 className="text-1xl font-bold text-white">
              {indoorLed ? "Indoor light bulb : on" : "Indoor light bulb : off"}
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
              Current Environment : {isSmoke ? "Danger" : "Normal"}
            </h1>
          </div>
        </div>
      </div>
      <AiAssistant />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "#15085d", // Change background color
            color: "#fff", // Change text color
          },
        }}
      />
    </div>
  );
}

export default App;
