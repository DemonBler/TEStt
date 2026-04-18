// pure node.js CommonJS
const fs = require('fs');

const ARKitBlendshapes = ['browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight', 'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight', 'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookUpLeft', 'eyeLookUpRight', 'eyeSquintLeft', 'eyeSquintRight', 'eyeWideLeft', 'eyeWideRight', 'jawForward', 'jawLeft', 'jawOpen', 'jawRight', 'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight', 'mouthFrownLeft', 'mouthFrownRight', 'mouthFunnel', 'mouthLeft', 'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthPressLeft', 'mouthPressRight', 'mouthPucker', 'mouthRight', 'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretchLeft', 'mouthStretchRight', 'mouthUpperUpLeft', 'mouthUpperUpRight', 'noseSneerLeft', 'noseSneerRight', 'tongueOut'];
const VRM0Blendshapes = ['joy', 'angry', 'sorrow', 'fun', 'surprised', 'blink', 'blink_l', 'blink_r', 'a', 'i', 'u', 'e', 'o', 'lookup', 'lookdown', 'lookleft', 'lookright'];
const dict = {};
dict['neutral'] = { neutral: 1 };
dict['joy'] = { joy: 1 };
dict['angry'] = { angry: 1 };
dict['sorrow'] = { sorrow: 1 };
dict['fun'] = { fun: 1 };
dict['surprised'] = { surprised: 1 };
dict['relaxed'] = { relaxed: 1 };
dict['blink'] = { blink: 1 };
const visemes = ['a', 'i', 'u', 'e', 'o', 'aa', 'ih', 'ou', 'ee', 'oh'];
visemes.forEach(v => { dict[`viseme_${v}`] = { [v]: 1 }; dict[`viseme_${v}_exaggerated`] = { [v]: 1, jawOpen: 0.5 }; });
ARKitBlendshapes.forEach(b => { dict[`arkit_${b}`] = { [b]: 1 }; dict[`arkit_${b}_half`] = { [b]: 0.5 }; dict[`arkit_${b}_max`] = { [b]: 1.5 }; });
const tropes = {
  'ahegao': { joy: 1, tongueOut: 1, eyeLookUpLeft: 1, eyeLookUpRight: 1, mouthOpen: 0.8, jawOpen: 0.5 },
  'dizzy': { eyeRollLeft: 1, eyeRollRight: 1, mouthOpen: 0.3, browInnerUp: 0.8 },
  'starry_eyed': { joy: 1, eyeWideLeft: 1, eyeWideRight: 1, browInnerUp: 1, mouthSmileLeft: 1, mouthSmileRight: 1 },
  'panic': { surprised: 1, eyeWideLeft: 1, eyeWideRight: 1, jawOpen: 0.8, browInnerUp: 0.5 },
  'rage': { angry: 1, browDownLeft: 1, browDownRight: 1, mouthStretchLeft: 1, mouthStretchRight: 1 },
  'sleepy': { blink: 0.7, eyeLookDownLeft: 0.5, eyeLookDownRight: 0.5, mouthOpen: 0.1 },
  'tsundere_pout': { mouthPucker: 0.8, angry: 0.3, browDownLeft: 0.5, eyeLookOutLeft: 0.5 },
  'yandere_stare': { eyeWideLeft: 1, eyeWideRight: 1, mouthSmileLeft: 0.8, mouthSmileRight: 0.8, angry: 0.3, browInnerUp: 0.5 },
  'nervous_sweat': { sorrow: 0.3, blink_l: 0.3, browInnerUp: 0.5, mouthStretchLeft: 0.2 },
  'smug_grin': { fun: 0.5, mouthSmileLeft: 0.8, cheekSquintLeft: 0.4, eyeLookDownRight: 0.3, browDownRight: 0.5 },
  'confused_tilt': { browOuterUpLeft: 0.8, browDownRight: 0.6, mouthPucker: 0.4 },
  'shocked_pale': { surprised: 1, eyeWideLeft: 1, eyeWideRight: 1, jawOpen: 0.8, mouthFunnel: 0.8 },
  'crying_waterfall': { sorrow: 1, eyeSquintLeft: 1, eyeSquintRight: 1, mouthFrownLeft: 1, mouthFrownRight: 1, jawOpen: 0.4 },
  'sparkle_joy': { joy: 1, mouthSmileLeft: 1, mouthSmileRight: 1, browInnerUp: 0.5, cheekSquintLeft: 0.8 },
  'determined': { angry: 0.3, browDownLeft: 0.8, browDownRight: 0.8, mouthPressLeft: 0.8, mouthPressRight: 0.8 },
  'exhausted_sigh': { sorrow: 0.4, jawOpen: 0.4, eyeLookDownLeft: 0.5, eyeLookDownRight: 0.5, blink: 0.8 },
  'mischievous': { fun: 0.8, wink_l: 1, mouthSmileLeft: 0.9, cheekPuff: 0.2 },
  'terrified_scream': { surprised: 1, jawOpen: 1, eyeWideLeft: 1, eyeWideRight: 1, mouthStretchLeft: 1, mouthStretchRight: 1, browInnerUp: 1 }
};
Object.keys(tropes).forEach(k => { dict[k] = tropes[k]; });
const primaryEmotions = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
const getEmotionMap = (emotion, intensity) => {
  const i = intensity / 10;
  switch(emotion) {
    case 'joy': return { joy: i, mouthSmileLeft: i, mouthSmileRight: i };
    case 'trust': return { neutral: i, browInnerUp: i * 0.5, mouthSmileLeft: i * 0.3, mouthSmileRight: i * 0.3 };
    case 'fear': return { surprised: i, browInnerUp: i, eyeWideLeft: i, eyeWideRight: i, mouthStretchLeft: i * 0.5 };
    case 'surprise': return { surprised: i, jawOpen: i * 0.5, browInnerUp: i };
    case 'sadness': return { sorrow: i, mouthFrownLeft: i, mouthFrownRight: i, browInnerUp: i };
    case 'disgust': return { noseSneerLeft: i, noseSneerRight: i, mouthRollLower: i, browDownLeft: i * 0.5 };
    case 'anger': return { angry: i, browDownLeft: i, browDownRight: i, mouthPressLeft: i };
    case 'anticipation': return { eyeWideLeft: i * 0.5, eyeWideRight: i * 0.5, mouthPucker: i * 0.3, browDownLeft: i * 0.2 };
    default: return {};
  }
};
primaryEmotions.forEach(emo => {
  for (let level = 1; level <= 10; level++) {
    dict[`emotion_${emo}_level_${level}`] = getEmotionMap(emo, level);
    dict[`emotion_${emo}_level_${level}_looking_left`] = { ...getEmotionMap(emo, level), eyeLookOutLeft: 0.5, eyeLookInRight: 0.5 };
    dict[`emotion_${emo}_level_${level}_looking_right`] = { ...getEmotionMap(emo, level), eyeLookInLeft: 0.5, eyeLookOutRight: 0.5 };
    dict[`emotion_${emo}_level_${level}_looking_up`] = { ...getEmotionMap(emo, level), eyeLookUpLeft: 0.5, eyeLookUpRight: 0.5 };
    dict[`emotion_${emo}_level_${level}_looking_down`] = { ...getEmotionMap(emo, level), eyeLookDownLeft: 0.5, eyeLookDownRight: 0.5 };
    dict[`emotion_${emo}_level_${level}_winking`] = { ...getEmotionMap(emo, level), eyeBlinkLeft: 1 };
  }
});
const nuances = ['active_listening', 'polite_smile', 'skeptical_frown', 'thoughtful_pout', 'agreeing_nod_smile', 'disagreeing_squint', 'confused_stare', 'realization_gasp', 'bored_sigh', 'impatient_lip_bite', 'sympathetic_wince', 'awkward_smile', 'flirtatious_glance', 'sarcastic_smirk', 'deep_concentration'];
const nuanceMaps = {
  'active_listening': { browInnerUp: 0.2, eyeWideLeft: 0.1, neutral: 0.8 },
  'polite_smile': { mouthSmileLeft: 0.3, mouthSmileRight: 0.3, cheekSquintLeft: 0.1, cheekSquintRight: 0.1 },
  'skeptical_frown': { browDownLeft: 0.6, browOuterUpRight: 0.5, eyeSquintLeft: 0.4 },
  'thoughtful_pout': { mouthPucker: 0.5, eyeLookUpLeft: 0.4, browInnerUp: 0.3 },
  'agreeing_nod_smile': { joy: 0.4, blink: 0.2 },
  'disagreeing_squint': { angry: 0.2, eyeSquintLeft: 0.6, eyeSquintRight: 0.6, mouthPressLeft: 0.4 },
  'confused_stare': { browInnerUp: 0.6, browOuterUpLeft: 0.4, jawLeft: 0.2 },
  'realization_gasp': { surprised: 0.6, jawOpen: 0.3, eyeWideLeft: 0.4 },
  'bored_sigh': { sorrow: 0.2, blink: 0.6, eyeLookDownLeft: 0.4, mouthOpen: 0.1 },
  'impatient_lip_bite': { mouthRollLower: 0.8, jawForward: 0.3, browDownLeft: 0.2 },
  'sympathetic_wince': { cheekSquintLeft: 0.8, cheekSquintRight: 0.8, eyeBlinkLeft: 0.5, browInnerUp: 0.6 },
  'awkward_smile': { mouthSmileLeft: 0.4, mouthSmileRight: 0.4, mouthPressLeft: 0.3, eyeLookDownLeft: 0.3 },
  'flirtatious_glance': { eyeLookRight: 0.6, eyeBlinkRight: 0.8, mouthSmileLeft: 0.5 },
  'sarcastic_smirk': { mouthDimpleLeft: 0.8, eyeRollLeft: 0.6, browOuterUpLeft: 0.5 },
  'deep_concentration': { browDownLeft: 0.8, browDownRight: 0.8, mouthPressLeft: 0.6, eyeLookDownRight: 0.3 }
};
nuances.forEach(n => {
   dict[`conversational_${n}`] = nuanceMaps[n];
   dict[`conversational_${n}_subtle`] = (() => { const d = {}; Object.keys(nuanceMaps[n]).forEach(k => d[k] = nuanceMaps[n][k] * 0.5); return d; })();
   dict[`conversational_${n}_extreme`] = (() => { const d = {}; Object.keys(nuanceMaps[n]).forEach(k => d[k] = Math.min(1, nuanceMaps[n][k] * 1.5)); return d; })();
});
const FACS = ['AU1_InnerBrowRaiser', 'AU2_OuterBrowRaiser', 'AU4_BrowLowerer', 'AU5_UpperLidRaiser', 'AU6_CheekRaiser', 'AU7_LidTightener', 'AU9_NoseWrinkler', 'AU10_UpperLipRaiser', 'AU12_LipCornerPuller', 'AU14_Dimpler', 'AU15_LipCornerDepressor', 'AU17_ChinRaiser', 'AU20_LipStretcher', 'AU23_LipTightener', 'AU24_LipPresser', 'AU25_LipsPart', 'AU26_JawDrop'];
const FACSMaps = {
  'AU1_InnerBrowRaiser': { browInnerUp: 1 },
  'AU2_OuterBrowRaiser': { browOuterUpLeft: 1, browOuterUpRight: 1 },
  'AU4_BrowLowerer': { browDownLeft: 1, browDownRight: 1 },
  'AU5_UpperLidRaiser': { eyeWideLeft: 1, eyeWideRight: 1 },
  'AU6_CheekRaiser': { cheekSquintLeft: 1, cheekSquintRight: 1 },
  'AU7_LidTightener': { eyeSquintLeft: 1, eyeSquintRight: 1 },
  'AU9_NoseWrinkler': { noseSneerLeft: 1, noseSneerRight: 1 },
  'AU10_UpperLipRaiser': { mouthUpperUpLeft: 1, mouthUpperUpRight: 1 },
  'AU12_LipCornerPuller': { mouthSmileLeft: 1, mouthSmileRight: 1 },
  'AU14_Dimpler': { mouthDimpleLeft: 1, mouthDimpleRight: 1 },
  'AU15_LipCornerDepressor': { mouthFrownLeft: 1, mouthFrownRight: 1 },
  'AU17_ChinRaiser': { mouthShrugLower: 1 },
  'AU20_LipStretcher': { mouthStretchLeft: 1, mouthStretchRight: 1 },
  'AU23_LipTightener': { mouthFunnel: 0.5 },
  'AU24_LipPresser': { mouthPressLeft: 1, mouthPressRight: 1 },
  'AU25_LipsPart': { mouthOpen: 0.3 },
  'AU26_JawDrop': { jawOpen: 1 }
};
FACS.forEach(au => { dict[`FACS_${au}`] = FACSMaps[au]; });

