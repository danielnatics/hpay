import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import RegistrationPage from "../pages/RegistrationPage.jsx";
import ParentPortal from "../pages/ParentPortal.jsx";
import StudentList from "../pages/StudentList.jsx";
import Landing from "../pages/Landing.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import Transactions from "../pages/Transactions.jsx";
import UpdatePassword from "../pages/UpdatePassword.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";

// Components
import Login from "../components/Login.jsx";
import Navbar from "../components/Navbar";
import MobileNav from "../components/MobileNav.jsx";
import MobileHeader from "../components/MobileHeader.jsx";
import Footer from "../components/Footer.jsx";
import ScrollToTop from "../components/ScrollToTop.jsx";
import Settings from "../components/Settings.jsx";


import mqtt from "mqtt";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Don't forget the CSS!
import "./App.css";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient.js";

// --- CONFIGURATION ---
const MQTT_CONFIG = {
  // HiveMQ Cloud WebSocket URL (Must start with wss:// and end with /mqtt)
  host: "wss://da94a822952744388c0b22dc008cbfa0.s1.eu.hivemq.cloud:8884/mqtt",
  options: {
    username: "HezTec",
    password: "Engrdahez@2005",
    clientId: "react_client_" + Math.random().toString(16).substring(2, 8),
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000,
  },
};

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const App = () => {
  const [client, setClient] = useState(null);
  const [connectStatus, setConnectStatus] = useState("Connecting...");
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [messages, setMessages] = useState([]);
  // const [payload, setPayload] = useState("");
  // const [studentData, setStudentData] = useState({
  //   date: "",
  //   name: "",
  //   id: "",
  //   bal: "",
  //   rfid: "", // This will be populated by the ESP32 scan
  // });
  // const [status, setStatus] = useState("Scan Card...");

  useEffect(() => {
    // 1. Initialize Connection
    // console.log("Connecting to HiveMQ Cloud...");
    const mqttClient = mqtt.connect(MQTT_CONFIG.host, MQTT_CONFIG.options);

    // 2. Event Listeners
    mqttClient.on("connect", () => {
      setConnectStatus("Connected");
      // Subscribe to the ESP32 output topic
      mqttClient.subscribe("esp32/registration_status");
      mqttClient.subscribe("esp32/new_tag_scanned");
    });

    mqttClient.on("error", (err) => {
      console.error("Connection error: ", err);
      setConnectStatus("Error: " + err.message);
      mqttClient.end();
    });

    mqttClient.on("message", (topic, message) => {
      // Add incoming message to the list
      if (topic === "esp32/registration_status") {
        const status = message.toString();
        if (status === "ALREADY_EXISTS") {
          toast.error("Error: This card is already registered!");
          // alert("Registration Failed: This card is already registered!");
        } else if (status === "SUCCESS") {
          toast.success("Student registered successfully!");
          // alert("Student Registered Successfully!");
        }
      }

      if (topic === "esp32/new_tag_scanned") {
        const scannedUid = message.toString();
        setStudentData((prev) => ({ ...prev, rfid: scannedUid }));
        setStatus("Tag Scanned! Complete the form to save.");
        setScannedUid(scannedUid);
      }
      // const note = `[${new Date().toLocaleTimeString()}] ${topic}: ${message.toString()}`;
      // setMessages((prev) => [note, ...prev]);
    });

    mqttClient.on("close", () => {
      setConnectStatus("Disconnected");
    });

    setClient(mqttClient);

    // 3. Cleanup on component unmount
    return () => {
      if (mqttClient) {
        mqttClient.end();
      }
    };
  }, []);

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    // 2. Listen for Auth Changes (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setRole(session?.user?.user_metadata?.role || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading H-PAY...
      </div>
    );

  const handleReconnect = () => {
    if (client) {
      console.log("Manually re-establishing connection...");
      client.reconnect();
    }
  };

  return (
    <BrowserRouter>
    <ScrollToTop/>
      <div className="flex flex-col min-h-screen pb-24 md:pb-0 ">
        <ToastContainer position="top-center" autoClose={2500} />
        <MobileHeader
          connectStatus={connectStatus}
          onReconnect={handleReconnect}
          role={role}
        />
        {session && (
          <Navbar
            connectStatus={connectStatus}
            onReconnect={handleReconnect}
            role={role}
          />
        )}
        <main className="flex-grow bg-emerald-50">
          <Routes>
            <Route
              path="/"
              element={
                !session ? (
                  <Landing />
                ) : role === "admin" ? (
                  <Navigate to="/admin" />
                ) : (
                  <Navigate to="/portal" />
                )
              }
            />
            <Route
              path="/login"
              element={
                !session ? (
                  <Login />
                ) : (
                  <Navigate to={role === "admin" ? "/admin" : "/portal"} />
                )
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword/>}/>
            <Route path="/update-password" element={<UpdatePassword/>}/>
            <Route path="/settings" element={<Settings role={role} />} />
            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                session && role === "admin" ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Protected Parent Routes */}
            <Route
              path="/portal"
              element={
                session && role === "parent" ? (
                  <ParentPortal />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            {/* THESE MUST MATCH THE LINKS IN YOUR DASHBOARD */}
            <Route
              path="/register"
              element={
                session && role === "admin" ? (
                  <RegistrationPage />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/studentLists"
              element={
                session && role === "admin" ? (
                  <StudentList />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/transactions"
              element={
                session && role === "admin" ? (
                  <Transactions />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Parent Portal */}
            <Route
              path="/portal"
              element={
                session && role === "parent" ? (
                  <ParentPortal />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            {/* <Route
              path="/landing"
              element={<Landing/>
              }
            /> */}
          </Routes>
        </main>
        <MobileNav role={role} />
        <Footer />
      </div>
      <>
        {/* <div class="flex justify-between bg-[#183603] text-white p-3">
        <h1 class="">H-Pay Admin Dashboard</h1>
        <div>{connectStatus}</div>
      </div> */}
        {/* <div class="p-8 flex flex-col justify-center items-center bg-[#90cf63]">
      

      </div> */}
      </>
    </BrowserRouter>
  );
};

export default App;
