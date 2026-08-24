"use client";

import { useEffect, useState } from "react";

interface Telemetry {
  altitude_m: number;
  speed_mps: number;
  heading_deg: number;
  battery_percent: number;
  stage: string;
  position: { x_m: number; y_m: number; z_m: number };
}

export default function DroneDashboard() {
  const missionId = "66bc1234567890abcdef1234";
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

  // Poll live telemetry from NestJS backend
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/v1/missions/${missionId}/telemetry`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.altitude_m !== undefined) {
            setTelemetry(data);
          }
        }
      } catch (err) {
        // Local simulation fallback
      }
    }, 400);

    return () => clearInterval(interval);
  }, [missionId]);

  // Determine active zone for HUD badge
  const getZoneLabel = (x: number, y: number) => {
    if (y > 1.5) return x < 0 ? "ZONE A: TOMATOES 🍅" : "ZONE B: CAPSICUM 🫑";
    if (y < -1.5) return x < 0 ? "ZONE C: CUCUMBERS 🥒" : "ZONE D: EGGPLANTS 🍆";
    return "CENTRAL LOGISTICS AISLE 🚜";
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] text-slate-100 font-sans p-6 md:p-10">
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
            Mission ID: <code className="text-cyan-300 font-mono">{missionId}</code> | Drone: <span className="text-slate-200 font-medium">DRONE-001</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-400 tracking-wide uppercase">LIVE 1080P FPV</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            Backend: <span className="text-emerald-400 font-mono">localhost:3000</span>
          </div>
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
                onError={() => setStreamOnline(false)}
                onLoad={() => setStreamOnline(true)}
              />

              {/* Offline Overlay if Stream not yet started */}
              {!streamOnline && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                    🚁
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200">Waiting for 3D Drone Camera Stream...</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Launch Gazebo with the camera bridge to stream the real 3D downward view from the drone!
                  </p>
                  <code className="mt-3 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-400">
                    ros2 launch launch/drone_mission.launch.py
                  </code>
                </div>
              )}

              {/* Live Crop Zone Tag on Top Left */}
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 flex items-center gap-3">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  {getZoneLabel(telemetry.position.x_m, telemetry.position.y_m)}
                </span>
              </div>

              {/* Stage Badge on Top Right */}
              <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-600/40 text-xs font-bold text-emerald-300 uppercase">
                STAGE: {telemetry.stage.replace("_", " ")}
              </div>
            </div>

            {/* Sub-bar Below Video */}
            <div className="p-4 bg-slate-900/60 backdrop-blur border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>Stream: <strong className="text-slate-200">3D Gazebo Harmonic Sensor</strong></span>
                <span>Resolution: <strong className="text-slate-200">1920x1080 (30 FPS)</strong></span>
                <span>Gimbal Pitch: <strong className="text-slate-200">-60°</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Raw Camera Topic: <strong className="text-emerald-400 font-mono">/kissanvikas/drone/camera/image_raw</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry & Mission Stats (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Telemetry Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Altitude Card */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Altitude (Z)</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-cyan-300">{telemetry.altitude_m.toFixed(2)}</span>
                <span className="text-xs text-slate-400">meters</span>
              </div>
            </div>

            {/* Flight Speed Card */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Ground Speed</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-emerald-300">{telemetry.speed_mps.toFixed(1)}</span>
                <span className="text-xs text-slate-400">m/s</span>
              </div>
            </div>

            {/* Heading Compass */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Heading</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-amber-300">{telemetry.heading_deg.toFixed(0)}°</span>
                <span className="text-xs text-slate-400">yaw</span>
              </div>
            </div>

            {/* Battery Percentage */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Battery</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-emerald-400">{telemetry.battery_percent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.battery_percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Mission Progress Panel */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Mission Status</h4>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Stage 1: Perimeter Scan</span>
                <span className="text-emerald-400 font-semibold font-mono">COMPLETED</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Stage 2: Interior Crop Scan</span>
                <span className="text-cyan-400 font-semibold font-mono">IN PROGRESS</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Survey Frames Captured</span>
                <span className="text-slate-200 font-semibold font-mono">{frameCount}+ frames</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Crop Beds</span>
                <span className="text-slate-200 font-semibold font-mono">48 Beds (1,800 m²)</span>
              </div>
            </div>
          </div>

          {/* Quick Launch Guide */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-col gap-2">
            <span className="font-bold text-slate-200">🚀 How to Run Survey:</span>
            <p>1. Start NestJS Backend:</p>
            <code className="px-2 py-1 bg-slate-950 rounded text-cyan-300 font-mono">npm run start:dev (backend/)</code>
            <p>2. Start Drone Mission Runner:</p>
            <code className="px-2 py-1 bg-slate-950 rounded text-cyan-300 font-mono">python3 src/mission/mission_runner.py</code>
          </div>
        </div>
      </main>
    </div>
  );
}
