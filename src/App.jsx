import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";

const T = {
  bg: "#000000",
  accent: "#E8722A",
  card: "#1E1E1E",
  dark: "#2A2A2A",
  text: "#FFFFFF",
  muted: "#AAAAAA",
  border: "#333",
  darkAccent: "#C4601F",
};

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

  const inputStyle = { padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", background: T.card, color: T.text };
  const labelStyle = { display: "block", marginTop: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", color: T.text };

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
      <div style={{ padding: "0.75rem", background: T.dark, borderRadius: "8px", marginBottom: "0.75rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: T.text }}>Quick Update Location</div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select style={{ ...inputStyle, flex: 1 }} value={quickLocation} onChange={(e) => setQuickLocation(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={handleUpdateLocation} disabled={saving} style={{ padding: "0.5rem 1rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
            {saving ? "..." : "Update Location"}
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: "0.5rem", padding: "0.5rem", background: message.includes("saved") || message.includes("updated") ? T.dark : "#5a1a1a", borderRadius: "6px", fontSize: "0.9rem", color: message.includes("saved") || message.includes("updated") ? T.accent : "#ff6b6b" }}>
          {message}
        </div>
      )}

      <label style={labelStyle}>Serial Number</label>
      <input style={{ ...inputStyle, background: "#000", color: "#fff", border: `1px solid ${T.accent}` }} value={form.serialNumber} readOnly />

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
        <button onClick={() => setForm({ ...form, loanDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: T.dark, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "4px", cursor: "pointer" }}>Clear</button>
      </div>

      <label style={labelStyle}>Due Back</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.dueBack} onChange={(e) => setForm({ ...form, dueBack: e.target.value })} />
        <button onClick={() => setForm({ ...form, dueBack: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: T.dark, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "4px", cursor: "pointer" }}>Clear</button>
      </div>

      <label style={labelStyle}>Returned Date</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.returnedDate} onChange={(e) => setForm({ ...form, returnedDate: e.target.value })} />
        <button onClick={() => setForm({ ...form, returnedDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: T.dark, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "4px", cursor: "pointer" }}>Clear</button>
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
        <button onClick={handleSaveAll} disabled={saving} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {saving ? "Saving..." : "Save All Changes"}
        </button>
        <button onClick={onDone} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.dark, color: T.text, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer" }}>
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
  const scannerRef = useRef(null);

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

  const inputStyle = { padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", background: T.card, color: T.text };
  const labelStyle = { display: "block", marginTop: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", color: T.text };

  return (
    <div>
      <style>{scannerStyles}</style>
      {!scanning && !result && (
        <>
          <button onClick={startScan} style={{ padding: "1rem 2rem", fontSize: "1rem", display: "block", marginBottom: "1rem", width: "100%", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
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
                style={{ padding: "0.5rem 1rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Go
              </button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.card, border: `1px solid ${T.border}`, borderRadius: "6px", zIndex: 10, maxHeight: "200px", overflowY: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
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
                    style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: `1px solid ${T.border}`, fontSize: "0.9rem", color: T.text }}
                  >
                    <div style={{ fontWeight: "bold" }}>{a.serialNumber}</div>
                    <div style={{ fontSize: "0.8rem", color: T.muted }}>{a.vendor} {a.modelNumber}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <button onClick={stopScan} style={{ marginTop: "1rem", padding: "0.5rem 1rem", width: "100%", background: T.dark, color: T.text, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer" }}>
          Cancel
        </button>
      )}

      {result && !confirmed && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: T.dark, borderRadius: "8px", color: T.text }}>
          <strong>Serial:</strong> {result}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button onClick={handleConfirm} disabled={loading} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              {loading ? "Looking up..." : "Confirm"}
            </button>
            <button onClick={() => { resetAll(); startScan(); }} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer" }}>
              Rescan
            </button>
          </div>
        </div>
      )}

      {confirmed && existingAsset && !saved && (
        <ScanAssetDetail asset={{ id: result, ...existingAsset }} onDone={resetAll} />
      )}

      {confirmed && !existingAsset && !saved && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: T.dark, borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: T.accent }}>New Asset: {result}</h3>

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
            <button onClick={handleSave} disabled={loading} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              {loading ? "Saving..." : "Save Asset"}
            </button>
            <button onClick={resetAll} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: T.dark, borderRadius: "8px" }}>
          <div style={{ color: T.accent, fontWeight: "bold" }}>Asset saved!</div>
          <button onClick={resetAll} style={{ marginTop: "0.5rem", padding: "0.5rem 1.5rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Scan Another
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "#5a1a1a", borderRadius: "8px", color: "#ff6b6b" }}>
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

  const inputStyle = { padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", background: T.card, color: T.text };
  const labelStyle = { display: "block", marginTop: "0.75rem", fontWeight: "bold", fontSize: "0.9rem", color: T.text };

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
      <button onClick={onBack} style={{ padding: "0.5rem 1rem", fontSize: "1rem", marginBottom: "0.5rem", background: T.dark, color: T.text, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer" }}>Back</button>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: "#dc3545", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          {deleting ? "Deleting..." : "Delete Asset"}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: "0.5rem", padding: "0.5rem", background: message.includes("saved") ? T.dark : "#5a1a1a", borderRadius: "6px", fontSize: "0.9rem", color: message.includes("saved") ? T.accent : "#ff6b6b" }}>
          {message}
        </div>
      )}

      <label style={labelStyle}>Serial Number</label>
      <input style={{ ...inputStyle, background: "#000", color: "#fff", border: `1px solid ${T.accent}` }} value={form.serialNumber} readOnly />

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
        <button onClick={() => setForm({ ...form, loanDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: T.dark, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "4px", cursor: "pointer" }}>Clear</button>
      </div>

      <label style={labelStyle}>Due Back</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.dueBack} onChange={(e) => setForm({ ...form, dueBack: e.target.value })} />
        <button onClick={() => setForm({ ...form, dueBack: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: T.dark, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "4px", cursor: "pointer" }}>Clear</button>
      </div>

      <label style={labelStyle}>Returned Date</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input type="date" style={{ ...inputStyle, flex: 1 }} value={form.returnedDate} onChange={(e) => setForm({ ...form, returnedDate: e.target.value })} />
        <button onClick={() => setForm({ ...form, returnedDate: "" })} style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem", background: T.dark, color: T.muted, border: `1px solid ${T.border}`, borderRadius: "4px", cursor: "pointer" }}>Clear</button>
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

const CATEGORY_HEADERS = {
  "loans": "Loans",
  "switches": "Switches",
  "wifi": "WiFi",
  "computers": "Computers",
  "cellular": "Cellular",
  "routers": "Routers/Firewall/Sec/Remote Access",
  "device servers": "Device Servers/IO",
  "misc": "Misc.",
};

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;

  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          currentField += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentField += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentField.trim());
          currentField = "";
        } else {
          currentField += ch;
        }
      }
    }
    if (inQuotes) {
      currentField += "\n";
    } else {
      currentRow.push(currentField.trim());
      currentField = "";
      rows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0 || currentField) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
}

