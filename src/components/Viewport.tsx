import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useSovereignStore } from "../store";
import { motion } from "framer-motion";

export const Viewport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vmcData = useSovereignStore((state) => state.vmcData);
  const vmcDataRef = useRef(vmcData);
  const [loading, setLoading] = useState(true);
  const vrmRef = useRef<any>(null);

  const [activeMood, setActiveMood] = useState("Neutro");

  useEffect(() => {
    vmcDataRef.current = vmcData;
  }, [vmcData]);

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

    // Fallback Cube in case VRM fails
    const fallbackGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x00f3ff, wireframe: true });
    const fallbackCube = new THREE.Mesh(fallbackGeo, fallbackMat);
    fallbackCube.position.y = 1;
    scene.add(fallbackCube);

    const loadVRM = (url: string) => {
      setLoading(true);
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        vrmRef.current.dispose();
        vrmRef.current = null;
      }
      
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm;
          scene.remove(fallbackCube);
          
          // Disable frustum culling for VRM to prevent it disappearing when moving
          vrm.scene.traverse((obj: any) => {
            obj.frustumCulled = false;
          });

          scene.add(vrm.scene);
          vrmRef.current = vrm;
          setLoading(false);
          console.log("[Sovereign Core] VRM Materialized");
        },
        (progress) => console.log(`[VRM] Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`),
        (error) => {
          console.error("[VRM] Load Failed:", error);
          setLoading(false);
          scene.add(fallbackCube);
        }
      );
    };

    // Initial Load
    const initialUrl = localStorage.getItem('vaelindra_vrm_url') || "https://raw.githubusercontent.com/pixiv/three-vrm/dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm";
    loadVRM(initialUrl);

    // Listen for VRM changes from Settings
    const handleVrmChange = () => {
      const newUrl = localStorage.getItem('vaelindra_vrm_url');
      if (newUrl) {
        loadVRM(newUrl);
      }
    };
    window.addEventListener('vrm_changed', handleVrmChange);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const currentVmcData = vmcDataRef.current;

      // [VMC Proxy Integration]
      if (vrmRef.current && currentVmcData) {
        // Apply Bone Rotations (Quaternions)
        const bones = currentVmcData.bones;
        for (const boneName in bones) {
          const bone = vrmRef.current.humanoid.getRawBoneNode(boneName);
          if (bone) {
            const rot = bones[boneName];
            bone.quaternion.set(rot[0], rot[1], rot[2], rot[3]);
          }
        }

        // Apply Blendshapes (LipSync/Expressions)
        const blendshapes = currentVmcData.blendshapes;
        for (const bsName in blendshapes) {
          vrmRef.current.expressionManager.setValue(bsName, blendshapes[bsName]);
        }
        vrmRef.current.expressionManager.update();
      }

      // Idle Rotation if no VMC
      if (!currentVmcData && vrmRef.current) {
        vrmRef.current.scene.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
        
        // Apply manual mood if no VMC is driving it
        const expressionManager = vrmRef.current.expressionManager;
        if (expressionManager) {
          expressionManager.setValue('neutral', activeMood === 'Neutro' ? 1.0 : 0.0);
          expressionManager.setValue('happy', activeMood === 'Alegria' ? 1.0 : 0.0);
          expressionManager.setValue('angry', activeMood === 'Raiva' ? 1.0 : 0.0);
          expressionManager.setValue('sad', activeMood === 'Tristeza' ? 1.0 : 0.0);
          expressionManager.update();
        }
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
      window.removeEventListener('vrm_changed', handleVrmChange);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
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
          <p className="text-xs font-mono text-neon-blue uppercase tracking-[0.3em] animate-pulse">Materializando Vaelindra...</p>
        </div>
      )}

      {/* Viewport HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-neon-blue rounded-full animate-ping" />
              <span className="text-[10px] font-mono text-neon-blue uppercase tracking-widest">Visualizador Holográfico Ativo</span>
            </div>
            <p className="text-[8px] font-mono text-white/20 uppercase">Renderização: WebGL 2.0 / RTX 4060 Otimizado</p>
            <p className="text-[8px] font-mono text-neon-pink/70 uppercase pt-2">Rig: Pronto para SMPL-X</p>
            <p className="text-[8px] font-mono text-neon-pink/70 uppercase">Movimento: HybrIK / MotionBERT (Em Espera)</p>
            <p className="text-[8px] font-mono text-neon-pink/70 uppercase">Rosto: EMO / LiveSpeechPortraits (Em Espera)</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-white/40 uppercase">Câm: Perspectiva 35°</p>
            <p className="text-[10px] font-mono text-white/40 uppercase">Shader SSS: Ativo (Simulado)</p>
          </div>
        </div>

        {/* Bottom Corner HUD */}
        <div className="flex justify-between items-end">
          <div className="glass p-3 rounded-lg border border-white/5 flex gap-4">
            <div className="space-y-1">
              <p className="text-[8px] font-mono text-white/40 uppercase">Sinc. Óssea</p>
              <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full bg-neon-blue" animate={{ width: vmcData ? "100%" : "0%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-mono text-white/40 uppercase">Sinc. Blend</p>
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
            <span className="text-[8px] font-mono text-white/40 uppercase vertical-text">Força do Sinal</span>
          </div>
        </div>
      </div>

      {/* Interaction Orbs (Cyber-Fofo) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        {["Neutro", "Alegria", "Raiva", "Tristeza"].map((mood) => (
          <motion.button
            key={mood}
            onClick={() => setActiveMood(mood)}
            whileHover={{ scale: 1.2, x: -5 }}
            whileTap={{ scale: 0.9 }}
            className={`h-10 w-10 rounded-full glass border flex items-center justify-center transition-colors ${
              activeMood === mood ? "border-neon-pink/50 text-neon-pink" : "border-white/10 text-white/40"
            }`}
            title={mood}
          >
            <div className={`h-2 w-2 rounded-full ${activeMood === mood ? "bg-neon-pink" : "bg-white/20"}`} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
