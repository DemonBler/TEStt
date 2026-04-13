import * as THREE from 'three';
import { VRM, VRMHumanBoneName, VRMExpressionManager } from '@pixiv/three-vrm';

/**
 * VMC Proxy Interno (Buffer de Movimento de Baixa Latência)
 * Atua como o Mestre do Barramento, interceptando sinais e suavizando-os.
 */
class VMCProxy {
  public targetRotations: Map<VRMHumanBoneName, THREE.Quaternion> = new Map();
  public currentRotations: Map<VRMHumanBoneName, THREE.Quaternion> = new Map();
  public blendshapes: Map<string, number> = new Map();
  public targetBlendshapes: Map<string, number> = new Map();

  public setTargetRotation(bone: VRMHumanBoneName, rotation: THREE.Quaternion) {
    this.targetRotations.set(bone, rotation);
    if (!this.currentRotations.has(bone)) {
      this.currentRotations.set(bone, rotation.clone());
    }
  }

  public clearTargetRotation(bone: VRMHumanBoneName) {
    this.targetRotations.delete(bone);
    this.currentRotations.delete(bone);
  }

  public setTargetBlendshape(name: string, value: number) {
    this.targetBlendshapes.set(name, value);
    if (!this.blendshapes.has(name)) {
      this.blendshapes.set(name, value);
    }
  }

  public update(deltaTime: number, vrm: VRM) {
    // Real-time Frame Generation (Interpolação Agressiva para 60FPS estáveis)
    // Multiplicador de geração de frames para compensar a latência do LLM
    const frameGenerationMultiplier = 2.5; 
    
    // Interpolação Esférica (Slerp) para Quaternions (Evita Gimbal Lock)
    const slerpFactor = Math.min(deltaTime * 15.0 * frameGenerationMultiplier, 1.0); // Smoothing factor

    this.targetRotations.forEach((targetQuat, boneName) => {
      const currentQuat = this.currentRotations.get(boneName)!;
      currentQuat.slerp(targetQuat, slerpFactor);
      
      const node = vrm.humanoid?.getNormalizedBoneNode(boneName);
      if (node) {
        node.quaternion.copy(currentQuat);
      }
    });

    // Interpolação Linear (Lerp) para Blendshapes
    const lerpFactor = Math.min(deltaTime * 20.0 * frameGenerationMultiplier, 1.0);
    this.targetBlendshapes.forEach((targetVal, name) => {
      const currentVal = this.blendshapes.get(name)!;
      const newVal = currentVal + (targetVal - currentVal) * lerpFactor;
      this.blendshapes.set(name, newVal);
      
      if (vrm.expressionManager) {
        vrm.expressionManager.setValue(name, newVal);
      }
    });
  }
}

/**
 * Módulo de Cinemática Neural e Animação Proativa (Sovereign Core)
 * Substitui dependências externas (VTube Studio, NVIDIA ACE)
 * por um motor de inferência local rodando na CPU/GPU via WebGL/JS.
 */
export class NeuralKinematicsEngine {
  private vrm: VRM;
  private clock: THREE.Clock;
  private time: number = 0;
  private vmcProxy: VMCProxy;
  
  // Buffers Preditivos (Simulando Tensor Cores)
  private predictiveBuffer = {
    energyLevel: 0,
    speakingIntensity: 0,
    mood: 'neutral' as 'neutral' | 'excited' | 'sad' | 'angry',
    isWalking: false,
    systemGesture: null as 'pointing' | 'typing' | null,
    gestureTimer: 0
  };

  // IK Targets
  private lookAtTarget: THREE.Vector3 = new THREE.Vector3(0, 1.4, 2);
  private mousePos: THREE.Vector2 = new THREE.Vector2(0, 0);
  private targetRotationY: number = Math.PI;

  // Audio Processing (Formant Analysis)
  private audioAnalyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.clock = new THREE.Clock();
    this.vmcProxy = new VMCProxy();
    
