import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "./firebaseConfig";

export default function GetData() {
  const [humidity, setHumidity] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [indoorLed, setIndoorLed] = useState<boolean>(false);
  const [outdoorLed, setOutdoorLed] = useState<boolean>(false);
  const [isSmoke, setIsSmoke] = useState<boolean>(false);

  useEffect(() => {
    const humidityRef = ref(database, "humidity");
    const temperatureRef = ref(database, "temperature");
    const indoorLedRef = ref(database, "indoorLed");
    const outdoorLedRef = ref(database, "outdoorLed");
    const isSmokeRef = ref(database, "isSmoke");

    // Set up real-time listeners for both humidity and temperature
    const unsubscribeHumidity = onValue(humidityRef, (snapshot) => {
      if (snapshot.exists()) {
        setHumidity(snapshot.val());
      } else {
        console.log("No Humidity data available");
      }
    });

    const unsubscribeindoorLed = onValue(indoorLedRef, (snapshot) => {
      if (snapshot.exists()) {
        setIndoorLed(snapshot.val());
      } else {
        console.log("No indoorLed data available");
      }
    });

    const unsubscribeOutdoorLed = onValue(outdoorLedRef, (snapshot) => {
      if (snapshot.exists()) {
        setOutdoorLed(snapshot.val());
      } else {
        console.log("No OutdoorLed data available");
      }
    });

    const unsubscribeIsSmoke = onValue(isSmokeRef, (snapshot) => {
      if (snapshot.exists()) {
        setIsSmoke(snapshot.val());
      } else {
        console.log("No IsSmoke data available");
      }
    });

    const unsubscribeTemperature = onValue(temperatureRef, (snapshot) => {
      if (snapshot.exists()) {
        setTemperature(snapshot.val());
      } else {
        console.log("No temperature data available");
      }
    });

    // Clean up listeners when the component unmounts
    return () => {
      unsubscribeHumidity();
      unsubscribeTemperature();
      unsubscribeOutdoorLed();
      unsubscribeindoorLed();
      unsubscribeIsSmoke();
    };
  }, []);

  return {
    humidity,
    temperature,
    outdoorLed,
    indoorLed,
    isSmoke,
  };
}
