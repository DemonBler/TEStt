import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { EXPRESSION_DICTIONARY } from './ExpressionDictionary';
import { useSovereignStore } from '../store';
export { EXPRESSION_DICTIONARY };

export class NeuralKinematics {
  private vrm: VRM | null = null;
  private actionTimeout: any = null;
  private timeOffset: number = 0;
  private nextBlinkTime: number = 0;
  private isBlinking: boolean = false;
  private blinkDuration: number = 0;
  private currentAction: string = 'neutral';
  private targetMouthOpen: number = 0;
  private currentMouthOpen: number = 0;

  // Lógica de interpolação suave
  private lerp(current: number, target: number, speed: number) {
    return current + (target - current) * speed;
  }

  public updateMouthIntensity(amplitude: number) {
     this.targetMouthOpen = Math.min(amplitude * 2.0, 1.0); // Amplifica ligeiramente a leitura
  }

  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.nextBlinkTime = Math.random() * 3 + 2; // Random blink between 2-5 seconds
    window.addEventListener('neural_action', (e: any) => this.triggerAction(e.detail.action));
    window.addEventListener('neural_viseme', (e: any) => this.updateVisemes(e.detail));
  }

  public triggerAction(action: string) {
    if (!this.vrm) return;
    const config = EXPRESSION_DICTIONARY ? (EXPRESSION_DICTIONARY[action] || EXPRESSION_DICTIONARY['neutral']) : null;
    this.currentAction = action;

    if (this.vrm.expressionManager && config) {
      // Clear standard presets
      const standardPresets = ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised', 'aa', 'ih', 'uu', 'ee', 'oo', 'blink', 'blinkLeft', 'blinkRight', 'lookUp', 'lookDown', 'lookLeft', 'lookRight', 'joy', 'sorrow', 'fun'];
      for (const preset of standardPresets) {
         try {
           this.vrm.expressionManager.setValue(preset as any, 0);
         } catch(e) {}
      }

      // Apply new config with Cross-Version Fallbacks
      for (const [key, value] of Object.entries(config || {})) {
          const val = value as number;
          const manager = this.vrm.expressionManager;
          
          const trySet = (names: string[]) => {
              for (const name of names) {
                  try {
                      // Attempt to set by exact name or preset
                      manager.setValue(name as any, val);
                      if (manager.getValue(name as any) === val) return true;
                  } catch(e) {}
              }
              return false;
          };

          // Group common aliases
          if (key === 'joy' || key === 'happy') {
              if (!trySet(['happy', 'joy', 'smile'])) {
                  // Final fallback: try partial matches
                  trySet(['Happy', 'Joy', 'Smile']);
              }
          } else if (key === 'angry') {
              trySet(['angry', 'Angry', 'frown']);
          } else if (key === 'sorrow' || key === 'sad') {
              trySet(['sad', 'sorrow', 'Sorrow', 'Sad']);
          } else if (key === 'relaxed' || key === 'fun') {
              trySet(['relaxed', 'fun', 'Relaxed', 'Fun']);
          } else if (key === 'surprised') {
              trySet(['surprised', 'Surprised', 'shock']);
          } else {
              // Try exact name as provided
              trySet([key]);
          }
      }
      
      this.vrm.expressionManager.update();
    }

    // Auto-reset
    if (this.actionTimeout) clearTimeout(this.actionTimeout);
    const duration = (action.includes('blink') || action.includes('wink')) ? 150 : 4000;
    this.actionTimeout = setTimeout(() => {
      const isPlaying = (window as any).sovereignIsPlaying || false;
      if (isPlaying && action !== 'neutral') {
          // AI is still speaking, defer reset
          this.triggerAction(action);
      } else {
          this.triggerAction('neutral');
      }
    }, duration);
  }

  public updateVisemes(values: { [key: string]: number }) {
    if (!this.vrm || !this.vrm.expressionManager) return;
    for (const [key, value] of Object.entries(values)) {
      // Compatibility mapping
      let targetKey = key;
      if (targetKey === 'ou') targetKey = 'uu';
      if (targetKey === 'oh') targetKey = 'oo';
      try {
        this.vrm.expressionManager.setValue(targetKey as any, value);
      } catch(e) {}
    }

    // Procedural head tilt during speech
    if (this.vrm.humanoid) {
        const head = this.getBone('head');
        if (head && values.aa > 0.1) {
            head.rotation.x += Math.sin(this.timeOffset * 15) * values.aa * 0.015;
            head.rotation.z += Math.cos(this.timeOffset * 5) * values.aa * 0.01;
        }
    }

    this.vrm.expressionManager.update();
  }

  private getBone(name: string) {
    if (!this.vrm || !this.vrm.humanoid) return null;
    // Try normalized node first (best for procedural animation in VRM 1.0)
    try {
        // VRM 1.0 standard bone names are typically lowercase in string lookups for some shims, 
        // but let's be safe and try camelCase and standard names.
        const bone = (this.vrm.humanoid as any).getNormalizedBoneNode(name) || 
                     (this.vrm.humanoid as any).getBoneNode(name);
        if (bone) return bone;
    } catch(e) {}
    
    // Fallback search
    const found: THREE.Object3D[] = [];
    this.vrm.scene.traverse((obj) => {
        if (obj.name.toLowerCase().includes(name.toLowerCase())) found.push(obj);
    });
    return found[0] || null;
  }

  public update(delta: number) {
    if (!this.vrm) return;
    this.timeOffset += delta;
    
    // Auto-Blink Logic
    if (this.vrm.expressionManager && !this.currentAction.includes('blink') && !this.currentAction.includes('wink')) {
       this.nextBlinkTime -= delta;
       
       if (this.nextBlinkTime <= 0 && !this.isBlinking) {
           this.isBlinking = true;
           this.blinkDuration = 0.12 + Math.random() * 0.08; 
       }
       
       if (this.isBlinking) {
           this.blinkDuration -= delta;
           this.vrm.expressionManager.setValue('blink', 1);
           
           if (this.blinkDuration <= 0) {
               this.isBlinking = false;
               this.vrm.expressionManager.setValue('blink', 0);
               this.nextBlinkTime = Math.random() * 4 + 3; // Breathe more between blinks
           }
       }
    }
    
    // -------------------------------------------------------------------------
    // PROCEDURAL ANIMATION: THE SOUL OF THE AVATAR
    // -------------------------------------------------------------------------
    if (this.vrm.humanoid) {
       const spine = this.getBone('spine');
       const chest = this.getBone('chest');
       const head = this.getBone('head');
       const neck = this.getBone('neck');
       const leftShoulder = this.getBone('leftShoulder');
       const rightShoulder = this.getBone('rightShoulder');
       
       // 1. Organic Breathing (Slower, deeper)
       const breathFactor = Math.sin(this.timeOffset * 0.8);
       if (chest) {
           chest.rotation.x = breathFactor * 0.025 + 0.01;
           // Shoulder micro-movement with breath
           if (leftShoulder) leftShoulder.rotation.z = -0.01 + breathFactor * 0.005;
           if (rightShoulder) rightShoulder.rotation.z = 0.01 - breathFactor * 0.005;
       }

       if (spine) {
           spine.rotation.x = Math.sin(this.timeOffset * 0.8 + 0.6) * 0.015;
           spine.rotation.z = Math.sin(this.timeOffset * 0.3) * 0.01;
       }

       // 2. Nervous/Organic Neck & Head Drift
       if (neck) {
          neck.rotation.x = Math.sin(this.timeOffset * 0.45) * 0.02;
          neck.rotation.y = Math.cos(this.timeOffset * 0.2) * 0.03;
       }
       
    if (head && (this.currentAction === 'neutral' || this.currentAction === 'idle')) {
        // Check if speaking via global flag
        const isPlaying = (window as any).sovereignIsPlaying || false;

        // Complex drift (sum of sines)
        head.rotation.y = Math.sin(this.timeOffset * 0.5) * 0.04 + Math.sin(this.timeOffset * 1.5) * 0.01;
        head.rotation.x = Math.cos(this.timeOffset * 0.7) * 0.03 + Math.sin(this.timeOffset * 0.2) * 0.02;
        head.rotation.z = Math.cos(this.timeOffset * 0.4) * 0.01;
        
        // Add more emphasized movement during speech
        if (isPlaying) {
            head.rotation.y += Math.sin(this.timeOffset * 1.8) * 0.06;
            head.rotation.x += Math.cos(this.timeOffset * 2.5) * 0.03;
            head.rotation.z += Math.sin(this.timeOffset * 1.1) * 0.02;
        }
    }
       
       // 3. Eye Saccades (Essential for "life" feeling)
       // We don't rotate eyes directly if lookAt is active, but we can add micro-offsets
       // In VRM 1.0, lookAt handles the eyes if we set the target.
       // However, we can add a tiny bit of jitter to the lookAt target itself in VRMViewer if needed.
    }

    // Lógica de Lip-Sync Suave (Procedural)
    if (this.vrm.expressionManager) {
      const mouthLevel = useSovereignStore.getState().mouthLevel;
      this.currentMouthOpen = this.lerp(this.currentMouthOpen, mouthLevel, 0.25);
      this.vrm.expressionManager.setValue('aa', this.currentMouthOpen); // aa é o padrão mais comum para boca aberta
    }
    
    this.vrm.update(delta);
  }
}