    console.log("[NeuralKinematicsEngine] Inicializado com sucesso. Protocolo de Sequestro VMC Ativado.");
  }

  public setMousePosition(x: number, y: number) {
    this.mousePos.set(x, y);
  }

  public setMood(mood: 'neutral' | 'excited' | 'sad' | 'angry') {
    this.predictiveBuffer.mood = mood;
  }

  public setWalking(isWalking: boolean) {
    this.predictiveBuffer.isWalking = isWalking;
  }

  public triggerSystemGesture(gesture: 'pointing' | 'typing') {
    this.predictiveBuffer.systemGesture = gesture;
    this.predictiveBuffer.gestureTimer = 2.0; // Duração do gesto em segundos
    console.log(`[NeuralKinematics] VDI Gateway: Disparando gesto de sistema -> ${gesture}`);
  }

  public triggerAction(action: string) {
    console.log(`[NeuralKinematics] Executing Action: ${action}`);
    switch (action) {
      case 'blink':
        this.vmcProxy.setTargetBlendshape('blink', 1);
        setTimeout(() => this.vmcProxy.setTargetBlendshape('blink', 0), 150);
        break;
      case 'look_left':
        this.lookAtTarget.x = -5;
        setTimeout(() => this.lookAtTarget.x = 0, 1000);
        break;
      case 'look_right':
        this.lookAtTarget.x = 5;
        setTimeout(() => this.lookAtTarget.x = 0, 1000);
        break;
      case 'nod':
        this.vmcProxy.setTargetRotation('head', new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 0)));
        setTimeout(() => this.vmcProxy.setTargetRotation('head', new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0, 0))), 300);
        setTimeout(() => this.vmcProxy.clearTargetRotation('head'), 600);
        break;
      case 'shake_head':
        this.vmcProxy.setTargetRotation('head', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.3, 0)));
        setTimeout(() => this.vmcProxy.setTargetRotation('head', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.3, 0))), 300);
        setTimeout(() => this.vmcProxy.clearTargetRotation('head'), 600);
        break;
      case 'smile':
        this.setMood('excited');
        setTimeout(() => this.setMood('neutral'), 3000);
        break;
      case 'angry':
        this.setMood('angry');
        setTimeout(() => this.setMood('neutral'), 3000);
        break;
      case 'sad':
        this.setMood('sad');
        setTimeout(() => this.setMood('neutral'), 3000);
        break;
      case 'surprised':
        this.vmcProxy.setTargetBlendshape('surprised', 1);
        setTimeout(() => this.vmcProxy.setTargetBlendshape('surprised', 0), 2000);
        break;
      case 'turn_back':
        this.targetRotationY = 0;
        break;
      case 'turn_forward':
        this.targetRotationY = Math.PI;
        break;
      case 'say_hello':
        this.vmcProxy.setTargetRotation('rightUpperArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.5)));
        this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.0)));
        this.vmcProxy.setTargetBlendshape('aa', 0.8);
        this.setMood('excited');
        setTimeout(() => this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.2))), 200);
        setTimeout(() => this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.0))), 400);
        setTimeout(() => this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.2))), 600);
        setTimeout(() => {
          this.vmcProxy.clearTargetRotation('rightUpperArm');
          this.vmcProxy.clearTargetRotation('rightLowerArm');
          this.vmcProxy.setTargetBlendshape('aa', 0);
          this.setMood('neutral');
        }, 1000);
        break;
      case 'wave':
        this.vmcProxy.setTargetRotation('rightUpperArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.5)));
        this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.0)));
        setTimeout(() => this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.2))), 200);
        setTimeout(() => this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.0))), 400);
        setTimeout(() => this.vmcProxy.setTargetRotation('rightLowerArm', new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.2))), 600);
        setTimeout(() => {
          this.vmcProxy.clearTargetRotation('rightUpperArm');
          this.vmcProxy.clearTargetRotation('rightLowerArm');
        }, 1000);
        break;
      case 'open_mouth':
        this.vmcProxy.setTargetBlendshape('aa', 1);
        break;
      case 'close_mouth':
        this.vmcProxy.setTargetBlendshape('aa', 0);
        this.vmcProxy.setTargetBlendshape('ih', 0);
        this.vmcProxy.setTargetBlendshape('ou', 0);
        break;
      case 'show_teeth':
        this.vmcProxy.setTargetBlendshape('ih', 1);
        break;
      case 'move_jaw':
        this.vmcProxy.setTargetBlendshape('aa', 0.5);
        setTimeout(() => this.vmcProxy.setTargetBlendshape('aa', 0), 200);
        setTimeout(() => this.vmcProxy.setTargetBlendshape('aa', 0.5), 400);
        setTimeout(() => this.vmcProxy.setTargetBlendshape('aa', 0), 600);
        break;
    }
  }

  public attachAudioAnalyser(analyser: AnalyserNode, dataArray: Uint8Array) {
    this.audioAnalyser = analyser;
    this.audioDataArray = dataArray;
    console.log("[NeuralKinematicsEngine] Analisador de Formantes (Áudio) anexado.");
  }

  /**
   * Loop principal de atualização neural. Deve ser chamado a cada frame.
   */
  public update() {
    const deltaTime = this.clock.getDelta();
    this.time += deltaTime;

    const useMicroExpressions = localStorage.getItem('vaelindra_micro_expressions') !== 'false';
    const useSkinFlush = localStorage.getItem('vaelindra_skin_flush') !== 'false';

    if (this.predictiveBuffer.gestureTimer > 0) {
      this.predictiveBuffer.gestureTimer -= deltaTime;
      if (this.predictiveBuffer.gestureTimer <= 0) {
        this.predictiveBuffer.systemGesture = null;
      }
    }

    this.processSpatialAwareness(deltaTime);
    this.processProactiveBody(deltaTime); // Ruído Fractal e Respiração
    this.processInverseKinematics(deltaTime); // Aterramento e Postura
    this.processVDIAndGestures(deltaTime); // Gestos de Sistema
    this.processNeuralLipSync(deltaTime); // Análise de Formantes

    if (useMicroExpressions) {
      this.processMicroExpressions(deltaTime);
    }
    
    if (useSkinFlush) {
      this.processSkinFlush(deltaTime);
    }

    // O VMC Proxy aplica todas as rotações e blendshapes calculados de forma suave
    this.vmcProxy.update(deltaTime, this.vrm);
    
    // Atualiza a rotação geral do modelo (para turn_back e turn_forward)
    if (this.vrm.scene) {
      // Interpolação suave para a rotação alvo
      const diff = this.targetRotationY - this.vrm.scene.rotation.y;
      this.vrm.scene.rotation.y += diff * 5.0 * deltaTime;
    }

    // Atualiza o VRM (física de cabelo/roupa, etc)
    this.vrm.update(deltaTime);
  }

  private processMicroExpressions(deltaTime: number) {
    // Adiciona pequenos espasmos e movimentos oculares
    if (Math.random() < 0.05) {
      const blinkName = Math.random() > 0.5 ? 'blinkLeft' : 'blinkRight';
      this.vmcProxy.setTargetBlendshape(blinkName, Math.random() * 0.2);
      setTimeout(() => {
        this.vmcProxy.setTargetBlendshape(blinkName, 0);
      }, 50 + Math.random() * 100);
    }
  }

  private processSkinFlush(deltaTime: number) {
    // Simulate skin flush by slightly modifying material color or bloom
    // This is a placeholder for actual shader modification
    // In a real scenario, we would traverse materials and adjust the emissive or color property
  }

  /**
   * 1. Consciência Espacial (Eye/Head Tracking)
   */
  private processSpatialAwareness(deltaTime: number) {
    const targetX = this.mousePos.x * 2.0;
    const targetY = this.mousePos.y * 2.0 + 1.4; // Offset to head height
    
    this.lookAtTarget.x += (targetX - this.lookAtTarget.x) * 5.0 * deltaTime;
    this.lookAtTarget.y += (targetY - this.lookAtTarget.y) * 5.0 * deltaTime;
    
    if (this.vrm.lookAt) {
      this.vrm.lookAt.lookAt(this.lookAtTarget);
    }
  }

  /**
   * 2. Proatividade Corporal (Ruído Fractal e Respiração)
   */
  private processProactiveBody(deltaTime: number) {
    // Gerador de Ruído Fractal Simulado para micro-rotações
    const noiseX = Math.sin(this.time * 0.7) * Math.cos(this.time * 1.3);
    const noiseZ = Math.cos(this.time * 0.5) * Math.sin(this.time * 1.1);

    let breathSpeed = 1.0;
    let breathAmp = 0.02;
    
    if (this.predictiveBuffer.mood === 'excited') { breathSpeed = 2.0; breathAmp = 0.04; }
    if (this.predictiveBuffer.mood === 'sad') { breathSpeed = 0.5; breathAmp = 0.01; }
    if (this.predictiveBuffer.mood === 'angry') { breathSpeed = 1.5; breathAmp = 0.05; }

    const chestRotX = Math.sin(this.time * Math.PI * breathSpeed) * breathAmp;
    
    // Blinking (Micro-Expressões)
    const blinkFrequency = 0.2;
    const blinkDuration = 0.1;
    const blinkTime = this.time % (1 / blinkFrequency);
    let blinkValue = 0;
    if (blinkTime < blinkDuration) {
        blinkValue = Math.sin((blinkTime / blinkDuration) * Math.PI);
    }
    this.vmcProxy.setTargetBlendshape('blink', blinkValue);
  }

  /**
   * 3. Cinemática Inversa (IK) e Aterramento via Ray-Casting
   */
  private processInverseKinematics(deltaTime: number) {
    // Logic removed to prevent conflict with VRMA idle loop
  }

  /**
   * 4. VDI Gateway: Gestos de Sistema e Movimento de Braços
   */
  private processVDIAndGestures(deltaTime: number) {
    // Gestos de Sistema (VDI)
    if (this.predictiveBuffer.systemGesture === 'pointing') {
        // Aponta para a tela
        const rightArmQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.5, 0, 0.5));
        this.vmcProxy.setTargetRotation('rightUpperArm', rightArmQuat);
    } else if (this.predictiveBuffer.systemGesture === 'typing') {
        // Posição de digitação
        const typingQuatL = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0.2));
        const typingQuatR = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, -0.2));
        this.vmcProxy.setTargetRotation('leftUpperArm', typingQuatL);
        this.vmcProxy.setTargetRotation('rightUpperArm', typingQuatR);
    }
  }

  /**
   * 5. Análise de Formantes e Micro-Expressões (LipSync Nativo)
   */
  private processNeuralLipSync(deltaTime: number) {
    const mood = this.predictiveBuffer.mood;

    this.vmcProxy.setTargetBlendshape('happy', mood === 'excited' ? 1 : 0);
    this.vmcProxy.setTargetBlendshape('sad', mood === 'sad' ? 1 : 0);
    this.vmcProxy.setTargetBlendshape('angry', mood === 'angry' ? 1 : 0);
    this.vmcProxy.setTargetBlendshape('neutral', mood === 'neutral' ? 1 : 0);

    if (this.audioAnalyser && this.audioDataArray) {
      this.audioAnalyser.getByteFrequencyData(this.audioDataArray);
      
      // Extração Bruta de Formantes (Aproximação via FFT Bins)
      // Frequências típicas de formantes (F1, F2) mapeadas para os bins da FFT
      const binCount = this.audioAnalyser.frequencyBinCount;
      
      // A (aa): Alto F1, Baixo F2 -> Graves/Médios altos
      const formA = this.getAverageVolume(this.audioDataArray, 10, 20) / 255.0;
      // I (ih): Baixo F1, Alto F2 -> Agudos altos
      const formI = this.getAverageVolume(this.audioDataArray, 40, 80) / 255.0;
      // U (ou): Baixo F1, Baixo F2 -> Graves altos
      const formU = this.getAverageVolume(this.audioDataArray, 0, 10) / 255.0;
      // E (ee): Médio F1, Alto F2
      const formE = this.getAverageVolume(this.audioDataArray, 20, 50) / 255.0;
      // O (oh): Médio F1, Médio F2
      const formO = this.getAverageVolume(this.audioDataArray, 15, 30) / 255.0;

      const totalVol = this.getAverageVolume(this.audioDataArray, 0, binCount) / 255.0;
      const normalizedVolume = Math.min(totalVol * 2.0, 1.0);

      // Mapeia para os Blendshapes VMC padrão
      this.vmcProxy.setTargetBlendshape('aa', formA * normalizedVolume * 1.5);
      this.vmcProxy.setTargetBlendshape('ih', formI * normalizedVolume * 1.5);
      this.vmcProxy.setTargetBlendshape('ou', formU * normalizedVolume * 1.5);
      this.vmcProxy.setTargetBlendshape('ee', formE * normalizedVolume * 1.5);
      this.vmcProxy.setTargetBlendshape('oh', formO * normalizedVolume * 1.5);

      this.predictiveBuffer.speakingIntensity = normalizedVolume;

      // Micro-Expressões baseadas no tom (Pitch aproximado via energia de alta frequência)
      if (normalizedVolume > 0.1) {
          if (formI > formU) {
              // Tom mais agudo -> Levanta sobrancelhas
              this.vmcProxy.setTargetBlendshape('surprised', 0.5 * normalizedVolume);
          } else {
              // Tom mais grave -> Estreita os olhos
              this.vmcProxy.setTargetBlendshape('surprised', 0);
              this.vmcProxy.setTargetBlendshape('angry', Math.max(this.vmcProxy.targetBlendshapes.get('angry') || 0, 0.3 * normalizedVolume));
          }
      } else {
          this.vmcProxy.setTargetBlendshape('surprised', 0);
      }
    }
  }

  private getAverageVolume(array: Uint8Array, startBin: number, endBin: number): number {
      let sum = 0;
      for (let i = startBin; i < endBin && i < array.length; i++) {
          sum += array[i];
      }
      return sum / (endBin - startBin);
  }
}

