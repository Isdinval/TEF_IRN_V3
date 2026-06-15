import sys

file_path = 'src/app/practice/page.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_init = """    const init = async () => {
      if (lessonId && !topic) {
        await fetchFromLesson(lessonId);
      } else if (topic) {
        await autoStart(topic, level || undefined);
      } else if (isReviewMode) {
        await fetchReviewExercises();
      }
    };"""

new_init = """    const init = async () => {
      if (lessonId && !topic) {
        await fetchFromLesson(lessonId);
      } else if (topic) {
        await autoStart(topic, level || undefined);
      } else if (isReviewMode) {
        await fetchReviewExercises();
      } else {
        setMode("selection");
      }
    };"""

content = content.replace(old_init, new_init)

with open(file_path, 'w') as f:
    f.write(content)
