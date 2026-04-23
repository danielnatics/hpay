import mqtt from "mqtt";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Don't forget the CSS!
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";
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
      .single();

    if (data) {
      // If data exists, the card is already taken
      return { exists: true, owner: data.name };
    }
    return { exists: false };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); // Always set loading to true at start
    // 1. Check if the card is already in the Cloud
    const isDuplicate = await checkDuplicateCard(studentData.rfid);
    if (isDuplicate.exists) {
      toast.error(
        `Error: This card is already assigned to ${isDuplicate.owner}!`,
      );
      return; // STOP the registration here
    }
    // 1. Validation
    if (!studentData.rfid) {
      toast.warning("Please scan an RFID tag first!");
      return;
    }

    if (!studentData.name || !studentData.id) {
      toast.warning("Please fill in the Name and ID!");
      return;
    }

    try {
      let parentUid;

      // 1. Check if Parent already exists in your database
      // We check the 'profiles' table we created earlier
      const { data: existingParent, error: searchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", parentEmail.toLowerCase().trim())
        .maybeSingle()
      if (searchError) throw new Error("Search Error: " + searchError.message);

      if (existingParent) {
        parentUid = existingParent.id;
        toast.info("Existing parent found. Linking student...");
      } else {
        // 2. Create NEW Parent Auth Account
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: parentEmail.toLowerCase().trim(),
            password: "password", // They can reset this later
            options: { data: { role: "parent" }, initializeSession: false },
          },
        );

        if (authError) throw authError;
        parentUid = authData.user.id;

        // 3. Create the Parent Profile record
        // await supabase.from('profiles').insert([
        //   { id: parentUid, email: parentEmail, role: 'parent' }
        // ]);
      }

      // 2. SAVE STUDENT
      const { error: studentError } = await supabase.from("students").insert([
        {
          name: studentData.name,
          rfid_uid: studentData.rfid,
          student_id: studentData.id,
          parent_id: parentUid,
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
      setStudentData({ date: "", name: "", id: "", balance: "", rfid: "" });
      setParentEmail("");
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
          className="max-w-md mx-auto p-5 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4  shadow-emerald-900/5"
        >
          <div class="space-y-1 border-emerald-100 rounded-2xl ">
            <label class="text-sm font-medium text-emerald-900 shadow-xl shadow-emerald-900/5">
              Student Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Daniel Smith"
              required
              className="w-full border-emerald-200  border-emerald-200 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={studentData.name}
              onChange={(e) =>
                setStudentData({ ...studentData, name: e.target.value })
              }
            />
          </div>
          {/* Parent Info */}
          <div class="space-y-1 border-emerald-100 rounded-2xl ">
            <label class="text-sm font-medium text-emerald-900 shadow-xl shadow-emerald-900/5">
              Parent Email Addres
            </label>
            <input
              type="email"
              placeholder="parentemail@gmail.com"
              required
              className="w-full border-emerald-200  border-emerald-200 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium text-emerald-900">
              School ID Number
            </label>
            <input
              type="text"
              placeholder="ID-00000"
              required
              className="w-full border-emerald-200 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={studentData.id}
              onChange={(e) =>
                setStudentData({ ...studentData, id: e.target.value })
              }
            />
          </div>
          {/* <div class="space-y-1">
            <label class="text-sm font-medium text-emerald-900">Amount</label>
            <input
              type="text"
              placeholder="₦ 5000.00"
              required
              className="w-full border-emerald-200 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={studentData.balance}
              onChange={(e) =>
                setStudentData({ ...studentData, balance: e.target.value })
              }
            />
          </div> */}

          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-800">RFID UID</label>
            <input
              type="text"
              placeholder="Scan card now..."
              value={studentData.rfid}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-200 text-slate-500 cursor-not-allowed italic"
            />
            <p class="text-xs text-slate-400">
              Card detection is automatic when scanning.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading} // Disable while processing
            className={`w-full cursor-pointer mt-2 font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors ${
              loading ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"
            } text-white`}
          >
            {loading ? "Registering..." : "Complete Registration"}
          </button>
          {/* <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md shadow-emerald-100 transition-colors active:scale-[0.98]"
          >
            Complete Registration
          </button> */}
        </form>
      </div>
    </>
  );
};
export default RegistrationPage;
