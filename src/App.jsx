import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Tesseract from "tesseract.js";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";

const scannerStyles = `
  #reader { width: 100% !important; }
  #reader video { width: 100% !important; height: 300px !important; object-fit: cover !important; }
  #reader img { display: none !important; }
  #reader__dashboard { display: none !important; }
`;

const CATEGORIES = [
  "Cellular",
  "Computers",
  "Device Servers/IO",
  "Loans",
  "Misc.",
  "Routers/Firewall/Sec/Remote Access",
  "Switches",
  "WiFi",
];

const LOCATIONS = [
  "Josh's",
  "Mike's",
  "Riley's",
  "Dennis's",
  "Doug's",
  "Storage",
  "Brian",
  "James",
  "Andrew's",
  "Tony Turner",
  "Vy's",
  "INS",
  "TAS",
  "Tim Wilborne's",
  "Redwood Materials",
  "Davide Pascucci/BrightIIoT",
];

const STATUSES = ["TR Owned", "Loaned Out", "Vendor Loan"];

function ScanAssetDetail({ asset, onDone }) {
  const [form, setForm] = useState({
    serialNumber: asset.serialNumber || "",
    vendor: asset.vendor || "",
    modelNumber: asset.modelNumber || "",
    category: asset.category || CATEGORIES[0],
    location: asset.location || LOCATIONS[0],
    status: asset.status || STATUSES[0],
    notes: asset.notes || "",
    loanDate: asset.loanDate || "",
    dueBack: asset.dueBack || "",
    returnedDate: asset.returnedDate || "",
    loanContact: asset.loanContact || "",
    customer: asset.customer || "",
    shipped: asset.shipped || "",
    trackingNumber: asset.trackingNumber || "",
  });
  const [quickLocation, setQuickLocation] = useState(form.location);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const inputStyle = { padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" };
  const labelStyle = { display: "block", marginTop: "0.75rem", fontWeight: "bold", fontSize: "0.9rem" };

  const handleUpdateLocation = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "assets", asset.id), { location: quickLocation, updatedAt: serverTimestamp() });
      setForm({ ...form, location: quickLocation });
      setMessage("Location updated!");
    } catch (err) {
      setMessage("Failed to update location.");
    }
    setSaving(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "assets", asset.id), { ...form, updatedAt: serverTimestamp() });
      setMessage("Changes saved!");
    } catch (err) {
      setMessage("Failed to save changes.");
    }
    setSaving(false);
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ padding: "0.75rem", background: "#e8f4fd", borderRadius: "8px", marginBottom: "0.75rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Quick Update Location</div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select style={{ ...inputStyle, flex: 1 }} value={quickLocation} onChange={(e) => setQuickLocation(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={handleUpdateLocation} disabled={saving} style={{ padding: "0.5rem 1rem", fontSize: "1rem", background: "#28a745", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
            {saving ? "..." : "Update Location"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: "0.5rem", padding: "0.5rem", background: message.includes("saved") || message.includes("updated") ? "#d4edda" : "#f8d7da", borderRadius: "6px", fontSize: "0.9rem" }}>
          {message}
        </div>
      )}

      <label style={labelStyle}>Serial Number</label>
      <input style={{ ...inputStyle, background: "#000", color: "#fff" }} value={form.serialNumber} readOnly />

      <label style={labelStyle}>Vendor</label>
      <input style={inputStyle} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />

      <label style={labelStyle}>Model Number</label>
      <input style={inputStyle} value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />

      <label style={labelStyle}>Category</label>
      <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label style={labelStyle}>Location</label>
      <select style={inputStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
        {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      <label style={labelStyle}>Status</label>
      <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={labelStyle}>Notes</label>
      <textarea style={{ ...inputStyle, minHeight: "60px" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <label style={labelStyle}>Loan Date</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.loanDate} onChange={(e) => setForm({ ...form, loanDate: e.target.value })} />
        <button onClick={() => setForm({ ...form, loanDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Clear</button>
      </div>

      <label style={labelStyle}>Due Back</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.dueBack} onChange={(e) => setForm({ ...form, dueBack: e.target.value })} />
        <button onClick={() => setForm({ ...form, dueBack: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Clear</button>
      </div>

      <label style={labelStyle}>Returned Date</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.returnedDate} onChange={(e) => setForm({ ...form, returnedDate: e.target.value })} />
        <button onClick={() => setForm({ ...form, returnedDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Clear</button>
      </div>

      <label style={labelStyle}>Loan Contact</label>
      <input style={inputStyle} value={form.loanContact} onChange={(e) => setForm({ ...form, loanContact: e.target.value })} />

      <label style={labelStyle}>Customer</label>
      <input style={inputStyle} value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />

      <label style={labelStyle}>Shipped</label>
      <input style={inputStyle} value={form.shipped} onChange={(e) => setForm({ ...form, shipped: e.target.value })} />

      <label style={labelStyle}>Tracking Number</label>
      <input style={inputStyle} value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", marginBottom: "1rem" }}>
        <button onClick={handleSaveAll} disabled={saving} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {saving ? "Saving..." : "Save All Changes"}
        </button>
        <button onClick={onDone} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem" }}>
          Scan Another
        </button>
      </div>
    </div>
  );
}

function ScanTab() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [existingAsset, setExistingAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    vendor: "",
    modelNumber: "",
    category: "",
    location: "",
    status: "",
    notes: "",
  });
  const [allAssets, setAllAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [serialInput, setSerialInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [ocrText, setOcrText] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

  const handleOcrCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrText(null);
    try {
      const { data: { text } } = await Tesseract.recognize(file, "eng");
      setOcrText(text.trim());
    } catch (err) {
      setError("Failed to read text from image.");
    }
    setOcrLoading(false);
    e.target.value = "";
  };

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "assets"));
        const list = [];
        const vendorSet = new Set();
        snap.forEach((d) => {
          const data = d.data();
          list.push({ id: d.id, ...data });
          if (data.vendor) vendorSet.add(data.vendor);
        });
        setAllAssets(list);
        setVendors([...vendorSet].sort());
      } catch (err) {
        console.error("Failed to load assets for autocomplete:", err);
      }
    })();
  }, []);

  const handleVideoClick = async (e) => {
    const video = document.querySelector("#reader video");
    if (!video || !video.srcObject) return;
    const track = video.srcObject.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities();
    if (!capabilities.focusMode) return;
    try {
      await track.applyConstraints({ advanced: [{ focusMode: "manual", focusDistance: capabilities.focusDistance?.min || 0 }] });
      await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
    } catch (err) {
      console.log("Focus not supported:", err);
    }
  };

  const startScan = async () => {
    setResult(null);
    setError(null);
    setConfirmed(false);
    setExistingAsset(null);
    setSaved(false);
    setScanning(true);

    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 150 }, formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
        (decodedText) => {
          setResult(decodedText);
          setScanning(false);
          html5QrCode.stop();
        },
        () => {}
      );
    } catch (err) {
      setError("Camera access denied or not available.");
      setScanning(false);
    }
  };

  const stopScan = () => {
    scannerRef.current?.stop();
    setScanning(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "assets", result);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setExistingAsset(snap.data());
      } else {
        setExistingAsset(null);
      }
      setConfirmed(true);
    } catch (err) {
      setError("Failed to look up asset.");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "assets", result), {
        serialNumber: result,
        ...form,
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } catch (err) {
      setError("Failed to save asset.");
    }
    setLoading(false);
  };

  const resetAll = () => {
    setResult(null);
    setConfirmed(false);
    setExistingAsset(null);
    setSaved(false);
    setError(null);
    setForm({ vendor: "", modelNumber: "", category: "", location: "", status: "", notes: "" });
    setSerialInput("");
    setSuggestions([]);
  };

  const inputStyle = { padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" };
  const labelStyle = { display: "block", marginTop: "0.75rem", fontWeight: "bold", fontSize: "0.9rem" };

  return (
    <div>
      <style>{scannerStyles}</style>
      {!scanning && !result && (
        <>
          <button onClick={startScan} style={{ padding: "1rem 2rem", fontSize: "1rem", display: "block", marginBottom: "1rem", width: "100%" }}>
            Start Scan
          </button>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Or type serial number..."
                value={serialInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSerialInput(val);
                  if (val.length >= 2) {
                    const lower = val.toLowerCase();
                    setSuggestions(allAssets.filter((a) => (a.serialNumber || "").toLowerCase().startsWith(lower)).slice(0, 8));
                  } else {
                    setSuggestions([]);
                  }
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && serialInput) { setSuggestions([]); setResult(serialInput); } }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => { if (serialInput) { setSuggestions([]); setResult(serialInput); } }}
                style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
                Go
              </button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ccc", borderRadius: "6px", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                {suggestions.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSuggestions([]);
                      setSerialInput("");
                      setResult(a.serialNumber);
                      setExistingAsset(a);
                      setConfirmed(true);
                    }}
                    style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.9rem" }}
                  >
                    <div style={{ fontWeight: "bold" }}>{a.serialNumber}</div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>{a.vendor} {a.modelNumber}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleOcrCapture} style={{ display: "none" }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrLoading}
            style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", fontSize: "1rem", width: "100%" }}
          >
            {ocrLoading ? "Reading text..." : "\ud83d\udcf7 Read Text"}
          </button>
          {ocrText !== null && (
            <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#e8f4fd", borderRadius: "8px" }}>
              <div style={{ fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Extracted text:</div>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                style={{ ...inputStyle, minHeight: "60px", marginBottom: "0.5rem" }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => { setSerialInput(ocrText); setOcrText(null); }}
                  style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
                >
                  Use as Serial
                </button>
                <button
                  onClick={() => { setSuggestions([]); setResult(ocrText); setOcrText(null); }}
                  style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
                >
                  Confirm
                </button>
                <button onClick={() => setOcrText(null)} style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ position: "relative", width: "100%", marginTop: "1rem" }}>
        <div id="reader" />
        {scanning && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              width: "280px",
              height: "100px",
              position: "relative",
              border: "2px solid rgba(255,255,255,0.3)"
            }}>
              <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: "3px solid white", borderLeft: "3px solid white" }} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: "3px solid white", borderRight: "3px solid white" }} />
              <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: "3px solid white", borderLeft: "3px solid white" }} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: "3px solid white", borderRight: "3px solid white" }} />
            </div>
          </div>
        )}
      </div>

      {scanning && (
        <button onClick={stopScan} style={{ marginTop: "1rem", padding: "0.5rem 1rem", width: "100%" }}>
          Cancel
        </button>
      )}

      {result && !confirmed && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#e8f4fd", borderRadius: "8px" }}>
          <strong>Serial:</strong> {result}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button onClick={handleConfirm} disabled={loading} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem" }}>
              {loading ? "Looking up..." : "Confirm"}
            </button>
            <button onClick={() => { resetAll(); startScan(); }} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem" }}>
              Rescan
            </button>
          </div>
        </div>
      )}

      {confirmed && existingAsset && !saved && (
        <ScanAssetDetail asset={{ id: result, ...existingAsset }} onDone={resetAll} />
      )}

      {confirmed && !existingAsset && !saved && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#fff3cd", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>New Asset: {result}</h3>

          <label style={labelStyle}>Vendor</label>
          <input style={inputStyle} list="vendor-suggestions" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <datalist id="vendor-suggestions">
            {vendors.map((v) => <option key={v} value={v} />)}
          </datalist>

          <label style={labelStyle}>Model Number</label>
          <input style={inputStyle} value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />

          <label style={labelStyle}>Category</label>
          <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="" disabled>Select category...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={labelStyle}>Location</label>
          <select style={inputStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
            <option value="" disabled>Select location...</option>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="" disabled>Select status...</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, minHeight: "60px" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button onClick={handleSave} disabled={loading} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem" }}>
              {loading ? "Saving..." : "Save Asset"}
            </button>
            <button onClick={resetAll} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#d4edda", borderRadius: "8px" }}>
          <div style={{ color: "green", fontWeight: "bold" }}>Asset saved!</div>
          <button onClick={resetAll} style={{ marginTop: "0.5rem", padding: "0.5rem 1.5rem" }}>
            Scan Another
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8d7da", borderRadius: "8px" }}>
          {error}
        </div>
      )}
    </div>
  );
}

