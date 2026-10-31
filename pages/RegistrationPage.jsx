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

  const classCode = (className) => {
    const match = className.match(/^(JSS|SSS)\s*([1-3])$/i);
    if (!match) return "";
    return `${match[1].toLowerCase() === "sss" ? "ss" : "js"}${match[2]}`;
  };

  const generateStudentId = async (className) => {
    const code = classCode(className);
    if (!code) return "";

    const year = new Date().getFullYear();
    const prefix = `${year}${code}`;
    const { data, error } = await supabase
      .from("students")
      .select("student_id")
      .like("student_id", `${prefix}%`);

    if (error) {
      throw new Error(`Could not generate student ID: ${error.message}`);
    }

    const highestSerial = (data || []).reduce((highest, student) => {
      const match = student.student_id?.match(
        new RegExp(`^${prefix}(\\d{3})$`, "i"),
      );
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);

    return `${prefix}${String(highestSerial + 1).padStart(3, "0")}`;
  };

  const normalizeWhatsAppNumber = (value) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
    const digits = trimmed.replace(/\D/g, "");
    if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
    return `+${digits}`;
  };

  const createBootstrapPassword = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  };

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
      toast.warning("Please complete the student and parent details.");
      return;
    }
    const whatsappNumber = normalizeWhatsAppNumber(parentPhone);
    if (!/^\+\d{10,15}$/.test(whatsappNumber)) {
      toast.warning("Enter a valid WhatsApp number, for example +2348130000000.");
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
            password: createBootstrapPassword(),
            email_confirm: true, // Bypasses email verification
            user_metadata: {
              role: "parent",
              phone: whatsappNumber,
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
            phone: whatsappNumber,
            role: "parent",
          },
        ]);

        if (profileError)
          throw new Error("Could not create profile: " + profileError.message);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          { redirectTo: `${window.location.origin}/update-password` },
        );

        if (resetError) {
          throw new Error(
            `Parent was created, but the password setup email could not be sent: ${resetError.message}`,
          );
        }
      }

      // 2. SAVE STUDENT
      const { error: studentError } = await supabase.from("students").insert([
        {
          name: studentData.name,
          rfid_uid: studentData.rfid,
          student_id: studentData.id,
          parent_id: parentUid,
          parent_email: cleanEmail,
          parent_phone: whatsappNumber,
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
      toast.success(
        existingParent
          ? "Registration successful!"
          : "Registration successful. The parent must use the password setup email before signing in.",
      );
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
          className="mx-auto max-w-md space-y-4 rounded-3xl border border-blue-500/20 bg-[#0d1526]/95 p-6 text-white shadow-2xl shadow-blue-950/30 md:p-8"
        >
          <div className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-xl font-black shadow-lg shadow-blue-500/25">
              H
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Student Enrollment
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
              H-Pay School Payments
            </p>
          </div>

          {/* --- SECTION: Student Identity --- */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="ml-1 text-xs font-bold uppercase text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Enter Student Name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                value={studentData.name}
                onChange={(e) =>
                  setStudentData({ ...studentData, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold uppercase text-slate-300">
                  School ID
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  placeholder="Select class"
                  className="w-full rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 font-mono font-bold text-blue-200 outline-none"
                  value={studentData.id}
                />
              </div>
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold uppercase text-slate-300">
                  Class/Level
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  value={studentData.class || ""}
                  onChange={async (e) => {
                    const selectedClass = e.target.value;
                    try {
                      const id = await generateStudentId(selectedClass);
                      setStudentData((prev) => ({
                        ...prev,
                        class: selectedClass,
                        id,
                      }));
                    } catch (error) {
                      toast.error(error.message);
                    }
                  }}
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
          <div className="space-y-3 border-t border-white/10 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="ml-1 text-xs font-bold uppercase text-slate-300">
                  Gender
                </label>
                <select
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
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
                <label className="ml-1 text-xs font-bold uppercase text-slate-300">
                  Parent WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0813..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-xs font-bold uppercase text-slate-300">
                Parent Email
              </label>
              <input
                type="email"
                required
                placeholder="guardian@email.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
          </div>

          {/* --- SECTION: Hardware Integration --- */}
          <div className="space-y-1 pt-2">
            <label className="ml-1 flex items-center justify-between text-xs font-bold uppercase text-slate-300">
              Student Card ID
              {studentData.rfid ? (
                <span className="flex items-center gap-1 font-black text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"></span>
                  Ready
                </span>
              ) : (
                <span className="text-slate-400 font-normal lowercase italic">
                  scan card or type UID...
                </span>
              )}
            </label>
            <input
              type="text"
              placeholder="Scan or enter card ID..."
              value={studentData.rfid}
              onChange={(e) => {
                const val = e.target.value.trim().toUpperCase();
                setStudentData((prev) => ({ ...prev, rfid: val }));
                if (val) setStatus("Card UID Entered");
              }}
              className={`w-full px-4 py-3 rounded-xl border font-mono text-sm transition-all duration-300 ${studentData.rfid
                  ? "border-emerald-400 bg-emerald-500/10 font-bold text-emerald-200 shadow-inner"
                  : "border-white/10 bg-white/5 text-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !studentData.rfid}
            className={`w-full mt-2 font-black py-4 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-[0.98] ${loading || !studentData.rfid
                ? "cursor-not-allowed bg-slate-600 text-slate-400"
                : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-900/40 hover:from-blue-500 hover:to-cyan-400"
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
