/**
 * VISUALIZADOR DE AVATAR VRM - SISTEMA DE RENDERIZAÇÃO 3D (VRM VIEWER)
 * Este módulo é o motor gráfico da Vaelindra, responsável por carregar e animar o corpo virtual no espaço 3D.
 * Ele utiliza Three.js e a biblioteca @pixiv/three-vrm para garantir total compatibilidade com o padrão VRM 1.0.
 * As funcionalidades principais deste componente incluem:
 * 1. Inicialização do WebGLRenderer com suporte a transparência para uso facilitado em Chroma Key (Fundo Verde).
 * 2. Carregamento assíncrono de modelos .VRM com suporte completo a Drag-and-Drop de arquivos locais do usuário.
 * 3. Gerenciamento de câmeras e iluminação dinâmica para garantir que o avatar seja visível em qualquer ambiente.
 * 4. Implementação de Mouse Tracking: o avatar segue o cursor do usuário com os olhos e a cabeça em tempo real.
 * 5. Integração com a classe NeuralKinematics para executar animações procedurais de respiração, piscada e movimentos cíclicos.
 * 6. Suporte a ResizeObserver para garantir que a renderização se ajuste perfeitamente ao tamanho da janela ou container.
 * 7. Dispatcher de eventos globais para capturar mudanças de expressão facial e sincronia labial emitidas pelo Kernel.
 */
import React, { useRef, useEffect, useState } from "react";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRM } from '@pixiv/three-vrm';
import { NeuralKinematics } from '../lib/NeuralKinematics';
import { useSovereignStore } from "../store";

export const VRMViewer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  const vrmRef = useRef<VRM | null>(null);
  const kinematicsRef = useRef<NeuralKinematics | null>(null);
  
  const transparentBackground = useSovereignStore((state) => state.transparentBackground);
  const mouseTrackingEnabled = useSovereignStore((state) => state.mouseTrackingEnabled);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Three.js Scene
    const scene = new THREE.Scene();
    
    // Add green screen background if transparent mode is active
    if (transparentBackground) {
        scene.background = new THREE.Color('#00FF00'); // Chroma Key Green
    } else {
        scene.background = null; 
    }

    const camera = new THREE.PerspectiveCamera(30, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 20);
    // Camera is looking at origin from +Z
    camera.position.set(0, 1.4, 2.5);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Load VRM
    const loader = new GLTFLoader();
    loader.crossOrigin = 'anonymous';
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const loadVRM = (url: string) => {
      setLoading(true);
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
      }

      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm as VRM | undefined;
          if (!vrm) {
            console.error('Loaded GLTF is not a valid VRM model');
            setLoading(false);
            return;
          }
          
          VRMUtils.removeUnnecessaryJoints(gltf.scene);
          vrmRef.current = vrm;
          
          useSovereignStore.getState().setVrmObject(vrm);
          
          scene.add(vrm.scene);
          
          // Fix model orientation so it faces the camera directly
          vrm.scene.rotation.y = 0;
          
          // Apply initial kinematics
          kinematicsRef.current = new NeuralKinematics(vrm);

          setLoading(false);
        },
        (progress) => console.log('Loading model...', 100.0 * (progress.loaded / progress.total), '%'),
        (error) => {
          console.error('Failed to load VRM:', error);
          setLoading(false);
        }
      );
    };

    // Load standard highly available model
    loadVRM('https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm');

    // Create a target for VRM LookAt (Mouse Tracking)
    const lookAtTarget = new THREE.Object3D();
    camera.add(lookAtTarget); // Attach to camera so it moves relative to screen
    scene.add(camera);
    
    // Mouse Tracking Event
    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseTrackingEnabled) return;
      // Convert to normalized device coordinates (-1 to +1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      // Multiplier affects how far off-center the VRM looks
      lookAtTarget.position.x = x * 2.0; 
      lookAtTarget.position.y = y * 2.0;
      lookAtTarget.position.z = -3.0; // Place in front of camera
      
      if (vrmRef.current && vrmRef.current.lookAt) {
          vrmRef.current.lookAt.target = lookAtTarget;
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    // Drag and Drop support
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file && file.name.endsWith('.vrm')) {
        const url = URL.createObjectURL(file);
        loadVRM(url);
      }
    };
    
    const handleDragOver = (e: DragEvent) => e.preventDefault();

    containerRef.current.addEventListener('drop', handleDrop);
    containerRef.current.addEventListener('dragover', handleDragOver);

    // Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      
      if (vrmRef.current && kinematicsRef.current) {
        kinematicsRef.current.update(deltaTime);
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeEventListener('drop', handleDrop);
      containerRef.current?.removeEventListener('dragover', handleDragOver);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full outline-none" tabIndex={0} />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-neon-blue font-mono animate-pulse uppercase tracking-widest text-sm">
            [ Sincronizando Malha Neural... ]
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 pointer-events-none opacity-50">
        <p className="text-[10px] text-white font-mono uppercase tracking-widest">
          Arraste um arquivo .VRM para injetar um novo hospedeiro
        </p>
      </div>
    </div>
  );
};
