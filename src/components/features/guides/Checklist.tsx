"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

interface ChecklistProps {
  title: string;
  items: string[];
  guideId: string;
}

const Checklist: React.FC<ChecklistProps> = ({ title, items, guideId }) => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const storageKey = `guide-checklist-${guideId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setCheckedItems(JSON.parse(saved));
    } else {
      setCheckedItems(new Array(items.length).fill(false));
    }
  }, [items.length, storageKey]);

  const toggleItem = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
    localStorage.setItem(storageKey, JSON.stringify(newChecked));
  };

  return (
    <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
      <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-2">
        <CheckCircle2 className="text-emerald-500" />
        {title}
      </h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => toggleItem(index)}
            className="flex items-start gap-4 text-left w-full group"
          >
            <div className="mt-1">
              {checkedItems[index] ? (
                <CheckCircle2 className="text-emerald-500 fill-emerald-500/10" size={20} />
              ) : (
                <Circle className="text-emerald-200 group-hover:text-emerald-400 transition-colors" size={20} />
              )}
            </div>
            <span className={`text-lg font-medium transition-colors ${
              checkedItems[index] ? 'text-emerald-700 line-through opacity-60' : 'text-emerald-900'
            }`}>
              {item}
            </span>
          </button>
        ))}
      </div>

      {checkedItems.every(item => item) && checkedItems.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-sm font-bold text-emerald-600 bg-white/50 py-2 px-4 rounded-xl inline-block"
        >
          Bravo ! Vous êtes prêt.
        </motion.p>
      )}
    </div>
  );
};

export default Checklist;