function processCSVRows(rows) {
  const results = [];
  let currentCategory = "";
  let importCounter = 0;
  const snCounts = {};

  for (const cols of rows) {
    const firstCol = (cols[0] || "").trim();
    const vendor = (cols[1] || "").trim();
    const modelNumber = (cols[2] || "").trim();

    // Check if this row is a category header
    const lowerFirst = firstCol.toLowerCase();
    let isCategoryHeader = false;
    for (const [key, cat] of Object.entries(CATEGORY_HEADERS)) {
      if (lowerFirst.startsWith(key)) {
        currentCategory = cat;
        isCategoryHeader = true;
        break;
      }
    }
    if (isCategoryHeader) continue;

    // Skip rows where both vendor and model number are empty
    if (!vendor && !modelNumber) continue;

    let notes = (cols[3] || "").trim();
    const location = (cols[4] || "").trim();
    const rawStatus = (cols[5] || "").trim();
    const status = ["TR Owned", "Vendor Loan", "Loaned Out"].includes(rawStatus) ? rawStatus : "TR Owned";

    // Extract serial number from notes — match SN:, S/N:, SN : patterns
    let serialNumber = "";
    const snMatch = notes.match(/S\/?N\s*:\s*(\S+)/i);
    if (snMatch) {
      serialNumber = snMatch[1];
      notes = notes.replace(snMatch[0], "").replace(/\s{2,}/g, " ").trim();
    } else {
      importCounter++;
      serialNumber = `IMPORT-${String(importCounter).padStart(3, "0")}`;
    }

    results.push({
      serialNumber,
      vendor,
      modelNumber,
      notes,
      location,
      status,
      category: currentCategory || "Misc.",
      loanDate: (cols[6] || "").trim(),
      dueBack: (cols[7] || "").trim(),
      returnedDate: (cols[8] || "").trim(),
      loanContact: (cols[9] || "").trim(),
      customer: (cols[10] || "").trim(),
      shipped: (cols[11] || "").trim(),
      trackingNumber: (cols[12] || "").trim(),
    });
  }

  // Deduplicate serial numbers — append -A, -B, -C suffixes for collisions
  const snSeen = {};
  for (const row of results) {
    const base = row.serialNumber;
    if (!snSeen[base]) {
      snSeen[base] = [row];
    } else {
      snSeen[base].push(row);
    }
  }
  for (const [base, group] of Object.entries(snSeen)) {
    if (group.length > 1) {
      group.forEach((row, i) => {
        row.serialNumber = `${base}-${String.fromCharCode(65 + i)}`;
      });
    }
  }

  return results;
}

