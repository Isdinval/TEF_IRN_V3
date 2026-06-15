import sys

file_path = 'src/app/practice/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update Question interface
content = content.replace('  instructions: string;\n}', '  instructions: string;\n  explanation?: string;\n}')

# Update mapExerciseToQuestions
old_map = """      category: ex.category,
      instructions: ex.instructions
    }));"""

new_map = """      category: ex.category,
      instructions: ex.instructions,
      explanation: (ex.content as any).explanations?.[i]
    }));"""

content = content.replace(old_map, new_map)

# Update Exercise Render to show explanation
old_check_render = """                {/* Action Footer (Exercise) */}
                <div className="flex justify-center pt-10">
                  {!isChecked ? ("""

new_check_render = """                {/* Explanation Card */}
                <AnimatePresence>
                  {isChecked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <Card className={`p-8 rounded-[2.5rem] border-none shadow-xl ${selected === currentQuestion.correctAnswer ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}`}>
                        <div className="flex items-center gap-3 mb-3 opacity-80 text-[10px] font-black uppercase tracking-widest">
                          <Sparkles size={16} /> Explication Pédagogique
                        </div>
                        <p className="text-lg font-bold leading-relaxed italic">
                          {currentQuestion.explanation || "Bravo ! C'est la bonne réponse."}
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Footer (Exercise) */}
                <div className="flex justify-center pt-10">
                  {!isChecked ? ("""

content = content.replace(old_check_render, new_check_render)

with open(file_path, 'w') as f:
    f.write(content)
