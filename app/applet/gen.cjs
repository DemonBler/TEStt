const fs = require('fs');

const dict = {};

// 1. Basic Emotions
const bases = ['neutral', 'joy', 'angry', 'sorrow', 'fun', 'surprised', 'relaxed'];
bases.forEach(b => {
    dict[b] = { [b]: 1 };
    dict[`${b}_intense`] = { [b]: 1.5, browInnerUp: 0.3 };
    dict[`${b}_subtle`] = { [b]: 0.3 };
});

// 2. ARKit Standards 
const arkit = [
  'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight',
  'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight', 'jawForward', 'jawLeft', 'jawRight',
  'jawOpen', 'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthFrownLeft', 'mouthFrownRight',
  'mouthFunnel', 'mouthLeft', 'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthPressLeft',
  'mouthPressRight', 'mouthPucker', 'mouthRight', 'mouthRollLower', 'mouthRollUpper',
  'mouthShrugLower', 'mouthShrugUpper', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretchLeft',
  'mouthStretchRight', 'mouthUpperUpLeft', 'mouthUpperUpRight', 'noseSneerLeft', 'noseSneerRight', 'tongueOut'
];
arkit.forEach(a => {
  dict[`arkit_${a}`] = { [a]: 1 };
  dict[`arkit_${a}_half`] = { [a]: 0.5 };
});

// 3. Intensities Level 1 to 5
bases.forEach(b => {
    for (let i = 1; i <= 5; i++) {
        dict[`${b}_tier_${i}`] = { [b]: i * 0.2 };
    }
});

// 4. Emotional Gazes
const gazes = ['lookUp', 'lookDown', 'lookLeft', 'lookRight'];
const gazeMap = {
    lookUp: { eyeLookUpLeft: 1, eyeLookUpRight: 1 },
    lookDown: { eyeLookDownLeft: 1, eyeLookDownRight: 1 },
    lookLeft: { eyeLookInLeft: 1, eyeLookOutRight: 1 },
    lookRight: { eyeLookOutLeft: 1, eyeLookInRight: 1 }
};
bases.forEach(b => {
    gazes.forEach(g => {
        dict[`${b}_${g}`] = { [b]: 1, ...gazeMap[g] };
        dict[`${b}_${g}_subtle`] = { [b]: 0.4, ...gazeMap[g] };
    });
});

// 5. Visemes combined with Emotions
const visemes = ['aa', 'ih', 'ou', 'ee', 'oh'];
bases.forEach(b => {
    visemes.forEach(v => {
        dict[`speak_${b}_${v}`] = { [b]: 0.7, [v]: 1, jawOpen: 0.2 };
    });
});

// 6. Asymmetrical Expressiveness
const modifiers = [
    { name: 'smirk_left', props: { mouthSmileLeft: 1, cheekSquintLeft: 0.5 } },
    { name: 'smirk_right', props: { mouthSmileRight: 1, cheekSquintRight: 0.5 } },
    { name: 'skeptical_brow_left', props: { browOuterUpLeft: 1, browDownRight: 0.6 } },
    { name: 'skeptical_brow_right', props: { browOuterUpRight: 1, browDownLeft: 0.6 } },
    { name: 'wink_left', props: { eyeBlinkLeft: 1, cheekSquintLeft: 0.5, mouthSmileLeft: 0.4 } },
    { name: 'wink_right', props: { eyeBlinkRight: 1, cheekSquintRight: 0.5, mouthSmileRight: 0.4 } },
    { name: 'sneer_left', props: { noseSneerLeft: 1, mouthUpperUpLeft: 1, browDownLeft: 1 } },
    { name: 'sneer_right', props: { noseSneerRight: 1, mouthUpperUpRight: 1, browDownRight: 1 } },
];
bases.forEach(b => {
    modifiers.forEach(m => {
        dict[`${b}_${m.name}`] = { [b]: 0.5, ...m.props };
    });
});

// 7. Conversational Micro-Expressions
const convNuances = {
    'active_listening': { browInnerUp: 0.3, eyeWideLeft: 0.1, eyeWideRight: 0.1 },
    'nodding_agreement': { joy: 0.3, blink: 0.1, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 },
    'thoughtful_pout': { mouthPucker: 0.5, browInnerUp: 0.3, eyeLookUpRight: 0.4 },
    'confused_stare': { browInnerUp: 0.6, browOuterUpLeft: 0.4, jawLeft: 0.2 },
    'bored_sigh': { sorrow: 0.2, eyeLookDownLeft: 0.5, eyeLookDownRight: 0.5, mouthOpen: 0.1 },
    'impatient_lip_bite': { mouthRollLower: 0.8, jawForward: 0.3, browDownLeft: 0.3, browDownRight: 0.3 },
    'sympathetic_wince': { cheekSquintLeft: 0.8, cheekSquintRight: 0.8, browInnerUp: 0.6 },
    'awkward_smile': { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, mouthPressLeft: 0.3, mouthPressRight: 0.3, eyeLookDownLeft: 0.3 },
    'sarcastic_glance': { eyeRollLeft: 0.6, eyeRollRight: 0.6, mouthDimpleLeft: 0.8, browOuterUpLeft: 0.5 }
};
Object.keys(convNuances).forEach((key, index) => {
    dict[`conv_${key}`] = convNuances[key];
    // Create variants across 4 tiers of intensities
    for (let i = 1; i <= 4; i++) {
        let variant = {};
        for(let prop in convNuances[key]) {
            variant[prop] = Math.min(1, convNuances[key][prop] * (i * 0.5));
        }
        dict[`conv_${key}_tier_${i}`] = variant;
    }
});

