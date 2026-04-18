import { pipeline } from '@xenova/transformers';

let classifier: any = null;

export const loadLimbicBrain = async (onProgress?: (p: number) => void) => {
  if (classifier) return classifier;
  
  classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
    progress_callback: (data: any) => {
      if (data.status === 'progress' && onProgress) {
        onProgress(Math.round(data.progress));
      }
    }
  });
  return classifier;
};

export const analyzeEmotion = async (text: string) => {
  if (!classifier) await loadLimbicBrain();
  
  const results = await classifier(text);
  const { label, score } = results[0];
  
  // Mapping logic to F.A.C.S EXPRESSION_DICTIONARY
  // Logic: Positive -> Joy/Fun, Negative -> Angry/Sorrow
  
  let expression = "neutral";
  const intensity = Math.floor(score * 20); // 1-20 levels in the dictionary
  
  if (label === 'POSITIVE') {
    expression = score > 0.8 ? `joy_level_${intensity}` : `fun_level_${intensity}`;
  } else {
    // Attempting to detect nuance (very simplistic for now)
    if (text.toLowerCase().includes('morrer') || text.toLowerCase().includes('triste') || text.toLowerCase().includes('fim')) {
      expression = `sorrow_level_${intensity}`;
    } else {
      expression = `angry_level_${intensity}`;
    }
  }
  
  return expression;
};
