import React from 'react';
import { ChatCoach } from '@/components/features/coach/ChatCoach';
import { AppLayout } from '@/components/shared/AppLayout';
import { Bot, Sparkles, Target } from 'lucide-react';

export default function CoachPage() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              Coach Personnel IA
            </h1>
            <p className="text-gray-500 mt-2">Votre assistant expert pour le TEF IRN.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-3">
             <Target className="text-indigo-600 w-5 h-5" />
             <span className="font-bold text-sm">Objectif B1</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[700px]">
            <ChatCoach mode="full" />
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
               <h3 className="font-bold mb-4 flex items-center gap-2"><Bot className="w-5 h-5" /> Aide</h3>
               <p className="text-sm text-gray-600">Posez vos questions sur la grammaire, demandez des exercices personnalisés ou une correction de vos écrits.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
