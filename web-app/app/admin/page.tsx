"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearSession, isAdmin } from "@/lib/session.utils";
import { proxyFetch } from "@/lib/proxy";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Polyhouse {
  _id: string;
  name: string;
  userId: { _id: string; name: string; email: string };
  location: { latitude: number; longitude: number };
  dimensions: { lengthM: number; widthM: number; heightM: number };
  status: string;
  twinStatus: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"customers" | "polyhouses" | "dispatch">("customers");

  // Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [polyhouses, setPolyhouses] = useState<Polyhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States - Customer
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custPassword, setCustPassword] = useState("Customer@1234");

  // Form States - Polyhouse
  const [selectedCustId, setSelectedCustId] = useState("");
  const [polyName, setPolyName] = useState("");
  const [polyLat, setPolyLat] = useState("26.1445");
  const [polyLng, setPolyLng] = useState("91.7362");
  const [polyLength, setPolyLength] = useState("60.0");
  const [polyWidth, setPolyWidth] = useState("30.0");
  const [polyHeight, setPolyHeight] = useState("6.5");

  // Form States - Dispatch Mission
  const [dispatchPolyId, setDispatchPolyId] = useState("");
  const [flightEngine, setFlightEngine] = useState<"sitl" | "direct">("sitl");
  const [generatedMissionId, setGeneratedMissionId] = useState("");
  const [dispatchCommand, setDispatchCommand] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [isLogStreaming, setIsLogStreaming] = useState(false);


  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.role !== "admin") {
      router.push("/");
      return;
    }
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const custRes = await proxyFetch<Customer[]>("/users");
    if (custRes.data) {
      setCustomers(custRes.data);
      if (custRes.data.length > 0 && !selectedCustId) {
        setSelectedCustId(custRes.data[0]._id);
      }
    }

    const polyRes = await proxyFetch<Polyhouse[]>("/polyhouses");
    if (polyRes.data) {
      setPolyhouses(polyRes.data);
      if (polyRes.data.length > 0 && !dispatchPolyId) {
        setDispatchPolyId(polyRes.data[0]._id);
      }
    }
    setLoading(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const res = await proxyFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        name: custName,
        email: custEmail,
        phone: custPhone,
        password: custPassword,
      }),
    });

    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: `Customer ${custName} registered successfully!` });
      setCustName("");
      setCustEmail("");
      setCustPhone("");
      fetchData();
    }
  };

  const handleCreatePolyhouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedCustId) {
      setMessage({ type: "error", text: "Please select a customer first." });
      return;
    }

    const res = await proxyFetch("/polyhouses", {
      method: "POST",
      body: JSON.stringify({
        userId: selectedCustId,
        name: polyName,
        location: {
          latitude: parseFloat(polyLat),
          longitude: parseFloat(polyLng),
        },
        dimensions: {
          lengthM: parseFloat(polyLength),
          widthM: parseFloat(polyWidth),
          heightM: parseFloat(polyHeight),
        },
      }),
    });

    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: `Polyhouse "${polyName}" created and assigned to customer!` });
      setPolyName("");
      fetchData();
    }
  };


  // Poll live logs when mission is active
  useEffect(() => {
    if (!isLogStreaming || !generatedMissionId) return;

    const interval = setInterval(async () => {
      const res = await proxyFetch<{ logs: string[] }>(`/missions/${generatedMissionId}/logs`);
      if (res.data && res.data.logs) {
        setLiveLogs(res.data.logs);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isLogStreaming, generatedMissionId]);

  const handleDispatchMission = async () => {
    setIsDispatching(true);
    setMessage(null);
    setLiveLogs([]);

    const missionId = `MISSION-${Date.now().toString().slice(-6)}`;
    setGeneratedMissionId(missionId);

    const selectedPoly = polyhouses.find((p) => p._id === dispatchPolyId);
    const custId = selectedPoly?.userId?._id || user?.id;

    // Call automatic background dispatch endpoint
    const res = await proxyFetch("/missions/dispatch", {
      method: "POST",
      body: JSON.stringify({
        missionId,
        polyhouseId: dispatchPolyId,
        requestedBy: custId,
        droneId: "DRONE-001",
        speed: 1.5,
        mode: flightEngine,
      }),
    });

    if (res.data) {
      setDispatchCommand(res.data.command || `wsl python3 /mnt/d/KissanVikas/simulation/src/mission/mission_runner.py --mission-id "${missionId}" --drone-id "DRONE-001" --speed 1.5`);
      setIsLogStreaming(true);
      setMessage({
        type: "success",
        text: `🚀 Mission ${missionId} automatically dispatched and running in background! Streaming live flight logs below.`,
      });
    } else {
      setMessage({
        type: "error",
        text: res.error || "Failed to dispatch mission process.",
      });
    }

    setIsDispatching(false);
  };


  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans p-6 md:p-10">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0A0D14] rounded-[14px] flex items-center justify-center text-xl">
              👑
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Admin <span className="text-emerald-400">Control Center</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer Management, Polyhouse Provisioning & Survey Drone Dispatch
            </p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{user?.name || "Admin"}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono text-[11px]">admin@kissanvikas.com</span>
          </div>

          <button
            onClick={() => router.push("/")}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Digital Twin HUD →
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {message && (
        <div
          className={`mt-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.type === "success" ? "✅" : "⚠️"}</span>
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 mt-8 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "customers"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>👨‍🌾</span>
          <span>1. Customer Management ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("polyhouses")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "polyhouses"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🌿</span>
          <span>2. Polyhouse & GPS Setup ({polyhouses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("dispatch")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "dispatch"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-950/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🚁</span>
          <span>3. Drone Mission Dispatcher</span>
        </button>
      </div>

      {/* Tab 1: Customer Management */}
      {activeTab === "customers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creation Form */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl h-fit">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <span>➕</span> Add New Customer
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Create an agro-farmer account with login access.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Farm Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Agro Farms"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@farm.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={custPassword}
                  onChange={(e) => setCustPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 font-mono outline-none focus:border-emerald-500/60"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer mt-4"
              >
                Create Customer Account →
              </button>
            </form>
          </div>

          {/* Customers Table */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-1">Registered Customers</h2>
            <p className="text-xs text-slate-400 mb-6">List of all active farmer customer accounts.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Customer Name</th>
                    <th className="pb-3 px-3">Email</th>
                    <th className="pb-3 px-3">Phone</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-3 font-semibold text-white">{c.name}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{c.email}</td>
                      <td className="py-3.5 px-3 text-slate-400">{c.phone || "—"}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {c.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Polyhouse & GPS Setup */}
      {activeTab === "polyhouses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creation Form */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl h-fit">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <span>📍</span> Register Polyhouse
            </h2>
            <p className="text-xs text-slate-400 mb-6">Assign polyhouse geometry & GPS to a customer.</p>

            <form onSubmit={handleCreatePolyhouse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign to Customer</label>
                <select
                  required
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 outline-none focus:border-emerald-500/60 cursor-pointer"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Polyhouse Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Polyhouse #1"
                  value={polyName}
                  onChange={(e) => setPolyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">GPS Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={polyLat}
                    onChange={(e) => setPolyLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">GPS Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={polyLng}
                    onChange={(e) => setPolyLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Length (m)</label>
                  <input
                    type="number"
                    value={polyLength}
                    onChange={(e) => setPolyLength(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Width (m)</label>
                  <input
                    type="number"
                    value={polyWidth}
                    onChange={(e) => setPolyWidth(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Height (m)</label>
                  <input
                    type="number"
                    value={polyHeight}
                    onChange={(e) => setPolyHeight(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer mt-4"
              >
                Provision Polyhouse →
              </button>
            </form>
          </div>

          {/* Polyhouses Table */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-1">Provisioned Polyhouses</h2>
            <p className="text-xs text-slate-400 mb-6">List of registered smart polyhouses and GPS locations.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="pb-3 px-3">Polyhouse Name</th>
                    <th className="pb-3 px-3">Customer</th>
                    <th className="pb-3 px-3">GPS Location</th>
                    <th className="pb-3 px-3">Dimensions</th>
                    <th className="pb-3 px-3">Twin Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {polyhouses.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-3 font-semibold text-white">{p.name}</td>
                      <td className="py-3.5 px-3 text-slate-300">{p.userId?.name || "Unassigned"}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">
                        {p.location?.latitude?.toFixed(4)}, {p.location?.longitude?.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono">
                        {p.dimensions?.lengthM}m × {p.dimensions?.widthM}m
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {p.twinStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Drone Mission Dispatcher */}
      {activeTab === "dispatch" && (
        <div className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
              🚁
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Autonomous Drone Survey Dispatcher</h2>
              <p className="text-xs text-slate-400">
                Dispatch an autonomous survey mission for a customer's polyhouse and sync the 3D twin.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Select Target Polyhouse for Survey
              </label>
              <select
                value={dispatchPolyId}
                onChange={(e) => setDispatchPolyId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 outline-none focus:border-cyan-500/60 cursor-pointer"
              >
                {polyhouses.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — Owner: {p.userId?.name} ({p.location?.latitude}, {p.location?.longitude})
                  </option>
                ))}
              </select>
            </div>

            {/* Flight Engine Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Flight Controller Engine
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFlightEngine("sitl")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    flightEngine === "sitl"
                      ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛸</span>
                      <span className="text-sm font-bold text-white">ArduPilot / PX4 SITL</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      MAVLink 2.0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    High-fidelity autopilot firmware simulation. Supports QGroundControl & Mission Planner on UDP 14550.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFlightEngine("direct")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    flightEngine === "direct"
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-950/30"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <span className="text-sm font-bold text-white">Direct Kinematic Mode</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Gazebo Direct
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Lightweight trajectory engine for rapid dashboard testing & AI vision pipeline sync.
                  </p>
                </button>
              </div>
            </div>

            <button
              onClick={handleDispatchMission}
              disabled={isDispatching}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDispatching ? (
                <span>⏳ Initializing Flight Process...</span>
              ) : (
                <>
                  <span>{flightEngine === "sitl" ? "🛸" : "⚡"}</span>
                  <span>
                    Auto-Dispatch Drone Mission Now ({flightEngine === "sitl" ? "ArduPilot SITL Mode" : "Direct Mode"})
                  </span>
                </>
              )}
            </button>

            {/* Live Terminal Console Stream */}
            {generatedMissionId && (
              <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl animate-fadeIn">
                {/* Terminal Header */}
                <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-xs font-mono text-slate-300 ml-2">
                      Live Mission Terminal — <span className="text-cyan-400">{generatedMissionId}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">STREAMING</span>
                    </div>
                    <button
                      onClick={() => router.push("/")}
                      className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
                    >
                      View 3D Twin HUD →
                    </button>
                  </div>
                </div>

                {/* Log Terminal Output Box */}
                <div className="p-4 bg-black/90 font-mono text-xs text-slate-200 h-64 overflow-y-auto space-y-1.5 select-text">
                  {liveLogs.length === 0 ? (
                    <div className="text-slate-500 flex items-center gap-2 py-4">
                      <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Connecting to drone flight process in WSL...</span>
                    </div>
                  ) : (
                    liveLogs.map((log, index) => {
                      let colorClass = "text-slate-300";
                      if (log.includes("[FRAME CAPTURED]") || log.includes("[SUCCESS]") || log.includes("COMPLETED")) {
                        colorClass = "text-emerald-400 font-semibold";
                      } else if (log.includes("[STAGE") || log.includes("[TAKEOFF]") || log.includes("[LANDING]")) {
                        colorClass = "text-cyan-300 font-bold";
                      } else if (log.includes("[FLIGHT]")) {
                        colorClass = "text-slate-400";
                      } else if (log.includes("[ERR") || log.includes("[ERROR]")) {
                        colorClass = "text-red-400";
                      } else if (log.includes("[DIGITAL TWIN")) {
                        colorClass = "text-amber-300 font-bold";
                      }
                      return (
                        <div key={index} className={`leading-relaxed ${colorClass}`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
