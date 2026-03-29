import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useSovereignStore } from "../store";
import { motion } from "motion/react";

export const Viewport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vmcData = useSovereignStore((state) => state.vmcData);
  const [loading, setLoading] = useState(true);
  const vrmRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 3.5);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // [Sovereign Lighting] - Dynamic & Reactive
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const rimLight = new THREE.PointLight(0x00f3ff, 2, 10);
    rimLight.position.set(2, 2, -2);
    scene.add(rimLight);

    const frontLight = new THREE.SpotLight(0xff007f, 1.5);
    frontLight.position.set(0, 5, 5);
    scene.add(frontLight);

    // [Holographic Stage] - SSR Simulation (Reflective Floor)
    const grid = new THREE.GridHelper(10, 20, 0x00f3ff, 0x111111);
    grid.position.y = 0;
    scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x050508, 
      roughness: 0.1, 
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // [Volumetric Fog Simulation]
    scene.fog = new THREE.FogExp2(0x050508, 0.15);

    // [VRM Loader] - Normalização de Eixos Serevano
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // Placeholder VRM (Using a generic one if available, or just a box for now if URL fails)
    // In a real setup, this would load from D:\Omni-Genesis\Vaelindra.vrm
    loader.load(
      "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Sample.vrm",
      (gltf) => {
        const vrm = gltf.userData.vrm;
        scene.add(vrm.scene);
        vrmRef.current = vrm;
        setLoading(false);
        console.log("[Sovereign Core] VRM 1.0 Materialized");
      },
      (progress) => console.log(`[VRM] Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`),
      (error) => {
        console.error("[VRM] Load Failed:", error);
        setLoading(false);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);

      // [VMC Proxy Integration]
      if (vrmRef.current && vmcData) {
        // Apply Bone Rotations (Quaternions)
        const bones = vmcData.bones;
        for (const boneName in bones) {
          const bone = vrmRef.current.humanoid.getRawBone(boneName);
          if (bone) {
            const rot = bones[boneName];
            bone.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
          }
        }

        // Apply Blendshapes (LipSync/Expressions)
        const blendshapes = vmcData.blendshapes;
        for (const bsName in blendshapes) {
          vrmRef.current.expressionManager.setValue(bsName, blendshapes[bsName]);
        }
        vrmRef.current.expressionManager.update();
      }

      // Idle Rotation if no VMC
      if (!vmcData && vrmRef.current) {
        vrmRef.current.scene.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full relative group">
      <canvas ref={canvasRef} className="h-full w-full" />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508]/80 backdrop-blur-xl z-20">
          <div className="h-16 w-16 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs font-mono text-neon-blue uppercase tracking-[0.3em] animate-pulse">Materializing Vaelindra...</p>
        </div>
      )}

      {/* Viewport HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-neon-blue rounded-full animate-ping" />
              <span className="text-[10px] font-mono text-neon-blue uppercase tracking-widest">Holographic Viewport Active</span>
            </div>
            <p className="text-[8px] font-mono text-white/20 uppercase">Render: WebGL 2.0 / RTX 4060 Optimized</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-white/40 uppercase">Cam: Perspective 35°</p>
            <p className="text-[10px] font-mono text-white/40 uppercase">SSR: Enabled (Simulated)</p>
          </div>
        </div>

        {/* Bottom Corner HUD */}
        <div className="flex justify-between items-end">
          <div className="glass p-3 rounded-lg border border-white/5 flex gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-mono text-white/40 uppercase">Bone Sinc</p>
              <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-neon-blue" animate={{ width: vmcData ? "100%" : "0%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-mono text-white/40 uppercase">Blend Sinc</p>
              <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-neon-pink" animate={{ width: vmcData ? "100%" : "0%" }} />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="h-24 w-1 bg-white/5 rounded-full relative">
              <motion.div 
                className="absolute bottom-0 w-full bg-neon-blue"
                animate={{ height: vmcData ? ["20%", "80%", "50%"] : "10%" }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
            <span className="text-[8px] font-mono text-white/40 uppercase vertical-text">Signal Strength</span>
          </div>
        </div>
      </div>

      {/* Interaction Orbs (Cyber-Fofo) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        {["Neutral", "Joy", "Angry", "Sorrow"].map((mood) => (
          <motion.button
            key={mood}
            whileHover={{ scale: 1.2, x: -5 }}
            whileTap={{ scale: 0.9 }}
            className={`h-10 w-10 rounded-full glass border flex items-center justify-center transition-colors ${
              mood === "Joy" ? "border-neon-pink/50 text-neon-pink" : "border-white/10 text-white/40"
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${mood === "Joy" ? "bg-neon-pink" : "bg-white/20"}`} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
