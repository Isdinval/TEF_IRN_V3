import sys

file_path = 'src/app/practice/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_buttons = """              <Button
                variant="ghost"
                className="w-full h-16 text-zinc-400 hover:text-rose-600 font-black rounded-2xl text-lg transition-all active:scale-95 flex gap-3 uppercase tracking-widest"
                onClick={() => setMode("selection")}
              >
                <RotateCcw size={20} /> Retour au centre libre
              </Button>"""

new_buttons = """              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-16 text-zinc-900 border-2 border-zinc-100 hover:bg-zinc-50 font-black rounded-2xl text-lg transition-all active:scale-95 flex gap-3 uppercase tracking-widest"
                  onClick={() => {
                    setScore(0);
                    setCurrentIdx(0);
                    setSelected(null);
                    setIsChecked(false);
                    setMode("practice");
                  }}
                >
                  <RotateCcw size={20} /> Recommencer
                </Button>
                <Button
                  variant="ghost"
                  className="h-16 text-zinc-400 hover:text-rose-600 font-black rounded-2xl text-lg transition-all active:scale-95 flex gap-3 uppercase tracking-widest"
                  onClick={() => setMode("selection")}
                >
                  Selection <ArrowRight size={20} />
                </Button>
              </div>"""

content = content.replace(old_buttons, new_buttons)

with open(file_path, 'w') as f:
    f.write(content)
