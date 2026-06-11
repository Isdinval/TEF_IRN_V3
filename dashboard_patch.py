import sys

file_path = 'src/app/dashboard/page.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

# 1. Add fetching logic
fetch_logic = """
        // 8. Charger les parcours en cours
        const allParcours = await getParcours();
        const progressPromises = allParcours.map(async (p) => {
          const prog = await getParcoursProgress(user.id, p.level, p.category);
          return { ...p, progress: prog };
        });
        const parcoursWithProgress = await Promise.all(progressPromises);
        const inProgress = parcoursWithProgress.filter(p => p.progress.percent > 0 && p.progress.percent < 100);
        setInProgressParcours(inProgress);
"""

# Find where to insert fetch_logic (after vocab reviews)
for i, line in enumerate(lines):
    if 'setVocabStats(stats);' in line:
        lines.insert(i + 3, fetch_logic)
        break

# 2. Add UI section
ui_section = """
              {/* Parcours en cours Section */}
              {inProgressParcours.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                      <Badge className="rounded-full bg-violet-600 px-3 py-1">En cours</Badge>
                      <span className="text-zinc-400">•</span>
                      Mes parcours
                    </h2>
                    <Link href="/parcours" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">
                      Tout voir
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {inProgressParcours.map((p) => (
                      <Card key={p.id} className="group overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 transition-all hover:-translate-y-1">
                        <CardContent className="p-8">
                          <div className="mb-6 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{p.level} • {p.category}</p>
                              <h3 className="text-xl font-black text-zinc-900 capitalize">{p.category} {p.level}</h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                              <Target size={24} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-zinc-500">
                              <span>Progression</span>
                              <span>{p.progress.completed}/{p.progress.total} leçons</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className="h-full bg-violet-600 transition-all duration-1000"
                                style={{ width: `${p.progress.percent}%` }}
                              />
                            </div>
                          </div>

                          <Button
                            onClick={() => router.push(`/parcours/${p.id}`)}
                            className="mt-6 w-full h-12 rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all"
                          >
                            Continuer
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
"""

# Find where to insert ui_section (after RecentCorrections)
for i, line in enumerate(lines):
    if '<RecentCorrections corrections={recentCorrections} />' in line:
        lines.insert(i + 1, ui_section)
        break

with open(file_path, 'w') as f:
    f.writelines(lines)
