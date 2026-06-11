import sys

file_path = 'src/app/lessons/[id]/complete/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Add import
if 'import { getParcours } from "@/lib/parcours";' not in content:
    content = content.replace('import { createClient } from "@/lib/supabase";', 'import { createClient } from "@/lib/supabase";\nimport { getParcours } from "@/lib/parcours";')

# Add state for current parcours ID
if 'const [parcoursId, setParcoursId] = useState<string | null>(null);' not in content:
    content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [parcoursId, setParcoursId] = useState<string | null>(null);')

# Update fetch logic to also find parcoursId
fetch_parcours_logic = """
      // Find current parcours ID
      const allParcours = await getParcours();
      const currentParcours = allParcours.find(p => p.level === currentLesson.level && p.category === currentLesson.category);
      if (currentParcours) setParcoursId(currentParcours.id);
"""

if 'setParcoursId(currentParcours.id)' not in content:
    # Insert after setting nextLesson
    content = content.replace("setLoading(false);", fetch_parcours_logic + "\n      setLoading(false);")

# Update "Parcours terminé" section
old_finished_section = """                <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 text-center">
                  <p className="text-2xl font-black text-amber-600">Parcours terminé 🎉</p>
                  <p className="text-amber-500 font-medium">Vous avez fini toutes les leçons de ce module !</p>
                </div>
                <Link href="/lessons">
                  <Button variant="outline" size="lg" className="w-full h-16 rounded-2xl border-2 font-black text-lg">
                    Retour au catalogue
                  </Button>
                </Link>"""

new_finished_section = """                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
                  <p className="text-2xl font-black text-emerald-600">🎉 Parcours terminé</p>
                  <p className="text-emerald-500 font-medium mb-6">Félicitations ! Vous avez complété toutes les leçons de ce parcours.</p>
                  <Link href="/parcours">
                    <Button size="lg" className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg">
                      Voir mon parcours
                    </Button>
                  </Link>
                </div>"""

content = content.replace(old_finished_section, new_finished_section)

with open(file_path, 'w') as f:
    f.write(content)
