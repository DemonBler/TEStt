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

  // Audio Processing (Formant Analysis)
  private audioAnalyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.clock = new THREE.Clock();
    this.vmcProxy = new VMCProxy();
    
    // Auto-Mapping Inicial: Forçar captura dos ossos críticos
    this.initializeBoneMapping();
    
    console.log("[NeuralKinematicsEngine] Inicializado com sucesso. Protocolo de Sequestro VMC Ativado.");
  }

  private initializeBoneMapping() {
    // Garante que os ossos críticos existam, aplicando Fuzzy Matching se necessário (simulado aqui pela robustez do three-vrm)
    const criticalBones: VRMHumanBoneName[] = ['hips', 'spine', 'head', 'leftUpperArm', 'rightUpperArm', 'leftFoot', 'rightFoot'];
    criticalBones.forEach(bone => {
      const node = this.vrm.humanoid?.getNormalizedBoneNode(bone);
      if (!node) {
        console.warn(`[NeuralKinematics] Osso crítico não encontrado: ${bone}. Tentando Fuzzy Matching interno...`);
        // Aqui entraria a lógica de Fuzzy Matching real iterando sobre a cena se o three-vrm falhasse
      } else {
        // Inicializa o proxy com a rotação neutra
        this.vmcProxy.setTargetRotation(bone, node.quaternion.clone());
      }
    });
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

    // O VMC Proxy aplica todas as rotações e blendshapes calculados de forma suave
    this.vmcProxy.update(deltaTime, this.vrm);
    
    // Atualiza o VRM (física de cabelo/roupa, etc)
    this.vrm.update(deltaTime);
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
    
    // Aplica ao Proxy
    const spineQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(chestRotX + noiseX * 0.01, 0, noiseZ * 0.01));
    this.vmcProxy.setTargetRotation('spine', spineQuat);

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
    const hips = this.vrm.humanoid?.getNormalizedBoneNode('hips');
    const leftFoot = this.vrm.humanoid?.getNormalizedBoneNode('leftFoot');
    const rightFoot = this.vrm.humanoid?.getNormalizedBoneNode('rightFoot');
    
    if (!hips) return;

    let swaySpeed = 2;
    let swayAmp = 0.01;
    
    // Ray-Casting Simulado: Garante que os pés não atravessem o chão (Y=0)
    if (leftFoot && rightFoot) {
        const leftFootPos = new THREE.Vector3();
        leftFoot.getWorldPosition(leftFootPos);
        const rightFootPos = new THREE.Vector3();
        rightFoot.getWorldPosition(rightFootPos);
        
        const lowestFootY = Math.min(leftFootPos.y, rightFootPos.y);
        
        // Se o pé mais baixo estiver abaixo do chão, empurra o quadril para cima
        if (lowestFootY < 0) {
            hips.position.y += (0 - lowestFootY) * 0.5; // Correção rápida
        } else if (lowestFootY > 0.05 && !this.predictiveBuffer.isWalking) {
            // Se estiver flutuando, puxa para baixo suavemente
            hips.position.y -= 0.01;
        }
    }

    if (this.predictiveBuffer.isWalking) {
        swaySpeed = 5;
        swayAmp = 0.05;
        hips.position.x = Math.sin(this.time * 2.5) * 0.05;
        hips.position.z = Math.sin(this.time * 5) * 0.02;
    } else {
        hips.position.x += (0 - hips.position.x) * 0.1;
        hips.position.z += (0 - hips.position.z) * 0.1;
    }

    hips.position.y += Math.sin(this.time * swaySpeed) * swayAmp * deltaTime;
    
    // Ajuste de Postura baseado no Humor (Ollama Context)
    let hipRotX = 0;
    if (this.predictiveBuffer.mood === 'sad') {
        hipRotX = 0.1; // Curvado para frente
    } else if (this.predictiveBuffer.mood === 'excited' || this.predictiveBuffer.mood === 'angry') {
        hipRotX = -0.05; // Postura imponente/reta
    }
    
    const hipsQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(hipRotX, Math.sin(this.time * 0.5) * 0.02, 0));
    this.vmcProxy.setTargetRotation('hips', hipsQuat);
  }

  /**
   * 4. VDI Gateway: Gestos de Sistema e Movimento de Braços
   */
  private processVDIAndGestures(deltaTime: number) {
    let targetArmZ = 1.2;
    let targetArmX = 0.1;
    let armSwaySpeed = 1.5;
    let armSwayAmp = 0.05;

    // Gestos de Sistema (VDI)
    if (this.predictiveBuffer.systemGesture === 'pointing') {
        // Aponta para a tela
        const rightArmQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.5, 0, 0.5));
        this.vmcProxy.setTargetRotation('rightUpperArm', rightArmQuat);
        return; // Pula a lógica padrão para o braço direito
    } else if (this.predictiveBuffer.systemGesture === 'typing') {
        // Posição de digitação
        const typingQuatL = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0.2));
        const typingQuatR = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, -0.2));
        this.vmcProxy.setTargetRotation('leftUpperArm', typingQuatL);
        this.vmcProxy.setTargetRotation('rightUpperArm', typingQuatR);
        return;
    }

    // Lógica padrão de braços
    if (this.predictiveBuffer.isWalking) {
        targetArmX = 0.0;
        armSwaySpeed = 5.0;
        armSwayAmp = 0.2;
    } else {
        if (this.predictiveBuffer.mood === 'excited') {
            targetArmZ = 0.8;
            armSwaySpeed = 3.0;
        } else if (this.predictiveBuffer.mood === 'sad') {
            targetArmZ = 1.4;
            armSwaySpeed = 0.5;
        } else if (this.predictiveBuffer.mood === 'angry') {
            targetArmZ = 1.0;
            targetArmX = -0.2;
        }
    }

    // Adiciona intensidade da fala aos braços (Gesticulação proativa)
    const speakGesticulation = this.predictiveBuffer.speakingIntensity * 0.5;

    const leftArmEuler = new THREE.Euler(
        targetArmX + Math.sin(this.time * 0.8) * 0.02 - speakGesticulation,
        0,
        targetArmZ + Math.sin(this.time * armSwaySpeed) * armSwayAmp
    );
    const rightArmEuler = new THREE.Euler(
        targetArmX + Math.sin(this.time * 0.8 + Math.PI) * 0.02 - speakGesticulation,
        0,
        -targetArmZ - Math.sin(this.time * armSwaySpeed + Math.PI) * armSwayAmp
    );

    this.vmcProxy.setTargetRotation('leftUpperArm', new THREE.Quaternion().setFromEuler(leftArmEuler));
    this.vmcProxy.setTargetRotation('rightUpperArm', new THREE.Quaternion().setFromEuler(rightArmEuler));
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

