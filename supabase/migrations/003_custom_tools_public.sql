-- Add created_by_name column to custom_tools
ALTER TABLE public.custom_tools
ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT '';

-- Function to increment tool uses count
CREATE OR REPLACE FUNCTION public.increment_tool_uses(tool_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_tools
  SET uses_count = uses_count + 1
  WHERE id = tool_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
