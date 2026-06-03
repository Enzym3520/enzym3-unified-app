CREATE OR REPLACE FUNCTION increment_song_upvote(p_request_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE song_requests
  SET upvote_count = upvote_count + 1
  WHERE id = p_request_id;
$$;
