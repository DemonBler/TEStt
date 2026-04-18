import React, { useState, useEffect } from "react";
import { useSovereignStore } from "../store";
import { Cpu, X } from "lucide-react";
import { motion } from "framer-motion";

export const VRMAnatomyInspector = () => {
    const vrmObject = useSovereignStore(state => state.vrmObject);
    const setVrmInspectorEnabled = useSovereignStore(state => state.setVrmInspectorEnabled);
    const [springBones, setSpringBones] = useState<any[]>([]);
    const [blendShapes, setBlendShapes] = useState<string[]>([]);

    useEffect(() => {
        if (vrmObject) {
            // Extract SpringBone data (jiggle physics)
            if (vrmObject.springBoneManager) {
                setSpringBones(vrmObject.springBoneManager.springBoneGroupList || []);
            }
            
            // Extract BlendShape data (expressions)
            if (vrmObject.expressionManager) {
                const expressions = vrmObject.expressionManager.expressions.map((exp: any) => exp.expressionName);
                setBlendShapes(expressions);
            }
        }
    }, [vrmObject]);

    if (!vrmObject) {
        return (
            <div className="absolute top-4 left-4 z-50 glass p-6 rounded-2xl w-80 shadow-2xl border border-neon-blue/20">
                <p className="text-xs font-mono text-neon-blue uppercase">VRM Anatomy - Sem Modelo Injetado</p>
                <button onClick={() => setVrmInspectorEnabled(false)} className="mt-4 text-[10px] bg-white/10 px-4 py-2 rounded uppercase text-white/50">Fechar Inspetor</button>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 z-50 glass p-6 rounded-2xl w-96 shadow-2xl border border-neon-blue/30 max-h-[80vh] overflow-y-auto"
        >
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-neon-blue/20">
                <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-neon-blue" />
                    <h3 className="text-xs font-mono font-bold uppercase text-neon-blue neon-text">VRM Anatomy Inspector</h3>
                </div>
                <button onClick={() => setVrmInspectorEnabled(false)} className="text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <h4 className="text-[10px] font-mono text-white/60 uppercase mb-2">BlendShapes Registrados (Expressões)</h4>
                    <div className="flex flex-wrap gap-1">
                        {blendShapes.map((bs, i) => (
                            <span key={i} className="text-[8px] font-mono bg-neon-pink/10 text-neon-pink px-2 py-1 rounded border border-neon-pink/20">
                                {bs}
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-[10px] font-mono text-white/60 uppercase mb-2">Grupos de SpringBones (Física)</h4>
                    <div className="space-y-2">
                        {springBones.map((sb, i) => (
                            <div key={i} className="text-[9px] font-mono bg-black/40 p-2 rounded border border-white/5">
                                <p className="text-neon-blue">Grupo Spring #{i + 1}</p>
                                <p className="text-white/50 block">Bones Afetados: {sb.bones?.length || 0}</p>
                                <p className="text-white/50 block">Raio de Colisão: {(sb.hitRadius || 0).toFixed(4)}</p>
                                <p className="text-white/50 block">Rigidez (Stiffness): {(sb.stiffnessForce || 0).toFixed(4)}</p>
                                <p className="text-white/50 block">Arrasto (Drag): {(sb.dragForce || 0).toFixed(4)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-[10px] font-mono text-white/60 uppercase mb-2">Meta Dados</h4>
                    <pre className="text-[8px] font-mono whitespace-pre-wrap text-green-400 bg-black/60 p-2 rounded">
                        {JSON.stringify(vrmObject.meta || {}, null, 2).slice(0, 500) + '...'}
                    </pre>
                </div>
            </div>
        </motion.div>
    );
};
