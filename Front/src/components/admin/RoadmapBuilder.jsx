import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    GripVertical,
    Edit2,
    Check,
    X,
} from "lucide-react";

/**
 * RoadmapBuilder component allows admins to create and edit
 * a sequence of steps for a career roadmap.
 * roadmap: Array<{ step: number, title: string, tasks: string[] }>
 */
const RoadmapBuilder = ({ initialRoadmap = [], onChange }) => {
    const [steps, setSteps] = useState(
        initialRoadmap.length > 0
            ? initialRoadmap
            : [{ step: 1, title: "Мавзӯи навро ворид кунед", tasks: [] }]
    );

    const updateSteps = (newSteps) => {
        // Re-index steps
        const indexed = newSteps.map((s, i) => ({ ...s, step: i + 1 }));
        setSteps(indexed);
        if (onChange) onChange(indexed);
    };

    const addStep = () => {
        updateSteps([...steps, { step: steps.length + 1, title: "Қадами нав", tasks: [] }]);
    };

    const removeStep = (index) => {
        updateSteps(steps.filter((_, i) => i !== index));
    };

    const updateStepTitle = (index, title) => {
        const newSteps = [...steps];
        newSteps[index].title = title;
        updateSteps(newSteps);
    };

    const addTask = (stepIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].tasks.push("Вазифаи нав");
        updateSteps(newSteps);
    };

    const updateTask = (stepIndex, taskIndex, value) => {
        const newSteps = [...steps];
        newSteps[stepIndex].tasks[taskIndex] = value;
        updateSteps(newSteps);
    };

    const removeTask = (stepIndex, taskIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].tasks = newSteps[stepIndex].tasks.filter((_, i) => i !== taskIndex);
        updateSteps(newSteps);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Роҳнамои касб (Roadmap)</h3>
                <button
                    onClick={addStep}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 h-auto"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Қадами нав
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card !p-0 overflow-hidden border-border/50"
                        >
                            {/* Step Header */}
                            <div className="flex items-center gap-3 bg-muted/20 px-4 py-3 border-b border-border/50">
                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                    {step.step}
                                </div>
                                <input
                                    value={step.title}
                                    onChange={(e) => updateStepTitle(idx, e.target.value)}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-foreground py-0"
                                    placeholder="Номи қадам..."
                                />
                                <button
                                    onClick={() => removeStep(idx)}
                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-all opacity-40 hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Tasks List */}
                            <div className="p-4 space-y-3">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                    Вазифаҳо / Мавзӯъҳо
                                </div>
                                {step.tasks.map((task, tIdx) => (
                                    <div key={tIdx} className="flex items-center gap-2 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <input
                                            value={task}
                                            onChange={(e) => updateTask(idx, tIdx, e.target.value)}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-foreground/80 py-0"
                                        />
                                        <button
                                            onClick={() => removeTask(idx, tIdx)}
                                            className="p-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 text-rose-500 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={() => addTask(idx)}
                                    className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1 mt-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Иловаи вазифа
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RoadmapBuilder;
