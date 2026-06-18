import sys

file_path = 'src/app/practice/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Update fetchReviewExercises
old_srs = """  const fetchReviewExercises = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('type', 'qcm')
      .limit(2);

    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };"""

new_srs = """  const fetchReviewExercises = async () => {
    setIsLoading(true);
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);

    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('type', 'qcm')
      .limit(5);

    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[])
        .flatMap(mapExerciseToQuestions)
        .sort(() => Math.random() - 0.5);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };"""

content = content.replace(old_srs, new_srs)

# Update autoStart
old_auto = """  const autoStart = async (t: string, lvl?: string) => {
    setIsLoading(true);
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');
    if (t) query = query.ilike('category', `%${t}%`);
    if (lvl) query = query.eq('level', lvl);

    const { data } = await query.limit(2);
    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };"""

new_auto = """  const autoStart = async (t: string, lvl?: string) => {
    setIsLoading(true);
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);

    let query = supabase.from('exercises').select('*').eq('type', 'qcm');
    if (t) query = query.ilike('category', `%${t}%`);
    if (lvl) query = query.eq('level', lvl);

    const { data } = await query.limit(5);
    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };"""

content = content.replace(old_auto, new_auto)

with open(file_path, 'w') as f:
    f.write(content)