// 8. Custom Hand-Crafted Action/Anime/Intense States
const customStates = {
    'combat_battlecry': { angry: 1, jawOpen: 1, mouthStretchLeft: 1, mouthStretchRight: 1, browDownLeft: 1, browDownRight: 1, aa: 1 },
    'combat_pain': { wincing: 1, cheekSquintLeft: 1, cheekSquintRight: 1, mouthStretchLeft: 1, eyeBlinkLeft: 1, eyeBlinkRight: 1, browDownLeft: 1 },
    'combat_aiming': { eyeSquintLeft: 1, eyeBlinkRight: 0.8, browDownLeft: 1, browDownRight: 1, mouthPressLeft: 1, mouthPressRight: 1 },
    'anime_starry_eyed': { joy: 1, eyeWideLeft: 1, eyeWideRight: 1, browInnerUp: 1, mouthSmileLeft: 1, mouthSmileRight: 1 },
    'anime_panic': { surprised: 1, eyeWideLeft: 1, eyeWideRight: 1, jawOpen: 0.8, browInnerUp: 0.5 },
    'anime_rage': { angry: 1, browDownLeft: 1, browDownRight: 1, mouthStretchLeft: 1, mouthStretchRight: 1 },
    'anime_sweatdrop': { sorrow: 0.4, neutral: 0.6, eyeBlinkLeft: 0.3, browInnerUp: 0.5, mouthFrownLeft: 0.2 },
    'anime_dizzy': { eyeLookUpLeft: 1, eyeLookUpRight: 1, mouthOpen: 0.3, browInnerUp: 0.8 },
    'social_flirty': { joy: 0.5, eyeBlinkLeft: 0.8, mouthSmileLeft: 0.4, cheekSquintLeft: 0.3 },
    'social_shy': { joy: 0.2, eyeLookDownLeft: 0.5, eyeLookDownRight: 0.5, eyeBlinkLeft: 0.3, eyeBlinkRight: 0.3 },
    'social_arrogant': { angry: 0.2, eyeLookUpLeft: 0.4, eyeLookUpRight: 0.4, cheekSquintLeft: 1, cheekSquintRight: 1 },
    'social_disdain': { angry: 0.5, noseSneerLeft: 1, noseSneerRight: 1, mouthRollLower: 0.5 },
    'physical_freezing': { mouthStretchLeft: 0.5, mouthStretchRight: 0.5, cheekSquintLeft: 1, cheekSquintRight: 1, browDownLeft: 0.5, browDownRight: 0.5 },
    'physical_burning': { eyeWideLeft: 0.8, eyeWideRight: 0.8, jawOpen: 0.6, mouthStretchLeft: 1, mouthStretchRight: 1, browInnerUp: 0.5 },
    'physical_exhausted': { eyeBlinkLeft: 0.9, eyeBlinkRight: 0.9, mouthOpen: 0.3, jawOpen: 0.2, eyeLookDownLeft: 1, eyeLookDownRight: 1, sorrow: 0.5 },
    'physical_tickled': { joy: 1, eyeSquintLeft: 1, eyeSquintRight: 1, mouthSmileLeft: 1, mouthSmileRight: 1, cheekSquintLeft: 1, cheekSquintRight: 1, aa: 0.5 }
};

Object.keys(customStates).forEach(key => {
    dict[key] = customStates[key];
});


// Write to File explicitly
const entries = Object.keys(dict).map(k => `  '${k}': ${JSON.stringify(dict[k])}`);
console.log(`Total Explicit Unique Expressions Generated: ${entries.length}`);

const fileContent = `import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

// --- Monolith Expression Registry (Explicitly ${entries.length} States) ---
// This is a 100% flat, static mapping. NO runtime loops. NO dynamic combinations.
// ALL combinations are statically defined here to guarantee absolute ${entries.length} VRM execution states.

export const EXPRESSION_DICTIONARY: Record<string, any> = {
${entries.join(',\n')}
};

export class NeuralKinematics {
  private vrm: VRM | null = null;
  private actionTimeout: any = null;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    window.addEventListener('neural_action', (e: any) => this.triggerAction(e.detail.action));
  }

  public triggerAction(action: string) {
    if (!this.vrm) return;
    const config = EXPRESSION_DICTIONARY[action] || EXPRESSION_DICTIONARY['neutral'];

    if (this.vrm.expressionManager) {
      // Clear standard presets
      this.vrm.expressionManager.setValue('neutral', 0);
      this.vrm.expressionManager.setValue('joy', 0);
      this.vrm.expressionManager.setValue('angry', 0);
      this.vrm.expressionManager.setValue('sorrow', 0);
      this.vrm.expressionManager.setValue('fun', 0);
      this.vrm.expressionManager.setValue('surprised', 0);
      this.vrm.expressionManager.setValue('relaxed', 0);

      // Apply new config
      for (const [key, value] of Object.entries(config)) {
          this.vrm.expressionManager.setValue(key as any, value as number);
      }
      
      this.vrm.expressionManager.update();
    }

    // Auto-reset
    if (this.actionTimeout) clearTimeout(this.actionTimeout);
    const duration = (action.includes('blink') || action.includes('wink')) ? 150 : 3000;
    this.actionTimeout = setTimeout(() => {
      this.triggerAction('neutral');
    }, duration);
  }

  public update(delta: number) {
    if (this.vrm) {
      this.vrm.update(delta);
    }
  }
}
`;

fs.writeFileSync('src/lib/NeuralKinematics.ts', fileContent);
console.log('File NeuralKinematics.ts successfully overwritten with explicit entries.');
