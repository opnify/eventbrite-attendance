import React, { useEffect, useRef, useState } from "react"
import QrScanner from 'qr-scanner';
import QrScannerWorkerPath from '!!file-loader!../../node_modules/qr-scanner/qr-scanner-worker.min.js';

import Layout from "../components/layout"
import SEO from "../components/seo"

QrScanner.WORKER_PATH = QrScannerWorkerPath;

const debounce = (func, wait, immediate) => {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

let timeStamp = (dateTime) => {
  const padLeft = base => ('0' + base.toString()).slice(-2);

  let dFormat = [ padLeft(dateTime.getMonth()+1),
              padLeft(dateTime.getDate()),
              dateTime.getFullYear()].join('/')+
              ' at ' +
              [ padLeft(dateTime.getHours()),
                padLeft(dateTime.getMinutes())].join(':');
  
  return dFormat;
};

const IndexPage = () => {
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyilg571Q6cqJbmT1URr9d2S4FjCFM51_xY4EWR4URQE0p9JWw/exec";
  const videoElem = useRef(null);
  const QrResult = useRef(null);
  const warning = useRef(null);

  const [nameState, setNameState] = useState("");
  const [showWarning, setShowWarning] = useState({"text": "User already registered", "show": false});


  useEffect(() => {

    // Timeout to default data
    const resetText = () => setTimeout(() => {
      setShowWarning({...showWarning, "show": false});
      setNameState("");
    }, 4000);

    // Add to local storage when dom loaded
    (() => {
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
    })();

    // Update attendance time in local storage
    const updateStorage = (data) => {
      let dataLocalStorage = JSON.parse(localStorage.getItem('users'));
      let qrData = dataLocalStorage.map(record => record['Order #'].toString().includes(data)
        ? { ...record, ['Attendance Time']: timeStamp(new Date()) } : record);
      localStorage.setItem('users', JSON.stringify(qrData));
    }

    // Check code validation
    const checkCode = (data, records) => {
    let qrData = records.find(record => record['Order #'].toString().includes(data));

      if (qrData !== undefined) {
        let qrCode = qrData['Order #'].toString();
        let firstName = qrData['First Name'];
        let lastName = qrData['Last Name'];
        let AttendanceTime = qrData['Attendance Time'];

        if (records.length > 0 && data === qrCode && AttendanceTime === "") {
          updateData(data, records);
          setNameState(`Welcome, ${firstName} ${lastName}`);
        } else if (AttendanceTime !== "") {
          setShowWarning({...showWarning, "show": true});
        }
      } else {
        setShowWarning({"text": "QR Code not valid", "show": true});
      };

      clearTimeout(resetText());
      resetText();
    };

    // Update data
    const updateData = (data) => {
      let formData = new FormData();
      formData.append('Order #', data);

      fetch(`${SCRIPT_URL}?action=update`, {
        method: "POST",
        body: formData
      })
      .then(() => {
        updateStorage(data);
      })
      .catch(error => {
         setShowWarning({"text": "Please check internet connection", "show": true});
      });
    }

    // Get data
    const getData = data => {
      if (data) {
        data = data.toString().substring(0, 10);
        let dataLocalStorage = JSON.parse(localStorage.getItem('users'));
        checkCode(data, dataLocalStorage);
      }else{
        clearTimeout(resetText());
        resetText();
      }
      console.log("Scanned");
    }

    let scanner = new QrScanner(videoElem.current, debounce(getData, 3000, true));
    scanner.start();

  }, []);

  return (
    <Layout>
      <SEO title="Home" />
      <h4 className="header-hint">Scan the QR code that has sent to your email</h4>
      <div style={{opacity: showWarning.show ? "1" : "0"}} ref={warning}>{showWarning.text}</div>
      <div ref={QrResult}>{nameState != "" ? nameState : '\u00A0' }</div>
      <video id="qr-video" muted ref={videoElem}></video>
    </Layout>
  )
}

export default IndexPage;
