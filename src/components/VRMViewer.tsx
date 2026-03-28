import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm';
import { NeuralKinematicsEngine } from '../lib/NeuralKinematics';

interface VRMViewerProps {
  vrmUrl?: string; // Optional URL to load a specific VRM
  onLoad?: () => void;
  onError?: (err: Error) => void;
}

export const VRMViewer: React.FC<VRMViewerProps> = ({ vrmUrl, onLoad, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vrmRef = useRef<VRM | null>(null);
  const engineRef = useRef<NeuralKinematicsEngine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [emotion, setEmotion] = useState<'neutral' | 'excited' | 'sad' | 'angry'>('neutral');
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);
  const lookAtTarget = useRef(new THREE.Vector3(0, 1.4, 2));

  // Update engine state when UI controls change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMood(emotion);
    }
  }, [emotion]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Mouse Tracking Setup ---
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse coordinates from -1 to 1
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      if (engineRef.current) {
        engineRef.current.setMousePosition(x, y);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(30.0, 1.0, 0.1, 20.0);
    camera.position.set(0.0, 1.4, 1.5); // Focus on upper body/face

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // Post-processing (Holographic / Bloom Effect)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.2;
    bloomPass.strength = 0.8; // Efeito holográfico/neon
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.0, 1.4, 0.0);
    controls.update();

    // Light
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(1.0, 2.0, 1.0).normalize();
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 10;
    light.shadow.camera.left = -2;
    light.shadow.camera.right = 2;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.bias = -0.001;
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 2.0); // Iluminação de emergência
    scene.add(ambientLight);

    // --- Ground & Contact Shadows (Aterramento) ---
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
    const plane = new THREE.Mesh(planeGeometry, shadowMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    plane.receiveShadow = true;
    scene.add(plane);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- VRM Loading ---
    const loader = new GLTFLoader();
    
    // Install VRMLoaderPlugin
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    const loadVRM = (url: string) => {
      setIsLoading(true);
      setErrorMsg(null);
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm;
          if (!vrm) {
            setErrorMsg("O arquivo não contém dados VRM válidos.");
            setIsLoading(false);
            return;
          }
          
          if (vrmRef.current) {
             scene.remove(vrmRef.current.scene);
             VRMUtils.removeUnnecessaryJoints(vrmRef.current.scene);
          }

          VRMUtils.removeUnnecessaryJoints(gltf.scene);
          
          // 5. Materialização Soberana e Normalização de Eixos VRM 1.0
          if (vrm.meta?.metaVersion === '1') {
             console.log("[Soberania] VRM 1.0 detectado. Aplicando matriz de normalização de eixos (Z-Invertido).");
             vrm.scene.rotation.y = Math.PI; // Gira 180 graus
          }

          // Desativar Culling Forçado e Habilitar Sombras
          vrm.scene.traverse((obj: any) => {
            obj.frustumCulled = false;
            if (obj.isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
              if (obj.material) {
                if (Array.isArray(obj.material)) {
                  obj.material.forEach((mat: any) => {
                    mat.side = THREE.DoubleSide;
                    mat.depthWrite = true;
                    mat.needsUpdate = true;
                  });
                } else {
                  obj.material.side = THREE.DoubleSide;
                  obj.material.depthWrite = true;
                  obj.material.needsUpdate = true;
                }
              }
            }
          });

          // Normalização de Eixos (VRM 0.0 vs 1.0)
          // VRM 1.0 models often face backwards (Z-axis inverted) compared to 0.0 in some loaders
          if (vrm.meta?.metaVersion === '1') {
             vrm.scene.rotation.y = Math.PI; // Gira 180 graus
          }

          scene.add(vrm.scene);
          vrm.scene.updateMatrixWorld(true);
          vrmRef.current = vrm;

          // Auto-scale model if it's too small or too large
          const box = new THREE.Box3().setFromObject(vrm.scene);
          const size = box.getSize(new THREE.Vector3());
          if (size.y > 0.001) {
             const targetHeight = 1.5;
             const scale = targetHeight / size.y;
             vrm.scene.scale.setScalar(scale);
             vrm.scene.updateMatrixWorld(true);
          }

          // Sombra de Contato (Grounding Visual)
          const shadowGeometry = new THREE.PlaneGeometry(1, 1);
          const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
          });
          const contactShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
          contactShadow.rotation.x = -Math.PI / 2;
          contactShadow.position.y = 0.01; // Levemente acima do chão para evitar Z-fighting
          
          // Gradiente radial para a sombra
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const context = canvas.getContext('2d');
          if (context) {
            const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 128);
            const shadowTexture = new THREE.CanvasTexture(canvas);
            shadowMaterial.map = shadowTexture;
            shadowMaterial.needsUpdate = true;
          }
          scene.add(contactShadow);

          // Centralizar a câmera no rosto do personagem no primeiro frame
          const headNode = vrm.humanoid?.getNormalizedBoneNode('head');
          if (headNode) {
            const headPos = new THREE.Vector3();
            headNode.getWorldPosition(headPos);
            
            // Ajustar controles e câmera para focar no rosto
            controls.target.copy(headPos);
            camera.position.set(headPos.x, headPos.y, headPos.z + 0.8);
            lookAtTarget.current.copy(headPos);
            controls.update();
          } else {
             const newBox = new THREE.Box3().setFromObject(vrm.scene);
             const newCenter = newBox.getCenter(new THREE.Vector3());
             controls.target.copy(newCenter);
             camera.position.set(newCenter.x, newCenter.y + 0.5, newCenter.z + 1.0);
             lookAtTarget.current.copy(newCenter);
             controls.update();
          }

          // Initialize Neural Kinematics Engine
          engineRef.current = new NeuralKinematicsEngine(vrm);
          engineRef.current.setMood(emotion);

          // --- Módulo Interno de Análise de Espectro (Substituindo Audio2Face/Audio2Gesture) ---
          // Captura áudio do microfone (ou loopback do sistema) para processamento neural de lip-sync
          navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const audioContext = new window.AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            if (engineRef.current) {
              engineRef.current.attachAudioAnalyser(analyser, dataArray);
            }
          }).catch(err => {
            console.warn("Acesso ao microfone negado. Lip-sync neural desativado.", err);
          });

          // --- Bone Debugger (Skeleton Helper) ---
          if (skeletonHelperRef.current) {
            scene.remove(skeletonHelperRef.current);
          }
          const helper = new THREE.SkeletonHelper(vrm.scene);
          const material = helper.material as THREE.LineBasicMaterial;
          material.color.setHex(0x00ff00); // Cute green skeleton
          material.depthTest = false; // Render on top of the mesh
          material.linewidth = 2;
          helper.visible = showSkeleton;
          scene.add(helper);
          skeletonHelperRef.current = helper;
          
          setIsLoading(false);
          if (onLoad) onLoad();
        },
        (progress) => console.log('Loading VRM...', 100.0 * (progress.loaded / progress.total), '%'),
        (error) => {
          console.error(error);
          setIsLoading(false);
          setErrorMsg("Falha ao carregar VRM. Verifique o arquivo.");
          if (onError) onError(error as Error);
        }
      );
    };

    if (vrmUrl) {
       loadVRM(vrmUrl);
    } else {
       setIsLoading(false);
       setErrorMsg("Nenhum modelo VRM carregado. Aguardando input local.");
    }

    // --- Animation Loop ---
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      if (engineRef.current) {
        engineRef.current.update();
      }
      
      // Update SkeletonHelper visibility if it exists
      if (skeletonHelperRef.current) {
        skeletonHelperRef.current.visible = showSkeleton;
      }

      controls.update();
      composer.render();
    };
    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      if (width === 0 || height === 0) return;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    handleResize(); // Initial call

    // --- Cleanup ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [vrmUrl]);

  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-lg overflow-hidden border border-cyan-500/30 flex items-center justify-center">
      <div ref={containerRef} className="absolute inset-0" />
      
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <span className="text-cyan-400 font-mono text-sm">Alocando VRAM para VRM...</span>
        </div>
      )}

      {!isLoading && errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 p-6 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-red-400 font-mono text-sm">{errorMsg}</span>
          <p className="text-slate-500 text-xs mt-2 max-w-xs">
            Aponte para um arquivo .vrm local no seu disco (ex: D:\Modelos\Vaelindra.vrm) usando o terminal de orquestração.
          </p>
        </div>
      )}
      
      {/* Overlay UI for VRM Canvas */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-slate-950/80 border border-cyan-500/50 rounded text-[10px] font-mono text-cyan-400 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
            THREE.JS ENGINE
          </div>
          <div className="px-2 py-1 bg-slate-950/80 border border-purple-500/50 rounded text-[10px] font-mono text-purple-400 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
            NEURAL KINEMATICS (EMBEDDED)
          </div>
          <button 
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-2 py-1 bg-slate-950/80 border rounded text-[10px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
              showSkeleton 
                ? 'border-green-500/80 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                : 'border-slate-500/50 text-slate-400 hover:border-green-500/50 hover:text-green-400'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${showSkeleton ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
            BONE DEBUGGER
          </button>
        </div>

        {/* Simulação de Injeção de Metadados do Ollama */}
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 bg-slate-950/80 border border-slate-700 rounded text-[10px] font-mono text-slate-400 flex items-center">
            [METADADOS OLLAMA]:
          </span>
          {(['neutral', 'excited', 'sad', 'angry'] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEmotion(e)}
              className={`px-2 py-1 bg-slate-950/80 border rounded text-[10px] font-mono transition-colors cursor-pointer uppercase ${
                emotion === e 
                  ? 'border-yellow-500/80 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                  : 'border-slate-500/50 text-slate-400 hover:border-yellow-500/50 hover:text-yellow-400'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* VDI Gateway Controls */}
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 bg-slate-950/80 border border-slate-700 rounded text-[10px] font-mono text-slate-400 flex items-center">
            [VDI GATEWAY]:
          </span>
          <button
            onClick={() => engineRef.current?.triggerSystemGesture('pointing')}
            className="px-2 py-1 bg-slate-950/80 border border-slate-500/50 rounded text-[10px] font-mono text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-pointer uppercase"
          >
            APONTAR TELA
          </button>
          <button
            onClick={() => engineRef.current?.triggerSystemGesture('typing')}
            className="px-2 py-1 bg-slate-950/80 border border-slate-500/50 rounded text-[10px] font-mono text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-pointer uppercase"
          >
            DIGITAR
          </button>
        </div>
      </div>
    </div>
  );
};
