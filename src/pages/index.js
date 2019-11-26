import React, { useEffect, useRef, useState } from "react";
import QrScanner from 'qr-scanner';
import QrScannerWorkerPath from '!!file-loader!../../node_modules/qr-scanner/qr-scanner-worker.min.js';

import debounce from '../helpers/debounce';
import timestamp from '../helpers/timestamp';

import Toaster from "../components/toaster";
import Layout from "../components/layout";
import SEO from "../components/seo";

import audioSuccess from "../components/sounds/Beep_success.mp3";
import audioWarning from "../components/sounds/Beep_warning.mp3";

QrScanner.WORKER_PATH = QrScannerWorkerPath;

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyilg571Q6cqJbmT1URr9d2S4FjCFM51_xY4EWR4URQE0p9JWw/exec";

// Toggle color name
const toggleNameColor = (green) => {
  if (green) {
    return "#03ac0e";
  } else {
    return "#30343A";
  }
};

const soundNotification = (sound) => {
  let success = new Audio(audioSuccess);
  let warning = new Audio(audioWarning);

  if (sound) {
    success.play();
  } else {
    warning.play();
  }
}

const IndexPage = () => {
  const [name, setName] = useState({ text: 'Scan the QR here!', color: toggleNameColor(false) });
  const [showWarning, setShowWarning] = useState({ text: '', show: false, type: 'warning' });
  const videoElem = useRef(null);
  const warningTimeout = useRef(undefined);
  const nameTimeout = useRef(undefined);

  useEffect(() => {
    if (showWarning.show) {
      clearTimeout(warningTimeout.current);
      warningTimeout.current = setTimeout(() => {
        setShowWarning({...showWarning, show: false});

        setName({text: 'Scan here!', color: toggleNameColor(false)});
      }, 3000);
    }
  }, [showWarning]);

  useEffect(() => {
    if (name.text !== 'Scan here!') {
      clearTimeout(nameTimeout.current);
      nameTimeout.current = setTimeout(() => {
        setName({text: 'Scan here!', color: toggleNameColor(false)});
      }, 3000);
    }
  }, [name]);
  
  useEffect(() => {
    // Add initial data to local storage when dom loaded
    localStorage.clear();
    if (!localStorage.getItem('users')) {
      fetch(`${SCRIPT_URL}?action=read`)
        .then(resp => resp.json())
        .then(json => {
          localStorage.setItem('users', JSON.stringify(json.records));
          scanner.start();
        })
        .catch(error => {
          localStorage.setItem('users', '[]');
        });
    }

    // Update attendance time in local storage
    const updateStorage = data => {
      const dataLocalStorage = JSON.parse(localStorage.getItem('users'));
      const qrData = dataLocalStorage.map(record => record['Order #'].toString().includes(data)
        ? { ...record, 'Attendance Time': timestamp(new Date()) }
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
          setName({text: `Welcome, ${firstName} ${lastName}`, color: toggleNameColor(true)});
          soundNotification(true);
        } else if (attendanceTime !== "") {
          setShowWarning({text: "You are already registered!", show: true, type: 'warning'});
        }
      } else {
        setShowWarning({text: "QR Code not valid", show: true, type: 'error'});
      };
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
          setShowWarning({text: "Failed to register. Please try again!", show: true});
        });
    }

    // Get data
    const getData = data => {
      if (data) {
        const qrData = data.toString().substring(0, 10);
        const dataLocalStorage = localStorage.getItem('users') && JSON.parse(localStorage.getItem('users'));

        checkCode(qrData, dataLocalStorage);
      }
      console.log("Scanned");
    }

    // QR Scanner init
    const scanner = new QrScanner(videoElem.current, debounce(getData, 2000, true));

  }, []);

  return (
    <Layout>
      <SEO title="Home" />
      <Toaster show={showWarning.show} text={showWarning.text} type={showWarning.type}/>

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