const totalKeys = Object.keys(dict).length;

const outCode = `import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

// --- Monolith Expression Registry (Total: ${totalKeys} Valid Mappings) ---
export const EXPRESSION_DICTIONARY: Record<string, any> = ${JSON.stringify(dict, null, 2)};

export class NeuralKinematics {
  private vrm: VRM | null = null;
  private actionTimeout: any = null;

  constructor(vrm: VRM) {
    this.vrm = vrm;
    window.addEventListener('neural_action', (e: any) => this.triggerAction(e.detail.action));
  }

  public triggerAction(action: string) {
    if (!this.vrm) return;
    const config = EXPRESSION_DICTIONARY[action] || Object.values(EXPRESSION_DICTIONARY).find((_, idx) => Object.keys(EXPRESSION_DICTIONARY)[idx] === action) || EXPRESSION_DICTIONARY['neutral'];

    if (this.vrm.expressionManager) {
      this.vrm.expressionManager.setValue('neutral', 0);
      this.vrm.expressionManager.setValue('joy', 0);
      this.vrm.expressionManager.setValue('angry', 0);
      this.vrm.expressionManager.setValue('sorrow', 0);
      this.vrm.expressionManager.setValue('fun', 0);
      this.vrm.expressionManager.setValue('surprised', 0);
      this.vrm.expressionManager.setValue('relaxed', 0);
      
      ['browInnerUp', 'jawOpen', 'eyeWideLeft', 'eyeWideRight', 'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight', 'browDownLeft', 'browDownRight'].forEach(bs => {
         try { this.vrm!.expressionManager!.setValue(bs as any, 0); } catch (e) {}
      });

      for (const [key, value] of Object.entries(config)) {
          this.vrm.expressionManager.setValue(key as any, value as number);
      }
      
      this.vrm.expressionManager.update();
    }

    if (this.actionTimeout) clearTimeout(this.actionTimeout);
    const duration = (action === 'blink' || action.includes('wink')) ? 150 : 3000;
    this.actionTimeout = setTimeout(() => {
      this.triggerNeutral();
    }, duration);
  }
  
  public triggerNeutral() {
     if (!this.vrm || !this.vrm.expressionManager) return;
     for (const [key, value] of Object.entries(EXPRESSION_DICTIONARY['neutral'])) {
          this.vrm.expressionManager.setValue(key as any, value as number);
     }
     ['joy', 'angry', 'sorrow', 'fun', 'surprised', 'relaxed', 'a', 'i', 'u', 'e', 'o'].forEach(k => {
         try { this.vrm!.expressionManager!.setValue(k as any, 0); } catch(e){}
     });
     this.vrm.expressionManager.update();
  }

  public update(delta: number) {
    if (this.vrm) {
      this.vrm.update(delta);
    }
  }
}`;

fs.writeFileSync('src/lib/NeuralKinematics.ts', outCode);
console.log('Successfully wrote', totalKeys, 'expressions.');