function AssetDetail({ asset, onBack, onDeleted, onUpdated }) {
  const [form, setForm] = useState({
    serialNumber: asset.serialNumber || "",
    vendor: asset.vendor || "",
    modelNumber: asset.modelNumber || "",
    category: asset.category || CATEGORIES[0],
    location: asset.location || LOCATIONS[0],
    status: asset.status || STATUSES[0],
    notes: asset.notes || "",
    loanDate: asset.loanDate || "",
    dueBack: asset.dueBack || "",
    returnedDate: asset.returnedDate || "",
    loanContact: asset.loanContact || "",
    customer: asset.customer || "",
    shipped: asset.shipped || "",
    trackingNumber: asset.trackingNumber || "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  const inputStyle = { padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" };
  const labelStyle = { display: "block", marginTop: "0.75rem", fontWeight: "bold", fontSize: "0.9rem" };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "assets", asset.id), { ...form, updatedAt: serverTimestamp() });
      setMessage("Changes saved!");
      onUpdated({ ...asset, ...form });
    } catch (err) {
      setMessage("Failed to save changes.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this asset? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "assets", asset.id));
      onDeleted(asset.id);
    } catch (err) {
      setMessage("Failed to delete asset.");
      setDeleting(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} style={{ padding: "0.5rem 1rem", fontSize: "1rem", marginBottom: "0.5rem" }}>Back</button>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: "#dc3545", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {deleting ? "Deleting..." : "Delete Asset"}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: "0.5rem", padding: "0.5rem", background: message.includes("saved") ? "#d4edda" : "#f8d7da", borderRadius: "6px", fontSize: "0.9rem" }}>
          {message}
        </div>
      )}

      <label style={labelStyle}>Serial Number</label>
      <input style={{ ...inputStyle, background: "#000", color: "#fff" }} value={form.serialNumber} readOnly />

      <label style={labelStyle}>Vendor</label>
      <input style={inputStyle} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />

      <label style={labelStyle}>Model Number</label>
      <input style={inputStyle} value={form.modelNumber} onChange={(e) => setForm({ ...form, modelNumber: e.target.value })} />

      <label style={labelStyle}>Category</label>
      <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label style={labelStyle}>Location</label>
      <select style={inputStyle} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
        {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      <label style={labelStyle}>Status</label>
      <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label style={labelStyle}>Notes</label>
      <textarea style={{ ...inputStyle, minHeight: "60px" }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

      <label style={labelStyle}>Loan Date</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.loanDate} onChange={(e) => setForm({ ...form, loanDate: e.target.value })} />
        <button onClick={() => setForm({ ...form, loanDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Clear</button>
      </div>

      <label style={labelStyle}>Due Back</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.dueBack} onChange={(e) => setForm({ ...form, dueBack: e.target.value })} />
        <button onClick={() => setForm({ ...form, dueBack: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Clear</button>
      </div>

      <label style={labelStyle}>Returned Date</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.returnedDate} onChange={(e) => setForm({ ...form, returnedDate: e.target.value })} />
        <button onClick={() => setForm({ ...form, returnedDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Clear</button>
      </div>

      <label style={labelStyle}>Loan Contact</label>
      <input style={inputStyle} value={form.loanContact} onChange={(e) => setForm({ ...form, loanContact: e.target.value })} />

      <label style={labelStyle}>Customer</label>
      <input style={inputStyle} value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />

      <label style={labelStyle}>Shipped</label>
      <input style={inputStyle} value={form.shipped} onChange={(e) => setForm({ ...form, shipped: e.target.value })} />

      <label style={labelStyle}>Tracking Number</label>
      <input style={inputStyle} value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
    </div>
  );
}

function AssetsTab() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "assets"));
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setAssets(list);
      } catch (err) {
        console.error("Failed to load assets:", err);
      }
      setLoading(false);
    })();
  }, []);

  if (selected) {
    return (
      <AssetDetail
        asset={selected}
        onBack={() => setSelected(null)}
        onDeleted={(id) => { setAssets(assets.filter((a) => a.id !== id)); setSelected(null); }}
        onUpdated={(updated) => { setAssets(assets.map((a) => a.id === updated.id ? { ...a, ...updated } : a)); setSelected(updated); }}
      />
    );
  }

  const filtered = assets.filter((a) => {
    if (filter !== "All" && a.category !== filter) return false;
    if (locationFilter !== "All" && a.location !== locationFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(
        (a.vendor || "").toLowerCase().includes(s) ||
        (a.modelNumber || "").toLowerCase().includes(s) ||
        (a.serialNumber || "").toLowerCase().includes(s)
      )) return false;
    }
    return true;
  });

  const pillStyle = (active) => ({
    padding: "0.35rem 0.6rem",
    fontSize: "0.8rem",
    borderRadius: "16px",
    border: active ? "2px solid #007bff" : "1px solid #ccc",
    background: active ? "#007bff" : "#fff",
    color: active ? "#fff" : "#333",
    cursor: "pointer",
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search vendor, model, or serial..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "0.5rem" }}
      />
      <select
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "0.5rem" }}
      >
        <option value="All">All Locations</option>
        {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={pillStyle(filter === c)}>
            {c}
          </button>
        ))}
      </div>

      {loading && <div>Loading assets...</div>}

      <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        {!loading && filtered.length === 0 && <div style={{ color: "#888" }}>No assets found.</div>}
        {filtered.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelected(a)}
            style={{ padding: "0.75rem", marginBottom: "0.5rem", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #e9ecef", cursor: "pointer" }}
          >
            <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{a.vendor} {a.modelNumber}</div>
            <div style={{ fontSize: "0.85rem", color: "#555", marginTop: "0.25rem" }}>
              SN: {a.serialNumber}
            </div>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "#555", marginTop: "0.25rem" }}>
              <span>{a.location}</span>
              <span style={{
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                background: a.status === "TR Owned" ? "#d4edda" : a.status === "Loaned Out" ? "#fff3cd" : "#e8f4fd",
                fontSize: "0.8rem",
              }}>
                {a.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "traceroute" && password === "TR2026!") {
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "400px", margin: "0 auto", padding: "2rem", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <h1 style={{ fontSize: "1.4rem", marginBottom: "1.5rem", textAlign: "center" }}>Traceroute</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "0.75rem" }}
        />
        <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box", marginBottom: "1rem" }}
        />
        <button type="submit" style={{ padding: "0.75rem", fontSize: "1rem", width: "100%", background: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Log In
        </button>
      </form>
      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f8d7da", borderRadius: "6px", textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState("scan");

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  const navBtn = (name, label) => ({
    flex: 1,
    padding: "0.75rem",
    fontSize: "1rem",
    fontWeight: tab === name ? "bold" : "normal",
    background: tab === name ? "#007bff" : "#f8f9fa",
    color: tab === name ? "#fff" : "#333",
    border: "none",
    cursor: "pointer",
  });

  const navButtons = (
    <div style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
      <button style={navBtn("scan", "Scan")} onClick={() => setTab("scan")}>Scan</button>
      <button style={navBtn("assets", "Assets")} onClick={() => setTab("assets")}>Assets</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "500px", margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1rem 1rem 0" }}>
        <h1 style={{ margin: "0 0 1rem 0", fontSize: "1.4rem" }}>Traceroute</h1>
      </div>

      {navButtons}

      <div style={{ flex: 1, padding: "0 1rem 1rem", overflowY: "auto" }}>
        {tab === "scan" && <ScanTab />}
        {tab === "assets" && <AssetsTab />}
      </div>
    </div>
  );
}
