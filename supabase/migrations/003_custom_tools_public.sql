-- Add created_by_name column to custom_tools
ALTER TABLE public.custom_tools
ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT '';

-- Ensure RLS is enabled
ALTER TABLE public.custom_tools ENABLE ROW LEVEL SECURITY;

-- Re-create policies idempotently
DROP POLICY IF EXISTS "Users can CRUD own tools" ON public.custom_tools;
CREATE POLICY "Users can CRUD own tools"
  ON public.custom_tools FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read public tools" ON public.custom_tools;
CREATE POLICY "Anyone can read public tools"
  ON public.custom_tools FOR SELECT
  USING (visibility = 'public');

-- Function to increment tool uses count
CREATE OR REPLACE FUNCTION public.increment_tool_uses(tool_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_tools
  SET uses_count = uses_count + 1
  WHERE id = tool_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