function AssetsTab() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      const parsed = processCSVRows(rows);
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    setImporting(true);
    setImportProgress({ current: 0, total: csvPreview.length });
    let imported = 0;
    const newAssets = [];
    for (const row of csvPreview) {
      try {
        await setDoc(doc(db, "assets", row.serialNumber), {
          ...row,
          createdAt: serverTimestamp(),
        });
        newAssets.push({ id: row.serialNumber, ...row });
        imported++;
        setImportProgress({ current: imported, total: csvPreview.length });
      } catch (err) {
        console.error("Failed to import row:", row.serialNumber, err);
      }
    }
    setAssets((prev) => [...prev, ...newAssets]);
    setImporting(false);
    setCsvPreview(null);
    setImportResult(`Successfully imported ${imported} of ${csvPreview.length} assets.`);
  };

  const handleClearAllAssets = async () => {
    if (!window.confirm("This will permanently delete ALL assets. Are you sure?")) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "assets"));
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "assets", d.id));
      }
      setAssets([]);
    } catch (err) {
      console.error("Failed to clear assets:", err);
    }
    setLoading(false);
  };

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
    border: active ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
    background: active ? T.accent : T.card,
    color: active ? "#fff" : T.muted,
    cursor: "pointer",
  });

  if (csvPreview) {
    const pct = importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0;
    return (
      <div>
        <h3 style={{ color: T.accent, margin: "0.5rem 0" }}>CSV Import Preview</h3>
        <div style={{ padding: "0.75rem", background: T.dark, borderRadius: "8px", marginBottom: "0.75rem", color: T.text }}>
          <strong>{csvPreview.length}</strong> rows will be imported
        </div>

        <div style={{ overflowX: "auto", marginBottom: "0.75rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", color: T.text }}>
            <thead>
              <tr style={{ background: T.dark, textAlign: "left" }}>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>#</th>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>Serial</th>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>Vendor</th>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>Model</th>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>Category</th>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>Location</th>
                <th style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {csvPreview.slice(0, 5).map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.bg }}>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}`, color: T.muted }}>{i + 1}</td>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", fontSize: "0.75rem" }}>{row.serialNumber}</td>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>{row.vendor}</td>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>{row.modelNumber}</td>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>{row.category}</td>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>{row.location || "—"}</td>
                  <td style={{ padding: "0.4rem 0.5rem", borderBottom: `1px solid ${T.border}` }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {csvPreview.length > 5 && (
            <div style={{ padding: "0.5rem", color: T.muted, fontSize: "0.85rem", textAlign: "center" }}>
              ...and {csvPreview.length - 5} more rows
            </div>
          )}
        </div>

        {importing && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: T.muted, marginBottom: "0.25rem" }}>
              <span>Importing...</span>
              <span>{importProgress.current} / {importProgress.total} ({pct}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: T.dark, borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: T.accent, borderRadius: "4px", transition: "width 0.2s" }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={handleConfirmImport} disabled={importing} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            {importing ? "Importing..." : "Confirm Import"}
          </button>
          <button onClick={() => setCsvPreview(null)} disabled={importing} style={{ padding: "0.5rem 1.5rem", fontSize: "1rem", background: T.dark, color: T.text, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search vendor, model, or serial..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", marginBottom: "0.5rem", background: T.card, color: T.text }}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{ padding: "0.5rem", fontSize: "1rem", flex: 1, borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", background: T.card, color: T.text }}
        >
          <option value="All">All Locations</option>
          {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
        <button onClick={() => fileInputRef.current?.click()} style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", background: T.dark, color: T.accent, border: `1px solid ${T.accent}`, borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
          Import CSV
        </button>
        <button onClick={handleClearAllAssets} style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", background: "#5a1a1a", color: "#ff6b6b", border: "1px solid #ff6b6b", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}>
          Clear All
        </button>
      </div>

      {importResult && (
        <div style={{ padding: "0.5rem 0.75rem", marginBottom: "0.5rem", background: T.dark, borderRadius: "6px", color: T.accent, fontSize: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{importResult}</span>
          <button onClick={() => setImportResult(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "1rem" }}>×</button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "1rem" }}>
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={pillStyle(filter === c)}>
            {c}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: T.muted }}>Loading assets...</div>}

      <div style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        {!loading && filtered.length === 0 && <div style={{ color: T.muted }}>No assets found.</div>}
        {filtered.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelected(a)}
            style={{ padding: "0.75rem", marginBottom: "0.5rem", background: T.card, borderRadius: "8px", border: `1px solid ${T.border}`, cursor: "pointer" }}
          >
            <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: T.text }}>{a.vendor} {a.modelNumber}</div>
            <div style={{ fontSize: "0.85rem", color: T.muted, marginTop: "0.25rem" }}>
              SN: {a.serialNumber}
            </div>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: T.muted, marginTop: "0.25rem" }}>
              <span>{a.location}</span>
              <span style={{
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                background: a.status === "TR Owned" ? T.accent : a.status === "Loaned Out" ? T.dark : T.darkAccent,
                color: "#fff",
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
    if ((username === "mike@traceroutellc.com" || username === "josh@traceroutellc.com") && password === "fiction-hei-need") {
      onLogin();
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "400px", margin: "0 auto", padding: "2rem", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", background: T.bg, color: T.text }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: "1.5rem", textAlign: "center" }}>&gt;tracerout<span style={{ color: T.accent }}>e</span></h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem", color: T.text }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", marginBottom: "0.75rem", background: T.card, color: T.text }}
        />
        <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem", color: T.text }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "0.5rem", fontSize: "1rem", width: "100%", borderRadius: "6px", border: `1px solid ${T.border}`, boxSizing: "border-box", marginBottom: "1rem", background: T.card, color: T.text }}
        />
        <button type="submit" style={{ padding: "0.75rem", fontSize: "1rem", width: "100%", background: T.accent, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Log In
        </button>
      </form>
      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#5a1a1a", borderRadius: "6px", textAlign: "center", color: "#ff6b6b" }}>
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

  const navBtn = (name) => ({
    flex: 1,
    padding: "0.75rem",
    fontSize: "1rem",
    fontWeight: tab === name ? "bold" : "normal",
    background: tab === name ? T.accent : T.card,
    color: tab === name ? "#fff" : T.muted,
    border: "none",
    cursor: "pointer",
  });

  const navButtons = (
    <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
      <button style={navBtn("scan")} onClick={() => setTab("scan")}>Scan</button>
      <button style={navBtn("assets")} onClick={() => setTab("assets")}>Assets</button>
    </div>
  );

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "500px", margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text }}>
      <div style={{ padding: "1rem 1rem 0" }}>
        <h1 style={{ margin: "0 0 1rem 0", fontSize: "1.4rem" }}>&gt;tracerout<span style={{ color: T.accent }}>e</span></h1>
      </div>

      {navButtons}

      <div style={{ flex: 1, padding: "0 1rem 1rem", overflowY: "auto" }}>
        {tab === "scan" && <ScanTab />}
        {tab === "assets" && <AssetsTab />}
      </div>
    </div>
  );
}
