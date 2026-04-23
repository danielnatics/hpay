import mqtt from "mqtt";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Don't forget the CSS!
import { toast } from "react-toastify";
import { supabase, supabaseAdmin } from "../supabaseClient";
// --- CONFIGURATION ---
const MQTT_CONFIG = {
  // HiveMQ Cloud WebSocket URL (Must start with wss:// and end with /mqtt)
  host: "wss://da94a822952744388c0b22dc008cbfa0.s1.eu.hivemq.cloud:8884/mqtt",
  options: {
    username: "HezTec",
    password: "Engrdahez@2005",
    clientId: "react_client_" + Math.random().toString(16).substring(2, 8),
    reconnectPeriod: 5000,
  },
};

const RegistrationPage = () => {
  const [studentName, setStudentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState(""); // Independent state for easier clearing
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [connectStatus, setConnectStatus] = useState("Connecting...");
  const [messages, setMessages] = useState([]);
  const [payload, setPayload] = useState("");
  const [studentData, setStudentData] = useState({
    date: "",
    name: "",
    id: "",
    bal: "",
    gender: "",
    class: "",
    rfid: "", // This will be populated by the ESP32 scan
  });
  const [status, setStatus] = useState("Scan Card...");

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    // 1. Initialize Connection
    // console.log("Connecting to HiveMQ Cloud...");
    const mqttClient = mqtt.connect(MQTT_CONFIG.host, MQTT_CONFIG.options);

    // 2. Event Listeners
    mqttClient.on("connect", () => {
      setConnectStatus("Connected");
      // Subscribe to the ESP32 output topic
      //   mqttClient.subscribe("esp32/registration_status");
      mqttClient.subscribe("esp32/new_tag_scanned");
    });

    mqttClient.on("error", (err) => {
      console.error("Connection error: ", err);
      setConnectStatus("Error: " + err.message);
      mqttClient.end();
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === "esp32/new_tag_scanned") {
        const scannedUid = message.toString();
        setStudentData((prev) => ({ ...prev, rfid: scannedUid }));
        toast.success(`Card Scanned: ${scannedUid}`);
        setStatus("Tag Scanned! Complete the form to save.");
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

  const checkDuplicateCard = async (rfidUid) => {
    const { data, error } = await supabase
      .from("students")
      .select("name")
      .eq("rfid_uid", rfidUid)
      .maybeSingle();

    if (data) {
      // If data exists, the card is already taken
      return { exists: true, owner: data.name };
    }
    return { exists: false };
  };

  // ---- Main Registration Logic -----
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!studentData.rfid) {
      toast.warning("Please scan an RFID tag first!");
      return;
    }

    if (!studentData.name || !studentData.id || !parentEmail || !parentPhone) {
      toast.warning("Please fill in the Name and ID!");
      return;
    }
    setLoading(true); // Always set loading to true at start

    try {
      // 1. Check if the card is already assigned
      const isDuplicate = await checkDuplicateCard(studentData.rfid);
      if (isDuplicate.exists) {
        // Use THROW instead of RETURN to ensure 'finally' block runs
        throw new Error(
          `This card is already assigned to ${isDuplicate.owner}!`,
        );
      }

      let parentUid;
      const cleanEmail = parentEmail.toLowerCase().trim();

      // 1. Check if Parent already exists in your database
      const { data: existingParent, error: searchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (searchError) throw new Error("Search Error: " + searchError.message);

      if (existingParent) {
        parentUid = existingParent.id;
        toast.info("Existing parent found. Linking student...");
      } else {
        // 2. Create NEW Parent Auth Account
        toast.info("Creating new parent account...");
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: "password123", // Default password
            email_confirm: true, // Bypasses email verification
            user_metadata: {
              role: "parent",
              phone: parentPhone,
            },
            // email: cleanEmail,
            // password: "password123", // They can reset this later
            // options: { data: { role: "parent" }, initializeSession: false },
          });

        if (authError) throw authError;
        parentUid = authData.user.id;

        // 2. MANUAL PROFILE CREATION (Now that Trigger is gone)
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: parentUid,
            email: cleanEmail,
            phone: parentPhone,
            role: "parent",
          },
        ]);

        if (profileError)
          throw new Error("Could not create profile: " + profileError.message);
      }

      // 2. SAVE STUDENT
      const { error: studentError } = await supabase.from("students").insert([
        {
          name: studentData.name,
          rfid_uid: studentData.rfid,
          student_id: studentData.id,
          parent_id: parentUid,
          parent_email: cleanEmail,
          parent_phone: parentPhone,
          gender: studentData.gender,
          class: studentData.class,
          registration_date: formattedDate, // Your d/m/y format
          balance: 0, // New students always start at 0
        },
      ]);

      if (studentError) throw studentError;
      // if (error) {
      //   // If the card is already in the database, Supabase will return an error
      //   if (error.code === "23505") {
      //     toast.error("This card is already registered in the Cloud!");
      //   } else {
      //     toast.error(`Cloud Error: ${error.message}`);
      //   }
      //   return; // Exit function, don't notify ESP32
      // }

      // // 3. SEND TO ESP32 (Local SD Card Second)
      // const registrationPacket = {
      //   command: "REGISTER",
      //   name: studentData.name,
      //   date: formattedDate,
      //   id: studentData.id,
      //   rfid: studentData.rfid,
      //   firstLetter: firstLetter,
      // };

      // client.publish(
      //   "web/registration_cmd",
      //   JSON.stringify(registrationPacket),
      // );

      // 4. UI FEEDBACK
      toast.success("Registration Succesful!");
      setStatus("Registration successful!");

      // 5. CLEAR FORM
      setStudentData({ date: "", name: "", id: "", balance: "", rfid: "", gender: "", class: "" });
      setParentEmail("");
      setParentPhone("");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen pt-20 md:pt-30">
        <ToastContainer position="top-center" autoClose={2500} />
        {/* <div className="text-center text-emerald-500">{status}</div> */}
        <form
          onSubmit={handleRegister}
          className="max-w-md mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 space-y-4"
        >
          <div className="text-center pb-2">
            <h2 className="text-2xl font-black text-emerald-900 tracking-tight">
              Student Enrollment
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              HezTec HPay Systems
            </p>
          </div>

          {/* --- SECTION: Student Identity --- */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter Student Name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50 transition-all"
                value={studentData.name}
                onChange={(e) =>
                  setStudentData({ ...studentData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  School ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="ID-000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
                  value={studentData.id}
                  onChange={(e) =>
                    setStudentData({ ...studentData, id: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Class/Level
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50 text-slate-700"
                  value={studentData.class || ""}
                  onChange={(e) =>
                    setStudentData({ ...studentData, class: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="SSS 1">SSS 1</option>
                  <option value="SSS 2">SSS 2</option>
                  <option value="SSS 3">SSS 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- SECTION: Parent & Communication --- */}
          <div className="pt-2 space-y-3 border-t border-slate-50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Gender
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
                  value={studentData.gender || ""}
                  onChange={(e) =>
                    setStudentData({ ...studentData, gender: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Parent Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0813..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                Parent Email
              </label>
              <input
                type="email"
                required
                placeholder="guardian@email.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
          </div>

          {/* --- SECTION: Hardware Integration --- */}
          <div className="pt-2 space-y-1">
            <label className="text-xs font-bold text-slate-800 uppercase ml-1 flex items-center justify-between">
              RFID Tag UID
              {studentData.rfid ? (
                <span className="text-emerald-600 font-black animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Ready
                </span>
              ) : (
                <span className="text-slate-400 font-normal lowercase italic">
                  waiting for scan...
                </span>
              )}
            </label>
            <input
              type="text"
              readOnly
              placeholder="Scan card on ESP32..."
              value={studentData.rfid}
              className={`w-full px-4 py-3 rounded-xl border font-mono text-sm transition-all duration-500 ${
                studentData.rfid
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold shadow-inner"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic"
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !studentData.rfid}
            className={`w-full mt-2 font-black py-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-[0.98] ${
              loading || !studentData.rfid
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/50 hover:shadow-emerald-300/50"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 ">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ENROLLING...
              </div>
            ) : (
              "REGISTER STUDENT"
            )}
          </button>
        </form>{" "}
      </div>
    </>
  );
};
export default RegistrationPage;
