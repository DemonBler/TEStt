import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useSovereignStore } from "../store";

export const VRMViewport: React.FC<{ modelUrl: string }> = ({ modelUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vrmRef = useRef<VRM | null>(null);
  const { mouthLevel } = useSovereignStore();
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    
    // Configuração de Câmera Retrato (Focada no Torso/Rosto)
    const camera = new THREE.PerspectiveCamera(35, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 20);
    camera.position.set(0, 1.35, 1.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Iluminação realista (Amica Style)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        vrmRef.current = vrm;
        scene.add(vrm.scene);
        VRMUtils.rotateVRM0(vrm);
        
        // Gira a personagem para olhar para frente
        vrm.scene.rotation.y = Math.PI; 
        
        console.log("[VRM] Loaded sucessfully");
      },
      (progress) => {
        // loading progress
      },
      (error) => {
        console.error("[VRM] Rendering Failure:", error);
        setLoadError(true);
      }
    );

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      if (vrmRef.current) {
        vrmRef.current.update(delta);
        if (vrmRef.current.expressionManager) {
          // 'aa' é o visema para "Aberto"
          vrmRef.current.expressionManager.setValue("aa", mouthLevel * 1.5);
        }
      }
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-500 font-mono">Falha ao baixar malha 3D. URL bloqueada.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
};
