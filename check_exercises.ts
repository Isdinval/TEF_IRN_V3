import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function check() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, content')
    .eq('type', 'qcm')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(ex => {
    console.log(`ID: ${ex.id}, Questions count: ${ex.content?.questions?.length}`);
  });
}

check();
