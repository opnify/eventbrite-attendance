import React, { useEffect, useRef, useState } from "react"
import QrScanner from 'qr-scanner';
import QrScannerWorkerPath from '!!file-loader!../../node_modules/qr-scanner/qr-scanner-worker.min.js';
import Toaster from "../components/toaster"

import Layout from "../components/layout"
import SEO from "../components/seo"

QrScanner.WORKER_PATH = QrScannerWorkerPath;

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyilg571Q6cqJbmT1URr9d2S4FjCFM51_xY4EWR4URQE0p9JWw/exec";

// Utils
const debounce = (func, wait, immediate) => {
  let timeout;
  return function() {
    let context = this,
        args = arguments;
    let later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

const timeStamp = dateTime => {
  const padLeft = base => ('0' + base.toString()).slice(-2);
  const dateFormat = [ padLeft(dateTime.getMonth()+1), padLeft(dateTime.getDate()), dateTime.getFullYear() ].join('/');
  const timeFormat = [ padLeft(dateTime.getHours()), padLeft(dateTime.getMinutes()) ].join(':');
  
  return `${dateFormat} at ${timeFormat}`;
};

const IndexPage = () => {
  const videoElem = useRef(null);
  const warning = useRef(null);

  // Toggle color name
  const toggleNameColor = (green) => {
    if (green) {
      return "#03ac0e";
    } else {
      return "#30343A";
    }
  };

  // States
  const [name, setName] = useState({"text": "Scan here!", "color": toggleNameColor(false)});
  const [showWarning, setShowWarning] = useState({"text": "", "show": false});
  let resetText;

  useEffect(() => {
    resetText = () => setTimeout(() => {
      if (showWarning.show) {
        setShowWarning({...showWarning, "show": false});
      }

      setName({"text": "Scan here!", "color": toggleNameColor(false)});
    }, 3000);
  }, [showWarning]);

  // Timeout to default data

  // Add to local storage when dom loaded
  localStorage.clear();
  if (!localStorage.getItem('users')) {
    fetch(`${SCRIPT_URL}?action=read`)
    .then(resp => resp.json())
    .then(json => {
      localStorage.setItem('users', JSON.stringify(json.records));
    })
    .catch(error => {
      localStorage.setItem('users', '[]');
    });
  }

  // Update attendance time in local storage
  const updateStorage = data => {
    const dataLocalStorage = JSON.parse(localStorage.getItem('users'));
    const qrData = dataLocalStorage.map(record => record['Order #'].toString().includes(data)
      ? { ...record, ['Attendance Time']: timeStamp(new Date()) }
      : record);
    localStorage.setItem('users', JSON.stringify(qrData));
  }

  // Check code validation
  const checkCode = (data, records) => {
    let qrData = records.find(record => record['Order #'].toString().includes(data));

    if (qrData !== undefined) {
      const qrCode = qrData['Order #'].toString();
      const firstName = qrData['First Name'];
      const lastName = qrData['Last Name'];
      const attendanceTime = qrData['Attendance Time'];

      if (records.length > 0 && data === qrCode && attendanceTime === "") {
        updateData(data, records);
        setName({"text": `Welcome, ${firstName} ${lastName}`, "color": toggleNameColor(true)});
      } else if (attendanceTime !== "") {
        setShowWarning({"text": "You are already registered!", "show": true});
      }
    } else {
      setShowWarning({"text": "QR Code not valid", "show": true});
    };

    clearTimeout(resetText());
    resetText();
  };

  // Update data
  const updateData = data => {
    const formData = new FormData();
    formData.append('Order #', data);

    fetch(`${SCRIPT_URL}?action=update`, {
      method: "POST",
      body: formData
    })
    .then(() => {
      updateStorage(data);
    })
    .catch(error => {
       setShowWarning({"text": "Failed to register. Please try again!", "show": true});
    });
  }

  // Get data
  const getData = data => {
    if (data) {
      data = data.toString().substring(0, 10);
      let dataLocalStorage = JSON.parse(localStorage.getItem('users'));
      checkCode(data, dataLocalStorage);
    } else {
      clearTimeout(resetText());
      resetText();
    }
    console.log("Scanned");
  }
  
  useEffect(() => {

    let scanner = new QrScanner(videoElem.current, debounce(getData, 2500, true));
    scanner.start();

  }, []);

  return (
    <Layout>
      <SEO title="Home" />
      <Toaster show={showWarning.show} text={showWarning.text}/>

      <h4 className="head-text" style={{color: name.color}}>{name.text}</h4>
      <div className="frame-bg">
        <div className="frame-video">
          <div className="video-wrapper">
            <video id="qr-video" muted ref={videoElem}></video>
          </div>
          <div className="char toped"></div>
          <div className="char dot"></div>
        </div>
      </div>
    </Layout>
  )
}

export default IndexPage;
