import sys

file_path = 'src/app/practice/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_lesson = """  const fetchFromLesson = async (lid: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lid)
      .eq('type', 'qcm')
      .limit(1)
      .single();

    if (data) {
      setQuestions(mapExerciseToQuestions(data as ExerciseDB));
      setMode("practice");
    }
    setIsLoading(false);
  };"""

new_lesson = """  const fetchFromLesson = async (lid: string) => {
    setIsLoading(true);
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);

    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lid)
      .eq('type', 'qcm')
      .limit(1)
      .single();

    if (data) {
      setQuestions(mapExerciseToQuestions(data as ExerciseDB));
      setMode("practice");
    }
    setIsLoading(false);
  };"""

content = content.replace(old_lesson, new_lesson)

with open(file_path, 'w') as f:
    f.write(content)
