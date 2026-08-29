"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearSession } from "@/lib/session.utils";
import { proxyFetch } from "@/lib/proxy";

interface Telemetry {
  altitude_m: number;
  speed_mps: number;
  heading_deg: number;
  battery_percent: number;
  stage: string;
  position: { x_m: number; y_m: number; z_m: number };
}

export default function DroneDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [polyhouses, setPolyhouses] = useState<any[]>([]);
  const [selectedPolyhouse, setSelectedPolyhouse] = useState<any>(null);

  const missionId = "MISSION-004";
  const [telemetry, setTelemetry] = useState<Telemetry>({
    altitude_m: 4.5,
    speed_mps: 1.8,
    heading_deg: 90,
    battery_percent: 98.5,
    stage: "interior_scan",
    position: { x_m: -14.0, y_m: 5.5, z_m: 3.2 },
  });

  const [streamOnline, setStreamOnline] = useState(true);
  const [frameCount, setFrameCount] = useState(42);

  // Authentication check
  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);

    // Fetch user's polyhouses
    proxyFetch("/polyhouses").then((res) => {
      if (res.data && res.data.length > 0) {
        setPolyhouses(res.data);
        setSelectedPolyhouse(res.data[0]);
      }
    });
  }, []);

  // Poll live telemetry from Live Streamer (port 8080) and NestJS backend (port 3000)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 1. Try direct live telemetry stream from port 8080
        const simRes = await fetch("http://localhost:8080/telemetry");
        if (simRes.ok) {
          const simData = await simRes.json();
          if (simData && simData.altitude_m !== undefined) {
            setTelemetry((prev) => ({
              ...prev,
              ...simData,
              position: simData.position || prev.position,
            }));
            if (simData.frames_captured !== undefined) {
              setFrameCount(simData.frames_captured);
            }
            return;
          }
        }
      } catch (err) {
        // Fallback to backend
      }

      try {
        const res = await fetch(`http://localhost:3000/api/v1/missions/${missionId}/telemetry`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.altitude_m !== undefined) {
            setTelemetry((prev) => ({ ...prev, ...data }));
          }
        }
      } catch (err) {
        // Local simulation fallback
      }
    }, 200);

    return () => clearInterval(interval);
  }, [missionId]);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  const getZoneLabel = (x: number, y: number) => {
    if (y > 1.5) return x < 0 ? "ZONE A: TOMATOES 🍅" : "ZONE B: CAPSICUM 🫑";
    if (y < -1.5) return x < 0 ? "ZONE C: CUCUMBERS 🥒" : "ZONE D: EGGPLANTS 🍆";
    return "CENTRAL LOGISTICS AISLE 🚜";
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans p-6 md:p-10">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              🌿 KissanVikas
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SMART POLYHOUSE TWIN
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {selectedPolyhouse ? (
              <>
                Polyhouse: <span className="text-emerald-300 font-semibold">{selectedPolyhouse.name}</span> (GPS: {selectedPolyhouse.location?.latitude}, {selectedPolyhouse.location?.longitude})
              </>
            ) : (
              `Mission ID: ${missionId} | Drone: DRONE-001`
            )}
          </p>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-medium">{currentUser?.name || "Farmer"}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
              {currentUser?.role || "Customer"}
            </span>
          </div>

          {currentUser?.role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              👑 Admin Center
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Live 3D Drone FPV Video Feed (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-emerald-950/20">
            {/* Live MJPEG Stream Element from Gazebo Camera */}
            <div className="aspect-video w-full relative bg-slate-900 flex items-center justify-center">
              <img
                src="http://localhost:8080/camera/stream"
                alt="Live 3D Drone Camera Stream"
                className="w-full h-full object-cover"
                onLoad={() => setStreamOnline(true)}
              />

              {/* Offline Overlay if Stream not yet started */}
              {!streamOnline && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-4 animate-pulse">
                    🛰️
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">Live Drone Stream Ready</h3>
                  <p className="text-xs text-slate-400 max-w-md mt-2">
                    Start survey flight from terminal or Admin Dispatcher to view live FPV feed.
                  </p>
                </div>
              )}

              {/* Real-Time Flight HUD Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
                <span className="px-3 py-1 rounded-md text-xs font-bold font-mono tracking-wider bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                  {getZoneLabel(telemetry.position.x_m, telemetry.position.y_m)}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-mono bg-black/60 backdrop-blur-md text-slate-300 border border-slate-800">
                  X: {telemetry.position.x_m.toFixed(1)}m | Y: {telemetry.position.y_m.toFixed(1)}m | Z: {telemetry.position.z_m.toFixed(1)}m
                </span>
              </div>

              {/* FPV Mode Tag */}
              <div className="absolute top-4 right-4 pointer-events-none">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-red-600/80 text-white tracking-widest animate-pulse">
                  REC • 1080P
                </span>
              </div>
            </div>

            {/* Bottom Stream Status Strip */}
            <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300 font-medium">Real 3D Gazebo Survey Gimbal Camera (-60° Pitch)</span>
              </div>
              <span className="text-slate-400 font-mono">Stream: http://localhost:8080/camera/stream</span>
            </div>
          </div>

          {/* Polyhouse Crop Bed Spatial Map Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white">48 Raised Crop Beds Spatial Heatmap</h3>
              <span className="text-xs text-emerald-400 font-mono">336 Plants Active</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="font-bold text-red-300">ZONE A: TOMATOES</span>
                <p className="text-[11px] text-slate-400 mt-1">12 Beds (84 Plants)</p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400">Health: 98.2% (VARI: +0.42)</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-300">ZONE B: CAPSICUM</span>
                <p className="text-[11px] text-slate-400 mt-1">12 Beds (84 Plants)</p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400">Health: 96.5% (VARI: +0.38)</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-300">ZONE C: CUCUMBERS</span>
                <p className="text-[11px] text-slate-400 mt-1">12 Beds (84 Plants)</p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400">Health: 99.1% (VARI: +0.45)</div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="font-bold text-purple-300">ZONE D: EGGPLANTS</span>
                <p className="text-[11px] text-slate-400 mt-1">12 Beds (84 Plants)</p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400">Health: 97.4% (VARI: +0.40)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Drone Telemetry & Mission Stats (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Real-Time Flight Telemetry Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white tracking-wide">Live Flight Telemetry</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                250ms RATE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Altitude</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">{telemetry.altitude_m.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">meters</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Speed</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">{telemetry.speed_mps.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">m/s</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Heading</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">{Math.round(telemetry.heading_deg)}°</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase">Battery</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{telemetry.battery_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Progress Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Mission Status</h4>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Stage 1: Perimeter Scan</span>
                <span className={`font-semibold font-mono ${
                  telemetry.stage === "perimeter_scan"
                    ? "text-cyan-400 animate-pulse"
                    : ["interior_scan", "landing", "landed", "completed"].includes(telemetry.stage)
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}>
                  {telemetry.stage === "perimeter_scan"
                    ? "IN PROGRESS"
                    : ["interior_scan", "landing", "landed", "completed"].includes(telemetry.stage)
                    ? "COMPLETED"
                    : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Stage 2: Interior Crop Scan</span>
                <span className={`font-semibold font-mono ${
                  telemetry.stage === "interior_scan"
                    ? "text-cyan-400 animate-pulse"
                    : ["landing", "landed", "completed"].includes(telemetry.stage)
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}>
                  {telemetry.stage === "interior_scan"
                    ? "IN PROGRESS"
                    : ["landing", "landed", "completed"].includes(telemetry.stage)
                    ? "COMPLETED"
                    : "PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Survey Frames Captured</span>
                <span className="text-slate-200 font-semibold font-mono">{frameCount} frames</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Crop Beds</span>
                <span className="text-slate-200 font-semibold font-mono">48 Beds (1,800 m²)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
